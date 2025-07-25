import pool from '../utils/postgresClient.js';
import { 
  RosterSeason, 
  CreateRosterSeasonRequest, 
  UpdateRosterSeasonRequest, 
  PaginationParams, 
  PaginatedResponse,
  RosterQueryParams
} from '../types';
import { createError } from '../middlewares/errorHandler.js';

export class RosterService {
  // Verificar se o cliente PostgreSQL está inicializado
  private static checkPostgresClient() {
    if (!pool) {
      throw createError('Cliente PostgreSQL não inicializado. Verifique suas variáveis de ambiente.', 500);
    }
  }

  // Função utilitária para parsear os campos jsonb
  private static parseRosterMinutes(roster: any) {
    if (!roster) return roster;
    return {
      ...roster,
      minutes_starting: typeof roster.minutes_starting === 'string' ? JSON.parse(roster.minutes_starting) : roster.minutes_starting,
      minutes_bench: typeof roster.minutes_bench === 'string' ? JSON.parse(roster.minutes_bench) : roster.minutes_bench,
    };
  }

  // Buscar todos os rosters com paginação e filtros
  static async getAllRosters(params: RosterQueryParams): Promise<PaginatedResponse<RosterSeason>> {
    const { page = 1, limit = 10, sortBy = 'created_at', sortOrder = 'desc', season_id, team_id, rotation_style, game_style, offense_style, defense_style } = params;
    const offset = (page - 1) * limit;

    try {
      this.checkPostgresClient();
      
      let sql = 'SELECT * FROM roster_season WHERE 1=1';
      const values: any[] = [];
      let paramCount = 0;

      // Aplicar filtros
      if (season_id) {
        paramCount++;
        sql += ` AND season_id = $${paramCount}`;
        values.push(season_id);
      }
      if (team_id) {
        paramCount++;
        sql += ` AND team_id = $${paramCount}`;
        values.push(team_id);
      }
      if (rotation_style) {
        paramCount++;
        sql += ` AND rotation_style = $${paramCount}`;
        values.push(rotation_style);
      }
      if (game_style) {
        paramCount++;
        sql += ` AND game_style = $${paramCount}`;
        values.push(game_style);
      }
      if (offense_style) {
        paramCount++;
        sql += ` AND offense_style = $${paramCount}`;
        values.push(offense_style);
      }
      if (defense_style) {
        paramCount++;
        sql += ` AND defense_style = $${paramCount}`;
        values.push(defense_style);
      }

      // Adicionar ordenação e paginação
      sql += ` ORDER BY ${sortBy} ${sortOrder === 'asc' ? 'ASC' : 'DESC'}`;
      sql += ` LIMIT ${limit} OFFSET ${offset}`;

      const { rows } = await pool.query(sql, values);

      // Contar total de registros
      let countSql = 'SELECT COUNT(*) FROM roster_season WHERE 1=1';
      const countValues: any[] = [];
      paramCount = 0;

      if (season_id) {
        paramCount++;
        countSql += ` AND season_id = $${paramCount}`;
        countValues.push(season_id);
      }
      if (team_id) {
        paramCount++;
        countSql += ` AND team_id = $${paramCount}`;
        countValues.push(team_id);
      }
      if (rotation_style) {
        paramCount++;
        countSql += ` AND rotation_style = $${paramCount}`;
        countValues.push(rotation_style);
      }
      if (game_style) {
        paramCount++;
        countSql += ` AND game_style = $${paramCount}`;
        countValues.push(game_style);
      }
      if (offense_style) {
        paramCount++;
        countSql += ` AND offense_style = $${paramCount}`;
        countValues.push(offense_style);
      }
      if (defense_style) {
        paramCount++;
        countSql += ` AND defense_style = $${paramCount}`;
        countValues.push(defense_style);
      }

      const { rows: countRows } = await pool.query(countSql, countValues);
      const total = parseInt(countRows[0].count);
      const totalPages = Math.ceil(total / limit);

      return {
        success: true,
        data: rows.map(this.parseRosterMinutes),
        pagination: {
          page,
          limit,
          total,
          totalPages
        }
      };
    } catch (error) {
      throw error;
    }
  }

