import pool from '../utils/postgresClient';
import { Team, CreateTeamRequest, UpdateTeamRequest } from '../types';

export class TeamService {
  // Buscar todos os times
  static async getAllTeams(): Promise<Team[]> {
    const { rows } = await pool.query('SELECT * FROM teams ORDER BY id');
    return rows;
  }

  // Buscar todos os times com CAP calculado
  static async getAllTeamsWithCAP(): Promise<(Team & { cap: number })[]> {
    // Query para pegar os 8 maiores overalls de cada time
    const { rows } = await pool.query(`
      SELECT 
        t.id,
        t.name,
        t.abbreviation,
        t.owner_id,
        t.player_order,
        COALESCE(SUM(p.ovr), 0) as cap
      FROM teams t
      LEFT JOIN (
        SELECT 
          team_id,
          ovr,
          ROW_NUMBER() OVER (PARTITION BY team_id ORDER BY ovr DESC) as rn
        FROM players 
        WHERE ovr IS NOT NULL
      ) p ON t.id = p.team_id AND p.rn <= 8
      GROUP BY t.id, t.name, t.abbreviation, t.owner_id, t.player_order
      ORDER BY cap DESC
    `);
    
    return rows;
  }

  // Buscar time por ID
  static async getTeamById(id: number): Promise<Team | null> {
    const { rows } = await pool.query('SELECT * FROM teams WHERE id = $1', [id]);
    return rows[0] || null;
  }

  // Buscar times por owner_id (usuário autenticado)
  static async getTeamsByOwnerId(ownerId: number): Promise<Team[]> {
    const { rows } = await pool.query('SELECT * FROM teams WHERE owner_id = $1 ORDER BY id', [ownerId]);
    console.log("rows: ", rows);
    return rows;
  }

  // Criar novo time
  static async createTeam(teamData: CreateTeamRequest): Promise<Team> {
    const { name, abbreviation, owner_id } = teamData;
    const { rows } = await pool.query(
      'INSERT INTO teams (name, abbreviation, owner_id) VALUES ($1, $2, $3) RETURNING *',
      [name, abbreviation, owner_id || null]
    );
    return rows[0];
  }

  // Atualizar time
  static async updateTeam(id: number, teamData: UpdateTeamRequest): Promise<Team> {
    const fields = [];
    const values = [];
    let idx = 1;
    if (teamData.name !== undefined) {
      fields.push(`name = $${idx++}`);
      values.push(teamData.name);
    }
    if (teamData.abbreviation !== undefined) {
      fields.push(`abbreviation = $${idx++}`);
      values.push(teamData.abbreviation);
    }
    if (teamData.owner_id !== undefined) {
      fields.push(`owner_id = $${idx++}`);
      values.push(teamData.owner_id);
    }
    if (teamData.player_order !== undefined) {
      fields.push(`player_order = $${idx++}`);
      values.push(JSON.stringify(teamData.player_order));
    }
    if (fields.length === 0) throw new Error('Nenhum campo para atualizar');
    values.push(id);
    const sql = `UPDATE teams SET ${fields.join(', ')} WHERE id = $${idx} RETURNING *`;
    const { rows } = await pool.query(sql, values);
    return rows[0];
  }

  // Deletar time
  static async deleteTeam(id: number): Promise<void> {
    await pool.query('DELETE FROM teams WHERE id = $1', [id]);
  }
} 