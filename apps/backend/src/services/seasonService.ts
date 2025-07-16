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
    // Busca a temporada ativa atual
    const { rows: activeRows } = await pool.query('SELECT * FROM seasons WHERE is_active = true LIMIT 1');
    if (!activeRows.length) {
      throw new Error('Nenhuma temporada ativa encontrada');
    }
    
    const currentActive = activeRows[0];
    
    // Busca a próxima temporada
    const { rows: nextRows } = await pool.query(
      'SELECT * FROM seasons WHERE season_number > $1 ORDER BY season_number ASC LIMIT 1',
      [currentActive.season_number]
    );
    
    if (!nextRows.length) {
      throw new Error('Não há próxima temporada disponível');
    }
    
    const nextSeason = nextRows[0];
    
    // Inicia uma transação
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      
      // Desativa a temporada atual
      await client.query(
        'UPDATE seasons SET is_active = false WHERE id = $1',
        [currentActive.id]
      );
      
      // Ativa a próxima temporada
      await client.query(
        'UPDATE seasons SET is_active = true WHERE id = $1',
        [nextSeason.id]
      );
      
      await client.query('COMMIT');
      
      // Retorna a nova temporada ativa
      return nextSeason;
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
}

export default SeasonService; 