  // Buscar roster por ID
  static async getRosterById(id: number): Promise<RosterSeason> {
    try {
      this.checkPostgresClient();
      
      const { rows } = await pool.query('SELECT * FROM roster_season WHERE id = $1', [id]);

      if (rows.length === 0) {
        throw createError('Roster não encontrado', 404);
      }

      return this.parseRosterMinutes(rows[0]);
    } catch (error) {
      throw error;
    }
  }

  // Buscar roster por temporada
  static async getRosterBySeason(seasonId: number): Promise<RosterSeason | null> {
    try {
      this.checkPostgresClient();
      
      const { rows } = await pool.query('SELECT * FROM roster_season WHERE season_id = $1', [seasonId]);

      if (rows.length === 0) {
        return null;
      }

      return this.parseRosterMinutes(rows[0]);
    } catch (error) {
      throw error;
    }
  }

  // Criar novo roster
  static async createRoster(rosterData: CreateRosterSeasonRequest): Promise<RosterSeason> {
    try {
      this.checkPostgresClient();
      
      const values = [
        rosterData.season_id,
        rosterData.team_id,
        rosterData.rotation_style,
        rosterData.minutes_starting ? JSON.stringify(rosterData.minutes_starting) : null,
        rosterData.minutes_bench ? JSON.stringify(rosterData.minutes_bench) : null,
        rosterData.gleague1_player_id,
        rosterData.gleague2_player_id,
        rosterData.total_players_rotation,
        rosterData.age_preference,
        rosterData.game_style,
        rosterData.franchise_player_id,
        rosterData.offense_style,
        rosterData.defense_style,
        rosterData.offensive_tempo,
        rosterData.offensive_rebounding,
        rosterData.defensive_aggression,
        rosterData.defensive_rebounding,
        rosterData.rotation_made || false
      ];

      const { rows } = await pool.query(
        `INSERT INTO roster_season (
          season_id, team_id, rotation_style, minutes_starting, minutes_bench, 
          gleague1_player_id, gleague2_player_id, total_players_rotation, 
          age_preference, game_style, franchise_player_id, offense_style, defense_style,
          offensive_tempo, offensive_rebounding, defensive_aggression, defensive_rebounding,
          rotation_made
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18) RETURNING *`,
        values
      );

      return this.parseRosterMinutes(rows[0]);
    } catch (error) {
      throw error;
    }
  }

