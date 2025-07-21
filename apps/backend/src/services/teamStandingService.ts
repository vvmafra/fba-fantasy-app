import pool from '../utils/postgresClient.js';
import { 
  TeamStanding, 
  CreateTeamStandingRequest, 
  UpdateTeamStandingRequest, 
  TeamStandingWithDetails 
} from '../types';

export class TeamStandingService {
  // Buscar todos os standings
  static async getAllStandings(): Promise<TeamStandingWithDetails[]> {
    const { rows } = await pool.query(`
      SELECT 
        ts.*,
        t.name as team_name,
        t.abbreviation as team_abbreviation,
        t.conference as team_conference,
        s.season_number as season_name
      FROM team_standings ts
      JOIN teams t ON ts.team_id = t.id
      JOIN seasons s ON ts.season_id = s.id
      ORDER BY ts.season_id DESC, ts.final_position ASC
    `);
    
    return rows.map(row => ({
      id: row.id,
      season_id: row.season_id,
      team_id: row.team_id,
      final_position: row.final_position,
      seed: row.seed,
      elimination_round: row.elimination_round,
      created_at: row.created_at,
      team: {
        id: row.team_id,
        name: row.team_name,
        abbreviation: row.team_abbreviation,
        conference: row.team_conference
      },
      season: {
        id: row.season_id,
        name: row.season_name
      }
    }));
  }

  // Buscar standings por temporada
  static async getStandingsBySeason(seasonId: number): Promise<TeamStandingWithDetails[]> {
    const { rows } = await pool.query(`
      SELECT 
        ts.*,
        t.name as team_name,
        t.abbreviation as team_abbreviation,
        t.conference as team_conference,
        s.season_number as season_name
      FROM team_standings ts
      JOIN teams t ON ts.team_id = t.id
      JOIN seasons s ON ts.season_id = s.id
      WHERE ts.season_id = $1
      ORDER BY ts.final_position ASC
    `, [seasonId]);
    
    // Se não há standings para esta temporada, retornar array vazio
    if (rows.length === 0) {
      return [];
    }
    
    return rows.map(row => ({
      id: row.id,
      season_id: row.season_id,
      team_id: row.team_id,
      final_position: row.final_position,
      seed: row.seed,
      elimination_round: row.elimination_round,
      created_at: row.created_at,
      team: {
        id: row.team_id,
        name: row.team_name,
        abbreviation: row.team_abbreviation,
        conference: row.team_conference
      },
      season: {
        id: row.season_id,
        name: row.season_name
      }
    }));
  }

  // Buscar standings por time
  static async getStandingsByTeam(teamId: number): Promise<TeamStandingWithDetails[]> {
    const { rows } = await pool.query(`
      SELECT 
        ts.*,
        t.name as team_name,
        t.abbreviation as team_abbreviation,
        t.conference as team_conference,
        s.season_number as season_name
      FROM team_standings ts
      JOIN teams t ON ts.team_id = t.id
      JOIN seasons s ON ts.season_id = s.id
      WHERE ts.team_id = $1
      ORDER BY ts.season_id DESC
    `, [teamId]);
    
    return rows.map(row => ({
      id: row.id,
      season_id: row.season_id,
      team_id: row.team_id,
      final_position: row.final_position,
      seed: row.seed,
      elimination_round: row.elimination_round,
      created_at: row.created_at,
      team: {
        id: row.team_id,
        name: row.team_name,
        abbreviation: row.team_abbreviation,
        conference: row.team_conference
      },
      season: {
        id: row.season_id,
        name: row.season_name
      }
    }));
  }

