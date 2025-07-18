import pool from '../utils/postgresClient.js';

export class SeasonService {
  static async getAllSeasons(){
    const { rows } = await pool.query(`
      SELECT * FROM seasons
      ORDER BY season_number ASC
    `);
    return rows;
  }

  static async getSeasonsFromActive() {
    // Busca a season ativa
    const { rows: activeRows } = await pool.query('SELECT season_number FROM seasons WHERE is_active = true LIMIT 1');
    if (!activeRows.length) return [];
    const activeSeasonNumber = activeRows[0].season_number;
    // Busca todas as seasons a partir da ativa (inclusive)
    const { rows } = await pool.query(`
      SELECT * FROM seasons
      WHERE season_number >= $1
      ORDER BY season_number ASC
    `, [activeSeasonNumber]);
    return rows;
  }

  static async getSeasonById(id: number) {
    const { rows } = await pool.query('SELECT * FROM seasons WHERE id = $1', [id]);
    return rows[0];
  }

  static async createSeason(data: any) {
    const { season_number, total_seasons, is_active, created_at, year } = data;
    const { rows } = await pool.query(
      'INSERT INTO seasons (season_number, total_seasons, is_active, created_at, year) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [season_number, total_seasons, is_active, created_at, year]
    );
    return rows[0];
  }

  static async updateSeason(id: number, data: any) {
    const { season_number, total_seasons, is_active, created_at, year } = data;
    const { rows } = await pool.query(
      'UPDATE seasons SET season_number = $1, total_seasons = $2, is_active = $3, created_at = $4, year = $5 WHERE id = $6 RETURNING *',
      [season_number, total_seasons, is_active, created_at, year, id]
    );
    return rows[0];
  }

  static async deleteSeason(id: number) {
    await pool.query('DELETE FROM seasons WHERE id = $1', [id]);
  }

  static async getActiveSeason() {
    const { rows } = await pool.query('SELECT * FROM seasons WHERE is_active = true LIMIT 1');
    return rows[0];
  }