  // Atualizar roster
  static async updateRoster(id: number, rosterData: Partial<CreateRosterSeasonRequest>): Promise<RosterSeason> {
    try {
      this.checkPostgresClient();
      
      // Construir query dinamicamente baseada nos campos fornecidos
      const updates: string[] = [];
      const values: any[] = [];
      let paramCount = 0;

      if (rosterData.season_id !== undefined) {
        paramCount++;
        updates.push(`season_id = $${paramCount}`);
        values.push(rosterData.season_id);
      }
      if (rosterData.team_id !== undefined) {
        paramCount++;
        updates.push(`team_id = $${paramCount}`);
        values.push(rosterData.team_id);
      }
      if (rosterData.rotation_style !== undefined) {
        paramCount++;
        updates.push(`rotation_style = $${paramCount}`);
        values.push(rosterData.rotation_style);
      }
      if (rosterData.minutes_starting !== undefined) {
        paramCount++;
        updates.push(`minutes_starting = $${paramCount}`);
        values.push(rosterData.minutes_starting ? JSON.stringify(rosterData.minutes_starting) : undefined);
      }
      if (rosterData.minutes_bench !== undefined) {
        paramCount++;
        updates.push(`minutes_bench = $${paramCount}`);
        values.push(rosterData.minutes_bench ? JSON.stringify(rosterData.minutes_bench) : undefined);
      }
      if (rosterData.gleague1_player_id !== undefined) {
        paramCount++;
        updates.push(`gleague1_player_id = $${paramCount}`);
        values.push(rosterData.gleague1_player_id);
      }
      if (rosterData.gleague2_player_id !== undefined) {
        paramCount++;
        updates.push(`gleague2_player_id = $${paramCount}`);
        values.push(rosterData.gleague2_player_id);
      }
      if (rosterData.total_players_rotation !== undefined) {
        paramCount++;
        updates.push(`total_players_rotation = $${paramCount}`);
        values.push(rosterData.total_players_rotation);
      }
      if (rosterData.age_preference !== undefined) {
        paramCount++;
        updates.push(`age_preference = $${paramCount}`);
        values.push(rosterData.age_preference);
      }
      if (rosterData.game_style !== undefined) {
        paramCount++;
        updates.push(`game_style = $${paramCount}`);
        values.push(rosterData.game_style);
      }
      if (rosterData.franchise_player_id !== undefined) {
        paramCount++;
        updates.push(`franchise_player_id = $${paramCount}`);
        values.push(rosterData.franchise_player_id);
      }
      if (rosterData.offense_style !== undefined) {
        paramCount++;
        updates.push(`offense_style = $${paramCount}`);
        values.push(rosterData.offense_style);
      }
      if (rosterData.defense_style !== undefined) {
        paramCount++;
        updates.push(`defense_style = $${paramCount}`);
        values.push(rosterData.defense_style);
      }
      if (rosterData.offensive_tempo !== undefined) {
        paramCount++;
        updates.push(`offensive_tempo = $${paramCount}`);
        values.push(rosterData.offensive_tempo);
      }
      if (rosterData.offensive_rebounding !== undefined) {
        paramCount++;
        updates.push(`offensive_rebounding = $${paramCount}`);
        values.push(rosterData.offensive_rebounding);
      }
      if (rosterData.defensive_aggression !== undefined) {
        paramCount++;
        updates.push(`defensive_aggression = $${paramCount}`);
        values.push(rosterData.defensive_aggression);
      }
      if (rosterData.defensive_rebounding !== undefined) {
        paramCount++;
        updates.push(`defensive_rebounding = $${paramCount}`);
        values.push(rosterData.defensive_rebounding);
      }
      if (rosterData.rotation_made !== undefined) {
        paramCount++;
        updates.push(`rotation_made = $${paramCount}`);
        values.push(rosterData.rotation_made);
      }

      if (updates.length === 0) {
        throw createError('Nenhum campo fornecido para atualização', 400);
      }

      paramCount++;
      values.push(id);

      const { rows } = await pool.query(
        `UPDATE roster_season SET ${updates.join(', ')} WHERE id = $${paramCount} RETURNING *`,
        values
      );

      if (rows.length === 0) {
        throw createError('Roster não encontrado', 404);
      }

      return this.parseRosterMinutes(rows[0]);
    } catch (error) {
      throw error;
    }
  }

  // Deletar roster
  static async deleteRoster(id: number): Promise<void> {
    try {
      this.checkPostgresClient();
      
      const { rowCount } = await pool.query('DELETE FROM roster_season WHERE id = $1', [id]);

      if (rowCount === 0) {
        throw createError('Roster não encontrado', 404);
      }
    } catch (error) {
      throw error;
    }
  }

  // Atualizar apenas o status de rotation_made
  static async updateRotationMade(id: number, rotationMade: boolean): Promise<RosterSeason> {
    try {
      this.checkPostgresClient();
      
      const { rows } = await pool.query(
        'UPDATE roster_season SET rotation_made = $1 WHERE id = $2 RETURNING *',
        [rotationMade, id]
      );

      if (rows.length === 0) {
        throw createError('Roster não encontrado', 404);
      }

      return this.parseRosterMinutes(rows[0]);
    } catch (error) {
      throw error;
    }
  }

  // Buscar roster da temporada ativa
  static async getActiveSeasonRoster(): Promise<RosterSeason | null> {
    try {
      this.checkPostgresClient();
      
      const { rows } = await pool.query(
        `SELECT rs.* FROM roster_season rs 
         JOIN seasons s ON rs.season_id = s.id 
         WHERE s.is_active = true 
         LIMIT 1`
      );

      if (rows.length === 0) {
        return null;
      }

      return this.parseRosterMinutes(rows[0]);
    } catch (error) {
      throw error;
    }
  }