  // Buscar standing específico
  static async getStandingById(id: number): Promise<TeamStandingWithDetails | null> {
    const { rows } = await pool.query(`
      SELECT 
        ts.*,
        t.name as team_name,
        t.abbreviation as team_abbreviation,
        t.conference as team_conference,
        s.season_number as season_name
      FROM team_standings ts
      JOIN teams t ON ts.team_id = t.id
      JOIN seasons s ON ts.season_id = s.id
      WHERE ts.id = $1
    `, [id]);
    
    if (rows.length === 0) return null;
    
    const row = rows[0];
    return {
      id: row.id,
      season_id: row.season_id,
      team_id: row.team_id,
      final_position: row.final_position,
      seed: row.seed,
      elimination_round: row.elimination_round,
      created_at: row.created_at,
      team: {
        id: row.team_id,
        name: row.team_name,
        abbreviation: row.team_abbreviation,
        conference: row.team_conference
      },
      season: {
        id: row.season_id,
        name: row.season_name
      }
    };
  }

  // Buscar standing por temporada e time
  static async getStandingBySeasonAndTeam(seasonId: number, teamId: number, client?: any): Promise<TeamStandingWithDetails | null> {
    const queryClient = client || pool;
    const { rows } = await queryClient.query(`
      SELECT 
        ts.*,
        t.name as team_name,
        t.abbreviation as team_abbreviation,
        t.conference as team_conference,
        s.season_number as season_name
      FROM team_standings ts
      JOIN teams t ON ts.team_id = t.id
      JOIN seasons s ON ts.season_id = s.id
      WHERE ts.season_id = $1 AND ts.team_id = $2
    `, [seasonId, teamId]);
    
    if (rows.length === 0) return null;
    
    const row = rows[0];
    return {
      id: row.id,
      season_id: row.season_id,
      team_id: row.team_id,
      final_position: row.final_position,
      seed: row.seed,
      elimination_round: row.elimination_round,
      created_at: row.created_at,
      team: {
        id: row.team_id,
        name: row.team_name,
        abbreviation: row.team_abbreviation,
        conference: row.team_conference
      },
      season: {
        id: row.season_id,
        name: row.season_name
      }
    };
  }

  // Criar novo standing
  static async createStanding(standingData: CreateTeamStandingRequest, client?: any): Promise<TeamStanding> {
    const { season_id, team_id, final_position, seed, elimination_round } = standingData;
        
    // Validar se já existe um standing para este time nesta temporada (só se não estiver em transação)
    if (!client) {
      const existing = await this.getStandingBySeasonAndTeam(season_id, team_id);
      if (existing) {
        throw new Error('Já existe um standing para este time nesta temporada');
      }
    }

    const queryClient = client || pool;
    const { rows } = await queryClient.query(`
      INSERT INTO team_standings (season_id, team_id, final_position, seed, elimination_round)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `, [season_id, team_id, final_position, seed, elimination_round]);
    
    return rows[0];
  }

  // Atualizar standing
  static async updateStanding(id: number, standingData: UpdateTeamStandingRequest, client?: any): Promise<TeamStanding> {
    const fields = [];
    const values = [];
    let idx = 1;
        
    if (standingData.season_id !== undefined) {
      fields.push(`season_id = $${idx++}`);
      values.push(standingData.season_id);
    }
    if (standingData.team_id !== undefined) {
      fields.push(`team_id = $${idx++}`);
      values.push(standingData.team_id);
    }
    if (standingData.final_position !== undefined) {
      fields.push(`final_position = $${idx++}`);
      values.push(standingData.final_position);
    }
    if (standingData.seed !== undefined) {
      fields.push(`seed = $${idx++}`);
      values.push(standingData.seed);
    }
    if (standingData.elimination_round !== undefined) {
      fields.push(`elimination_round = $${idx++}`);
      values.push(standingData.elimination_round);
    }
    
    if (fields.length === 0) throw new Error('Nenhum campo para atualizar');
    values.push(id);
    
    const sql = `UPDATE team_standings SET ${fields.join(', ')} WHERE id = $${idx} RETURNING *`;
    
    const queryClient = client || pool;
    const { rows } = await queryClient.query(sql, values);
    
    if (rows.length === 0) {
      throw new Error('Standing não encontrado');
    }
    
    return rows[0];
  }

  // Deletar standing
  static async deleteStanding(id: number): Promise<void> {
    const { rowCount } = await pool.query('DELETE FROM team_standings WHERE id = $1', [id]);
    if (rowCount === 0) {
      throw new Error('Standing não encontrado');
    }
  }