  static async advanceToNextSeason() {
    // Buscar temporada ativa e próxima em uma única query
    const { rows: seasonsData } = await pool.query(`
      WITH active_season AS (
        SELECT * FROM seasons WHERE is_active = true LIMIT 1
      ),
      next_season AS (
        SELECT s.* 
        FROM seasons s, active_season a
        WHERE s.season_number > a.season_number 
        ORDER BY s.season_number ASC 
        LIMIT 1
      )
      SELECT 
        a.id as current_id,
        a.season_number as current_season_number,
        n.id as next_id,
        n.season_number as next_season_number,
        n.*
      FROM active_season a
      CROSS JOIN next_season n
    `);
    
    if (!seasonsData.length) {
      throw new Error('Nenhuma temporada ativa encontrada ou não há próxima temporada disponível');
    }
    
    const { current_id, next_id, ...nextSeason } = seasonsData[0];
    
    // Inicia uma transação
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      
      // Atualizar temporadas em uma única query
      await client.query(`
        UPDATE seasons 
        SET is_active = CASE 
          WHEN id = $1 THEN false 
          WHEN id = $2 THEN true 
          ELSE is_active 
        END
        WHERE id IN ($1, $2)
      `, [current_id, next_id]);
      
      await client.query('COMMIT');
      
      // Executar todas as funcionalidades adicionais em paralelo
      const results = {
        season: nextSeason,
        tradesCancelled: 0,
        tradeLimitsReset: false,
        draftPicksAdded: 0,
        draftPicksSeasonId: 0,
        deadlinesUpdated: 0
      };
      
      // Executar operações em paralelo para melhor performance
      const [tradesResult, picksResult, deadlinesResult] = await Promise.all([
        this.cancelPendingTrades(),
        this.addDraftPicksForNextSeason(next_id),
        this.updateDeadlinesForNextSeason(next_id)
      ]);
      
      results.tradesCancelled = tradesResult.cancelled;
      results.draftPicksAdded = picksResult.added;
      results.draftPicksSeasonId = picksResult.targetSeasonId;
      results.deadlinesUpdated = deadlinesResult.updated;
      
      // Retorna a nova temporada ativa com os resultados das operações
      return results;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  static async goBackToPreviousSeason() {
    // Busca a temporada ativa atual
    const { rows: activeRows } = await pool.query('SELECT * FROM seasons WHERE is_active = true LIMIT 1');
    if (!activeRows.length) {
      throw new Error('Nenhuma temporada ativa encontrada');
    }
    
    const currentActive = activeRows[0];
    
    // Busca a temporada anterior
    const { rows: previousRows } = await pool.query(
      'SELECT * FROM seasons WHERE season_number < $1 ORDER BY season_number DESC LIMIT 1',
      [currentActive.season_number]
    );
    
    if (!previousRows.length) {
      throw new Error('Não há temporada anterior disponível');
    }
    
    const previousSeason = previousRows[0];
    
    // Inicia uma transação
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      
      // Desativa a temporada atual
      await client.query(
        'UPDATE seasons SET is_active = false WHERE id = $1',
        [currentActive.id]
      );
      
      // Ativa a temporada anterior
      await client.query(
        'UPDATE seasons SET is_active = true WHERE id = $1',
        [previousSeason.id]
      );
      
      await client.query('COMMIT');
      
      // Retorna a nova temporada ativa
      return previousSeason;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  static async changeActiveSeason(seasonId: number) {
    // Verifica se a temporada existe
    const { rows: seasonRows } = await pool.query('SELECT * FROM seasons WHERE id = $1', [seasonId]);
    if (!seasonRows.length) {
      throw new Error('Temporada não encontrada');
    }
    
    const targetSeason = seasonRows[0];
    
    // Inicia uma transação
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      
      // Desativa todas as temporadas
      await client.query('UPDATE seasons SET is_active = false');
      
      // Ativa a temporada selecionada
      await client.query(
        'UPDATE seasons SET is_active = true WHERE id = $1',
        [seasonId]
      );
      
      await client.query('COMMIT');
      
      // Retorna a nova temporada ativa
      return targetSeason;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  // 1. Cancelar todas as trades com status 'proposed' ou 'pending'
  static async cancelPendingTrades() {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      
      // Atualizar trades e participantes em uma única operação
      const { rowCount } = await client.query(`
        WITH cancelled_trades AS (
          UPDATE trades 
          SET status = 'cancelled'
          WHERE status IN ('pending', 'proposed')
          RETURNING id
        )
        UPDATE trade_participants 
        SET response_status = 'rejected', 
            responded_at = NOW() 
        WHERE trade_id IN (SELECT id FROM cancelled_trades)
      `);
      
      await client.query('COMMIT');
      return { cancelled: rowCount || 0 };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  // 2. Adicionar picks de 1º e 2º round para todos os times na próxima temporada
  static async addDraftPicksForNextSeason(nextSeasonId: number) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      
      // Criar picks em uma única operação usando CTE
      const { rowCount } = await client.query(`
        WITH max_season AS (
          SELECT COALESCE(MAX(season_id), 0) as max_season_id 
          FROM draft_picks
        ),
        max_pick AS (
          SELECT COALESCE(MAX(pick_number), 0) as max_pick_number
          FROM draft_picks, max_season
          WHERE season_id = max_season.max_season_id
        ),
        teams_with_picks AS (
          SELECT 
            t.id as team_id,
            (ms.max_season_id + 1) as target_season_id,
            (mp.max_pick_number + (ROW_NUMBER() OVER (ORDER BY t.id) * 2 - 1)) as pick_1,
            (mp.max_pick_number + (ROW_NUMBER() OVER (ORDER BY t.id) * 2)) as pick_2
          FROM teams t, max_season ms, max_pick mp
        )
        INSERT INTO draft_picks (season_id, team_id, pick_number)
        SELECT target_season_id, team_id, pick_1 FROM teams_with_picks
        UNION ALL
        SELECT target_season_id, team_id, pick_2 FROM teams_with_picks
      `);
      
      // Buscar o target_season_id para retornar
      const { rows: targetSeasonRows } = await client.query(`
        SELECT COALESCE(MAX(season_id), 0) + 1 as target_season_id 
        FROM draft_picks
      `);
      
      await client.query('COMMIT');
      return { added: rowCount || 0, targetSeasonId: targetSeasonRows[0].target_season_id };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  // 3. Atualizar deadlines para a próxima temporada
  static async updateDeadlinesForNextSeason(nextSeasonId: number) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      
      // Atualizar deadlines em uma única operação usando CTE
      const { rowCount } = await client.query(`
        WITH current_deadlines AS (
          SELECT * FROM deadlines WHERE is_active = true
        ),
        deactivated_deadlines AS (
          UPDATE deadlines SET is_active = false WHERE is_active = true
        )
        INSERT INTO deadlines (season_id, title, description, deadline_date, deadline_time, type, is_active)
        SELECT 
          $1 as season_id,
          title,
          description,
          (deadline_date::date + INTERVAL '7 days')::date as deadline_date,
          deadline_time,
          type,
          true as is_active
        FROM current_deadlines
      `, [nextSeasonId]);
      
      await client.query('COMMIT');
      return { updated: rowCount || 0 };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
}

export default SeasonService; 