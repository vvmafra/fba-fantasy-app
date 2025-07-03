import pool from '@/utils/postgresClient';

export class SeasonService {
  static async getAllSeasons() {
    const { rows } = await pool.query('SELECT * FROM seasons');
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