import postgresClient from '../utils/postgresClient.js';
import { Waiver, CreateWaiverRequest, UpdateWaiverRequest } from '../types/index.js';

export class WaiverService {
  // Adicionar jogador dispensado aos waivers
  async addReleasedPlayer(playerId: number, teamId: number, seasonId: number): Promise<Waiver> {
    const query = `
      INSERT INTO waivers (team_id, player_id, season_id, created_at)
      VALUES ($1, $2, $3, NOW())
      RETURNING *
    `;
    
    const values = [teamId, playerId, seasonId];
    const result = await postgresClient.query(query, values);
    
    return result.rows[0];
  }

  // Obter todos os waivers
  async getAllWaivers(): Promise<Waiver[]> {
    const query = `
      SELECT w.*, p.name as player_name, p.ovr as player_overall, p.age as player_age, t.name as team_name, s.season_number as season_name
      FROM waivers w
      JOIN players p ON w.player_id = p.id
      JOIN teams t ON w.team_id = t.id
      JOIN seasons s ON w.season_id = s.id
      ORDER BY w.created_at DESC
    `;
    
    const result = await postgresClient.query(query);
    return result.rows;
  }

  // Obter waivers por temporada
  async getWaiversBySeason(seasonId: number): Promise<Waiver[]> {
    const query = `
      SELECT w.*, p.name as player_name, p.ovr as player_overall, p.age as player_age, t.name as team_name, s.season_number as season_name
      FROM waivers w
      JOIN players p ON w.player_id = p.id
      JOIN teams t ON w.team_id = t.id
      JOIN seasons s ON w.season_id = s.id
      WHERE w.season_id = $1
      ORDER BY w.created_at DESC
    `;
    
    const result = await postgresClient.query(query, [seasonId]);
    return result.rows;
  }

  // Obter waivers por time
  async getWaiversByTeam(teamId: number): Promise<Waiver[]> {
    const query = `
      SELECT w.*, p.name as player_name, t.name as team_name, s.season_number as season_name
      FROM waivers w
      JOIN players p ON w.player_id = p.id
      JOIN teams t ON w.team_id = t.id
      JOIN seasons s ON w.season_id = s.id
      WHERE w.team_id = $1
      ORDER BY w.created_at DESC
    `;
    
    const result = await postgresClient.query(query, [teamId]);
    return result.rows;
  }

  // Obter waiver específico
  async getWaiverById(id: number): Promise<Waiver | null> {
    const query = `
      SELECT w.*, p.name as player_name, p.ovr as player_overall, p.age as player_age, t.name as team_name, s.season_number as season_name
      FROM waivers w
      JOIN players p ON w.player_id = p.id
      JOIN teams t ON w.team_id = t.id
      JOIN seasons s ON w.season_id = s.id
      WHERE w.id = $1
    `;
    
    const result = await postgresClient.query(query, [id]);
    return result.rows[0] || null;
  }

  // Atualizar waiver
  async updateWaiver(id: number, updateData: UpdateWaiverRequest): Promise<Waiver | null> {
    const allowedFields = ['team_id', 'player_id', 'season_id'];
    const updates: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    for (const [key, value] of Object.entries(updateData)) {
      if (allowedFields.includes(key) && value !== undefined) {
        updates.push(`${key} = $${paramCount}`);
        values.push(value);
        paramCount++;
      }
    }

    if (updates.length === 0) {
      return null;
    }

    values.push(id);
    const query = `
      UPDATE waivers 
      SET ${updates.join(', ')}
      WHERE id = $${paramCount}
      RETURNING *
    `;
    
    const result = await postgresClient.query(query, values);
    return result.rows[0] || null;
  }

  // Deletar waiver
  async deleteWaiver(id: number): Promise<boolean> {
    const query = 'DELETE FROM waivers WHERE id = $1';
    const result = await postgresClient.query(query, [id]);
    return (result.rowCount || 0) > 0;
  }

  // Verificar se um jogador já está nos waivers
  async isPlayerInWaivers(playerId: number, seasonId: number): Promise<boolean> {
    const query = 'SELECT COUNT(*) FROM waivers WHERE player_id = $1 AND season_id = $2';
    const result = await postgresClient.query(query, [playerId, seasonId]);
    return parseInt(result.rows[0]?.count || '0') > 0;
  }

  // Obter waivers disponíveis para claim
  async getAvailableWaivers(seasonId: number): Promise<Waiver[]> {
    const query = `
      SELECT w.*, p.name as player_name, t.name as team_name, s.season_number as season_name
      FROM waivers w
      JOIN players p ON w.player_id = p.id
      JOIN teams t ON w.team_id = t.id
      JOIN seasons s ON w.season_id = s.id
      WHERE w.season_id = $1
      ORDER BY w.created_at ASC
    `;
    
    const result = await postgresClient.query(query, [seasonId]);
    return result.rows;
  }
}
