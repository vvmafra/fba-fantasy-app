import pool from '../utils/postgresClient.js';
import { LeagueCap, CreateLeagueCapRequest, UpdateLeagueCapRequest } from '../types/index.js';

export class LeagueCapService {
  // Buscar todos os league caps
  static async getAllLeagueCaps(): Promise<LeagueCap[]> {
    const { rows } = await pool.query(`
      SELECT lc.*, s.season_number, s.year
      FROM league_cap lc
      JOIN seasons s ON lc.season_id = s.id
      ORDER BY lc.created_at DESC
    `);
    return rows;
  }

  // Buscar league cap ativo (último criado)
  static async getActiveLeagueCap(): Promise<LeagueCap | null> {
    const { rows } = await pool.query(`
      SELECT lc.*, s.season_number, s.year
      FROM league_cap lc
      JOIN seasons s ON lc.season_id = s.id
      WHERE lc.is_active = true
      ORDER BY lc.created_at DESC
      LIMIT 1
    `);
    return rows[0] || null;
  }

  // Buscar league cap por ID
  static async getLeagueCapById(id: number): Promise<LeagueCap | null> {
    const { rows } = await pool.query(`
      SELECT lc.*, s.season_number, s.year
      FROM league_cap lc
      JOIN seasons s ON lc.season_id = s.id
      WHERE lc.id = $1
    `, [id]);
    return rows[0] || null;
  }

  // Buscar league cap por season_id
  static async getLeagueCapBySeasonId(seasonId: number): Promise<LeagueCap | null> {
    const { rows } = await pool.query(`
      SELECT lc.*, s.season_number, s.year
      FROM league_cap lc
      JOIN seasons s ON lc.season_id = s.id
      WHERE lc.season_id = $1
      ORDER BY lc.created_at DESC
      LIMIT 1
    `, [seasonId]);
    return rows[0] || null;
  }

  // Criar novo league cap
  static async createLeagueCap(data: CreateLeagueCapRequest): Promise<LeagueCap> {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Buscar CAP médio atual da liga
      const currentAverageCap = await this.getCurrentLeagueAverageCap();

      // Desativar todos os league caps existentes
      await client.query('UPDATE league_cap SET is_active = false');

      // Criar novo league cap ativo com o CAP médio atual
      const { rows } = await client.query(`
        INSERT INTO league_cap (season_id, min_cap, max_cap, avg_cap, is_active)
        VALUES ($1, $2, $3, $4, true)
        RETURNING *
      `, [data.season_id, data.min_cap, data.max_cap, currentAverageCap]);

      await client.query('COMMIT');
      return rows[0];
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  // Atualizar league cap
  static async updateLeagueCap(id: number, data: UpdateLeagueCapRequest): Promise<LeagueCap> {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Se estiver ativando este league cap, desativar os outros
      if (data.is_active) {
        await client.query('UPDATE league_cap SET is_active = false WHERE id != $1', [id]);
      }

      // Construir query de atualização dinamicamente
      const fields = [];
      const values = [];
      let idx = 1;

      if (data.season_id !== undefined) {
        fields.push(`season_id = $${idx++}`);
        values.push(data.season_id);
      }
      if (data.min_cap !== undefined) {
        fields.push(`min_cap = $${idx++}`);
        values.push(data.min_cap);
      }
      if (data.max_cap !== undefined) {
        fields.push(`max_cap = $${idx++}`);
        values.push(data.max_cap);
      }
      if (data.is_active !== undefined) {
        fields.push(`is_active = $${idx++}`);
        values.push(data.is_active);
      }

      if (fields.length === 0) {
        throw new Error('Nenhum campo para atualizar');
      }

      values.push(id);
      const sql = `UPDATE league_cap SET ${fields.join(', ')} WHERE id = $${idx} RETURNING *`;
      const { rows } = await client.query(sql, values);

      await client.query('COMMIT');
      return rows[0];
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  // Deletar league cap
  static async deleteLeagueCap(id: number): Promise<void> {
    await pool.query('DELETE FROM league_cap WHERE id = $1', [id]);
  }

  // Buscar CAP atual da liga (média dos 8 melhores jogadores de todos os times)
  static async getCurrentLeagueAverageCap(): Promise<number> {
    const { rows } = await pool.query(`
      SELECT AVG(team_cap) as average_cap
      FROM (
        SELECT 
          t.id,
          COALESCE(SUM(p.ovr), 0) as team_cap
        FROM teams t
        LEFT JOIN (
          SELECT 
            team_id,
            ovr,
            ROW_NUMBER() OVER (PARTITION BY team_id ORDER BY ovr DESC) as rn
          FROM players 
          WHERE ovr IS NOT NULL AND team_id IS NOT NULL
        ) p ON t.id = p.team_id AND p.rn <= 8
        GROUP BY t.id
      ) team_caps
    `);
    
    return Math.round(rows[0].average_cap || 0);
  }
}

export default LeagueCapService; 