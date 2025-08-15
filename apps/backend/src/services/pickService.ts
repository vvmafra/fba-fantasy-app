import pool from '../utils/postgresClient.js';

export class PickService {
  static async getAllPicks() {
    const { rows } = await pool.query(`
      SELECT picks.*, 
             CAST(SPLIT_PART(s.year, '/', 1) AS INTEGER) as season_year, 
             t1.name as original_team_name, 
             t2.name as current_team_name
      FROM picks
      JOIN seasons s ON picks.season_id = s.id
      JOIN teams t1 ON picks.original_team_id = t1.id
      JOIN teams t2 ON picks.current_team_id = t2.id
      ORDER BY season_year DESC, picks.round DESC
    `);
    return rows;
  }

  static async getPickById(id: number) {
    const { rows } = await pool.query('SELECT * FROM picks WHERE id = $1', [id]);
    return rows[0];
  }

  static async createPick(data: any) {
    const { original_team_id, current_team_id, round, season_id } = data;
    const { rows } = await pool.query(
      'INSERT INTO picks (original_team_id, current_team_id, round, season_id) VALUES ($1, $2, $3, $4) RETURNING *',
      [original_team_id, current_team_id, round, season_id]
    );
    return rows[0];
  }

  static async updatePick(id: number, data: any) {
    const { original_team_id, current_team_id, round, season_id } = data;
    const { rows } = await pool.query(
      'UPDATE picks SET original_team_id = $1, current_team_id = $2, round = $3, season_id = $4 WHERE id = $5 RETURNING *',
      [original_team_id, current_team_id, round, season_id, id]
    );
    return rows[0];
  }

  static async deletePick(id: number) {
    await pool.query('DELETE FROM picks WHERE id = $1', [id]);
  }

  static async getTeamFuturePicks(teamId: number) {
    // Buscar a season ativa
    const { rows: seasonRows } = await pool.query('SELECT id FROM seasons WHERE is_active = true LIMIT 1');
    const activeSeason = seasonRows[0];
    if (!activeSeason) return { my_own_picks: [], received_picks: [], lost_picks: [], swaps: [] };

    // Query base para picks futuras
    const baseQuery = `
      SELECT picks.*, 
             CAST(SPLIT_PART(s.year, '/', 1) AS INTEGER) as season_year, 
             t1.name as original_team_name, 
             t2.name as current_team_name
      FROM picks
      JOIN seasons s ON picks.season_id = s.id
      JOIN teams t1 ON picks.original_team_id = t1.id
      JOIN teams t2 ON picks.current_team_id = t2.id
      WHERE picks.season_id > $1
    `;

    // My own picks
    const { rows: myOwn } = await pool.query(
      baseQuery + ' AND picks.current_team_id = $2 AND picks.original_team_id = $2',
      [activeSeason.id, teamId]
    );
    // Received picks
    const { rows: received } = await pool.query(
      baseQuery + ' AND picks.current_team_id = $2 AND picks.original_team_id <> $2',
      [activeSeason.id, teamId]
    );
    // Lost picks
    const { rows: lost } = await pool.query(
      baseQuery + ' AND picks.original_team_id = $2 AND picks.current_team_id <> $2',
      [activeSeason.id, teamId]
    );

    // Buscar swaps do time
    const { rows: swaps } = await pool.query(`
      SELECT 
        ps.*,
        pa.round as pick_a_round,
        sa.year as pick_a_year,
        pa.original_team_id as pick_a_original_team_id,
        ta_original.name as pick_a_original_team_name,
        ta_original.abbreviation as pick_a_original_team_abbreviation,
        pb.round as pick_b_round,
        sb.year as pick_b_year,
        pb.original_team_id as pick_b_original_team_id,
        tb_original.name as pick_b_original_team_name,
        tb_original.abbreviation as pick_b_original_team_abbreviation,
        t_owner.name as owned_by_team_name,
        t_owner.abbreviation as owned_by_team_abbreviation
      FROM pick_swaps ps
      JOIN picks pa ON ps.pick_a_id = pa.id
      JOIN picks pb ON ps.pick_b_id = pb.id
      JOIN seasons sa ON pa.season_id = sa.id
      JOIN seasons sb ON pb.season_id = sb.id
      JOIN teams ta_original ON pa.original_team_id = ta_original.id
      JOIN teams tb_original ON pb.original_team_id = tb_original.id
      JOIN teams t_owner ON ps.owned_by_team_id = t_owner.id
      WHERE ps.owned_by_team_id = $1 AND (sa.year > $2 OR sb.year > $2)
      ORDER BY ps.created_at DESC
    `, [teamId, activeSeason.year]);

    return {
      my_own_picks: myOwn,
      received_picks: received,
      lost_picks: lost,
      swaps: swaps
    };
  }
}

export default PickService;