  // Criar ou atualizar múltiplos standings de uma vez
  static async upsertManyStandings(standings: CreateTeamStandingRequest[]): Promise<TeamStanding[]> {
    if (standings.length === 0) return [];

    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
            
      // Buscar todos os standings existentes de uma vez
      const seasonIds = [...new Set(standings.map(s => s.season_id))];
      const teamIds = standings.map(s => s.team_id);
      
      const { rows: existingStandings } = await client.query(`
        SELECT id, season_id, team_id, final_position, seed, elimination_round
        FROM team_standings 
        WHERE season_id = ANY($1) AND team_id = ANY($2)
      `, [seasonIds, teamIds]);
      
      // Criar mapa para busca rápida
      const existingMap = new Map();
      existingStandings.forEach(s => {
        existingMap.set(`${s.season_id}-${s.team_id}`, s);
      });
      
      const results: TeamStanding[] = [];
      const batchSize = 10; // Processar em lotes de 10
      
      for (let i = 0; i < standings.length; i += batchSize) {
        const batch = standings.slice(i, i + batchSize);
        
        for (const standing of batch) {
          const { season_id, team_id, final_position, seed, elimination_round } = standing;
                    
          // Verificar se já existe usando o mapa
          const existing = existingMap.get(`${season_id}-${team_id}`);
          
          if (existing) {
            // Atualizar existente
            const updated = await this.updateStanding(existing.id, {
              id: existing.id,
              final_position,
              seed,
              elimination_round
            }, client);
            results.push(updated);
          } else {
            // Criar novo
            const created = await this.createStanding(standing, client);
            results.push(created);
          }
        }
      }
      
      await client.query('COMMIT');
      return results;
      
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Erro no upsertManyStandings:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  // Buscar campeões por temporada
  static async getChampionsBySeason(seasonId: number): Promise<TeamStandingWithDetails[]> {
    const { rows } = await pool.query(`
      SELECT 
        ts.*,
        t.name as team_name,
        t.abbreviation as team_abbreviation,
        t.conference as team_conference,
        s.season_number as season_name
      FROM team_standings ts
      JOIN teams t ON ts.team_id = t.id
      JOIN seasons s ON ts.season_id = s.id
      WHERE ts.season_id = $1 AND ts.elimination_round = 5
      ORDER BY ts.final_position ASC
    `, [seasonId]);
    
    return rows.map(row => ({
      id: row.id,
      season_id: row.season_id,
      team_id: row.team_id,
      final_position: row.final_position,
      seed: row.seed,
      elimination_round: row.elimination_round,
      created_at: row.created_at,
      team: {
        id: row.team_id,
        name: row.team_name,
        abbreviation: row.team_abbreviation,
        conference: row.team_conference
      },
      season: {
        id: row.season_id,
        name: row.season_name
      }
    }));
  }

  // Buscar times que foram aos playoffs por temporada
  static async getPlayoffTeamsBySeason(seasonId: number): Promise<TeamStandingWithDetails[]> {
    const { rows } = await pool.query(`
      SELECT 
        ts.*,
        t.name as team_name,
        t.abbreviation as team_abbreviation,
        t.conference as team_conference,
        s.season_number as season_name
      FROM team_standings ts
      JOIN teams t ON ts.team_id = t.id
      JOIN seasons s ON ts.season_id = s.id
      WHERE ts.season_id = $1 AND ts.elimination_round > 0
      ORDER BY ts.elimination_round DESC, ts.final_position ASC
    `, [seasonId]);
    
    return rows.map(row => ({
      id: row.id,
      season_id: row.season_id,
      team_id: row.team_id,
      final_position: row.final_position,
      seed: row.seed,
      elimination_round: row.elimination_round,
      created_at: row.created_at,
      team: {
        id: row.team_id,
        name: row.team_name,
        abbreviation: row.team_abbreviation,
        conference: row.team_conference
      },
      season: {
        id: row.season_id,
        name: row.season_name
      }
    }));
  }
} 