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
}

export default SeasonService; 