  // Buscar todos os rosters com informações dos times e jogadores
  static async getAllRostersWithDetails(params: { season_id?: number; sortBy?: string; sortOrder?: 'asc' | 'desc' } = {}): Promise<any[]> {
    try {
      this.checkPostgresClient();
      
      const { season_id, sortBy = 'created_at', sortOrder = 'desc' } = params;
      
      let sql = `
        SELECT 
          rs.*,
          t.name as team_name,
          t.abbreviation as team_abbreviation
        FROM roster_season rs
        JOIN teams t ON rs.team_id = t.id
        WHERE 1=1
      `;
      
      const values: any[] = [];
      let paramCount = 0;

      if (season_id) {
        paramCount++;
        sql += ` AND rs.season_id = $${paramCount}`;
        values.push(season_id);
      }

      sql += ` ORDER BY ${sortBy} ${sortOrder === 'asc' ? 'ASC' : 'DESC'}`;

      const { rows } = await pool.query(sql, values);

      // Para cada roster, buscar informações dos jogadores
      const rostersWithDetails = await Promise.all(
        rows.map(async (roster) => {
          const parsedRoster = this.parseRosterMinutes(roster);
          
          // Buscar informações dos jogadores titulares
          const startingPlayers: any[] = [];
          if (parsedRoster.minutes_starting && parsedRoster.minutes_starting.length > 0) {
            const playerIds = parsedRoster.minutes_starting.map(([id]: [number, number]) => id);
            if (playerIds.length > 0) {
              const { rows: playerRows } = await pool.query(
                `SELECT id, name, position FROM players WHERE id = ANY($1)`,
                [playerIds]
              );
              
              // Mapear jogadores com suas posições e minutos
              parsedRoster.minutes_starting.forEach(([playerId, minutes]: [number, number]) => {
                const player = playerRows.find(p => p.id === playerId);
                if (player) {
                  startingPlayers.push({
                    id: player.id,
                    name: player.name,
                    position: player.position,
                    minutes
                  });
                }
              });
            }
          }

          // Buscar informações dos jogadores reservas
          const benchPlayers: any[] = [];
          if (parsedRoster.minutes_bench && parsedRoster.minutes_bench.length > 0) {
            const playerIds = parsedRoster.minutes_bench.map(([id]: [number, number]) => id);
            if (playerIds.length > 0) {
              const { rows: playerRows } = await pool.query(
                `SELECT id, name, position FROM players WHERE id = ANY($1)`,
                [playerIds]
              );
              
              // Mapear jogadores com suas posições e minutos
              parsedRoster.minutes_bench.forEach(([playerId, minutes]: [number, number]) => {
                const player = playerRows.find(p => p.id === playerId);
                if (player) {
                  benchPlayers.push({
                    id: player.id,
                    name: player.name,
                    position: player.position,
                    minutes
                  });
                }
              });
            }
          }

          // Buscar informações dos jogadores G-League
          const gleaguePlayers: any[] = [];
          if (parsedRoster.gleague1_player_id || parsedRoster.gleague2_player_id) {
            const gleagueIds = [parsedRoster.gleague1_player_id, parsedRoster.gleague2_player_id].filter(Boolean);
            if (gleagueIds.length > 0) {
              const { rows: playerRows } = await pool.query(
                `SELECT id, name, position FROM players WHERE id = ANY($1)`,
                [gleagueIds]
              );
              gleaguePlayers.push(...playerRows);
            }
          }

          // Buscar informações do franchise player se aplicável
          let franchisePlayer = null;
          if (parsedRoster.franchise_player_id) {
            const { rows: playerRows } = await pool.query(
              `SELECT id, name, position FROM players WHERE id = $1`,
              [parsedRoster.franchise_player_id]
            );
            if (playerRows.length > 0) {
              franchisePlayer = playerRows[0];
            }
          }

          return {
            ...parsedRoster,
            team_name: roster.team_name,
            team_abbreviation: roster.team_abbreviation,
            starting_players: startingPlayers,
            bench_players: benchPlayers,
            gleague_players: gleaguePlayers,
            franchise_player: franchisePlayer
          };
        })
      );

      return rostersWithDetails;
    } catch (error) {
      throw error;
    }
  }
}
