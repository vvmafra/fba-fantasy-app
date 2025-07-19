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
      
      // Executar operações de reversão em paralelo
      const results = {
        season: previousSeason,
        deadlinesRestored: 0,
        picksDeleted: 0,
        assetsRemoved: 0
      };
      
      const [deadlinesResult, picksResult] = await Promise.all([
        this.restorePreviousDeadlines(previousSeason.id),
        this.deleteFutureDraftPicks(previousSeason.id)
      ]);
      
      results.deadlinesRestored = deadlinesResult.restored;
      results.picksDeleted = picksResult.deleted;
      results.assetsRemoved = picksResult.assetsRemoved || 0;
      
      // Retorna a nova temporada ativa com os resultados das operações
      return results;
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
      // Se não encontrar trades para cancelar, apenas retorna 0 sem erro
      if (error instanceof Error && error.message && error.message.includes('no rows affected')) {
        return { cancelled: 0 };
      }
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
      
      console.log(`addDraftPicksForNextSeason - nextSeasonId: ${nextSeasonId} (tipo: ${typeof nextSeasonId})`);
      
      // Calcular target_season_id como nextSeasonId + 5
      const targetSeasonId = Number(nextSeasonId) + 5;
      
      console.log(`addDraftPicksForNextSeason - targetSeasonId: ${targetSeasonId} (tipo: ${typeof targetSeasonId})`);
      
      // Buscar informações da temporada alvo para obter o ano
      let { rows: targetSeason } = await client.query(`
        SELECT year, season_number FROM seasons WHERE id = $1
      `, [targetSeasonId]);
      
      let targetYear: string;
      let targetSeasonNumber: number;
      
      if (targetSeason.length === 0) {
        // Se a temporada alvo não existe, criar ela
        const { rows: nextSeason } = await client.query(`
          SELECT year, season_number FROM seasons WHERE id = $1
        `, [nextSeasonId]);
        
        if (nextSeason.length === 0) {
          throw new Error(`Temporada ${nextSeasonId} não encontrada`);
        }
        
        // Calcular ano e número da temporada alvo
        const currentYear = parseInt(nextSeason[0].year.split('/')[0]);
        targetYear = `${currentYear + 5}/${(currentYear + 6).toString().slice(-2)}`;
        targetSeasonNumber = nextSeason[0].season_number + 5;
        
        // Criar a temporada alvo
        const { rows: newSeason } = await client.query(`
          INSERT INTO seasons (season_number, total_seasons, is_active, year, created_at)
          VALUES ($1, $2, $3, $4, NOW())
          RETURNING id, year, season_number
        `, [targetSeasonNumber, 10, false, targetYear]);
        
        targetSeason = newSeason;
        // Atualizar targetSeasonId para usar o ID real da temporada criada
        const actualTargetSeasonId = Number(newSeason[0].id);
        console.log(`Temporada alvo criada: ${targetYear} (season_number: ${targetSeasonNumber}, id: ${actualTargetSeasonId})`);
        
        // Usar o ID real da temporada criada em vez do calculado
        console.log(`Tentando inserir picks para nova temporada ${actualTargetSeasonId} (tipo: ${typeof actualTargetSeasonId})`);
        
        const { rowCount } = await client.query(`
          INSERT INTO picks (season_id, original_team_id, current_team_id, round)
          SELECT 
            $1::integer as season_id,
            CAST(t.id AS integer) as original_team_id,
            CAST(t.id AS integer) as current_team_id,
            1 as round
          FROM teams t
          UNION ALL
          SELECT 
            $1::integer as season_id,
            CAST(t.id AS integer) as original_team_id,
            CAST(t.id AS integer) as current_team_id,
            2 as round
          FROM teams t
        `, [actualTargetSeasonId]);

        console.log(`Adicionadas ${rowCount} picks para temporada ${actualTargetSeasonId} (ano ${targetYear})`);
        
        await client.query('COMMIT');
        return { added: rowCount || 0, targetSeasonId: actualTargetSeasonId, targetYear };
      }
      
      // Se chegou aqui, a temporada já existe
      targetYear = targetSeason[0].year;
      targetSeasonNumber = targetSeason[0].season_number;
      
      // Verificar se já existem picks para esta temporada
      const { rows: existingPicks } = await client.query(`
        SELECT COUNT(*) as count FROM picks WHERE season_id = $1
      `, [Number(targetSeasonId)]);
      
      if (existingPicks[0].count > 0) {
        console.log(`Picks já existem para temporada ${targetSeasonId}, pulando criação`);
        await client.query('COMMIT');
        return { added: 0, targetSeasonId: Number(targetSeasonId), targetYear, reason: 'Picks já existem' };
      }
      
      // Criar picks para cada time (1ª e 2ª rodada)
      // Cada time terá original_team_id e current_team_id iguais inicialmente
      console.log(`Tentando inserir picks para temporada ${targetSeasonId} (tipo: ${typeof targetSeasonId})`);
      
      const { rowCount } = await client.query(`
        INSERT INTO picks (season_id, original_team_id, current_team_id, round)
        SELECT 
          $1::integer as season_id,
          CAST(t.id AS integer) as original_team_id,
          CAST(t.id AS integer) as current_team_id,
          1 as round
        FROM teams t
        UNION ALL
        SELECT 
          $1::integer as season_id,
          CAST(t.id AS integer) as original_team_id,
          CAST(t.id AS integer) as current_team_id,
          2 as round
        FROM teams t
      `, [Number(targetSeasonId)]);

      console.log(`Adicionadas ${rowCount} picks para temporada ${targetSeasonId} (ano ${targetYear})`);
      
      await client.query('COMMIT');
      return { added: rowCount || 0, targetSeasonId: Number(targetSeasonId), targetYear };
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
      
      // Verificar se já existem deadlines para a próxima temporada
      const { rows: existingDeadlines } = await client.query(`
        SELECT COUNT(*) as count FROM deadlines WHERE season_id = $1
      `, [nextSeasonId]);
      
      if (existingDeadlines[0].count > 0) {
        // Se já existem deadlines, apenas ativar os existentes e desativar os atuais
        const { rowCount } = await client.query(`
          WITH deactivated_current AS (
            UPDATE deadlines SET is_active = false WHERE is_active = true
          )
          UPDATE deadlines 
          SET is_active = true 
          WHERE season_id = $1
        `, [nextSeasonId]);
        
        await client.query('COMMIT');
        return { updated: rowCount || 0, reused: true };
      }
      
      // Se não existem, criar novos deadlines
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
      return { updated: rowCount || 0, reused: false };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  // 4. Restaurar deadlines anteriores (oposto do updateDeadlinesForNextSeason)
  static async restorePreviousDeadlines(previousSeasonId: number) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      
      // Desativar deadlines atuais e ativar os da temporada anterior
      const { rowCount } = await client.query(`
        WITH deactivated_current AS (
          UPDATE deadlines SET is_active = false WHERE is_active = true
        )
        UPDATE deadlines 
        SET is_active = true 
        WHERE season_id = $1
      `, [previousSeasonId]);
      
      await client.query('COMMIT');
      return { restored: rowCount || 0 };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  // 5. Deletar picks futuras (oposto do addDraftPicksForNextSeason)
  static async deleteFutureDraftPicks(previousSeasonId: number) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      
      // Calcular season_id das picks a serem deletadas (previousSeasonId + 5)
      const targetSeasonId = Number(previousSeasonId) + 6;
      
      // Verificar se existem picks para deletar
      const { rows: existingPicks } = await client.query(`
        SELECT COUNT(*) as count FROM picks WHERE season_id = $1
      `, [targetSeasonId]);
      
      if (existingPicks[0].count === 0) {
        await client.query('COMMIT');
        return { deleted: 0, reason: 'Nenhuma pick encontrada para deletar' };
      }
      
      // Primeiro, remover referências em trade_assets para evitar violação de foreign key
      const { rowCount: assetsRemoved } = await client.query(`
        DELETE FROM trade_assets 
        WHERE pick_id IN (SELECT id FROM picks WHERE season_id = $1)
      `, [targetSeasonId]);
      
      // Agora deletar as picks da season_id + 5
      const { rowCount } = await client.query(`
        DELETE FROM picks WHERE season_id = $1
      `, [targetSeasonId]);
      
      await client.query('COMMIT');
      return { 
        deleted: rowCount || 0, 
        assetsRemoved: assetsRemoved || 0,
        targetSeasonId 
      };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
}

export default SeasonService; 