import pool from '../utils/postgresClient.js';

export class PickService {
  static async getAllPicks() {
    // Buscar a season ativa primeiro
    const { rows: seasonRows } = await pool.query('SELECT id FROM seasons WHERE is_active = true LIMIT 1');
    const activeSeason = seasonRows[0];
    
    if (!activeSeason) {
      // Se não houver temporada ativa, retornar array vazio
      return [];
    }

    const { rows } = await pool.query(`
      SELECT picks.*, 
             CAST(SUBSTRING(s.year, 1, 4) AS INTEGER) as season_year, 
             t1.name as original_team_name, 
             t2.name as current_team_name
      FROM picks
      JOIN seasons s ON picks.season_id = s.id
      JOIN teams t1 ON picks.original_team_id = t1.id
      JOIN teams t2 ON picks.current_team_id = t2.id
      WHERE picks.season_id >= $1
      ORDER BY season_year DESC, picks.round ASC
    `, [activeSeason.id]);
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

  // Obter picks futuras de um time
  static async getTeamFuturePicks(teamId: number) {
    try {
      // Buscar temporada ativa
      const { rows: activeSeasonRows } = await pool.query(
        'SELECT id, season_number FROM seasons WHERE is_active = true LIMIT 1'
      );
      
      if (activeSeasonRows.length === 0) {
        throw new Error('Nenhuma temporada ativa encontrada');
      }
      
      const activeSeason = activeSeasonRows[0];
      
      // Buscar picks futuras do time - apenas picks futuras (season_id > activeSeason.id)
      const { rows: picksRows } = await pool.query(`
        SELECT 
          p.id,
          p.round,
          CAST(SUBSTRING(s.year, 1, 4) AS INTEGER) as season_year,
          p.original_team_id,
          p.current_team_id,
          t.name as original_team_name,
          t2.name as current_team_name
        FROM picks p
        JOIN seasons s ON p.season_id = s.id
        LEFT JOIN teams t ON p.original_team_id = t.id
        LEFT JOIN teams t2 ON p.current_team_id = t2.id
        WHERE p.current_team_id = $1 
          AND p.season_id > $2
        ORDER BY p.season_id ASC, p.round ASC
      `, [teamId, activeSeason.id]);
      
      // Buscar picks que o time perdeu em trades (estão com outros times mas eram originalmente dele)
      const { rows: lostPicksRows } = await pool.query(`
        SELECT 
          p.id,
          p.round,
          CAST(SUBSTRING(s.year, 1, 4) AS INTEGER) as season_year,
          p.original_team_id,
          p.current_team_id,
          t.name as original_team_name,
          t2.name as current_team_name
        FROM picks p
        JOIN seasons s ON p.season_id = s.id
        LEFT JOIN teams t ON p.original_team_id = t.id
        LEFT JOIN teams t2 ON p.current_team_id = t2.id
        WHERE p.original_team_id = $1 
          AND p.current_team_id != $1
          AND p.season_id > $2
        ORDER BY p.season_id ASC, p.round ASC
      `, [teamId, activeSeason.id]);
      
      // Separar picks próprias e recebidas
      const myOwnPicks = picksRows.filter(pick => pick.original_team_id === teamId);
      const receivedPicks = picksRows.filter(pick => pick.original_team_id !== teamId);
      
      return {
        my_own_picks: myOwnPicks,
        received_picks: receivedPicks,
        lost_picks: lostPicksRows
      };
    } catch (error) {
      throw error;
    }
  }
}

export default PickService;
