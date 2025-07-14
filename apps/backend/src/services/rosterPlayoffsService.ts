import pool from '../utils/postgresClient.js';
import { 
  RosterPlayoffs, 
  CreateRosterPlayoffsRequest, 
  UpdateRosterPlayoffsRequest, 
  RosterPlayoffsQueryParams,
  PaginatedResponse 
} from '../types';
import { createError } from '../middlewares/errorHandler.js';

export class RosterPlayoffsService {
  private static checkPostgresClient() {
    if (!pool) {
      throw createError('Cliente PostgreSQL não inicializado', 500);
    }
  }

  // Método para parsear os minutos do JSONB
  private static parseRosterMinutes(roster: any): RosterPlayoffs {
    const parseMinutes = (value: any): [number, number][] => {
      if (!value || value === 'null' || value === null) {
        return [];
      }
      if (typeof value === 'string') {
        try {
          return JSON.parse(value);
        } catch (error) {
          console.warn('Erro ao fazer parse dos minutos:', error);
          return [];
        }
      }
      // Se já é array, retorna direto
      if (Array.isArray(value)) {
        return value;
      }
      return [];
    };

    return {
      ...roster,
      minutes_starting: parseMinutes(roster.minutes_starting),
      minutes_bench: parseMinutes(roster.minutes_bench)
    };
  }

  // Buscar todos os rosters playoffs com paginação e filtros
  static async getAllRosters(params: RosterPlayoffsQueryParams): Promise<PaginatedResponse<RosterPlayoffs>> {
    const { page = 1, limit = 10, sortBy = 'created_at', sortOrder = 'desc', season_id, team_id, rotation_style, game_style, offense_style, defense_style } = params;
    const offset = (page - 1) * limit;

    try {
      this.checkPostgresClient();
      
      let sql = 'SELECT * FROM roster_playoffs WHERE 1=1';
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
      let countSql = 'SELECT COUNT(*) FROM roster_playoffs WHERE 1=1';
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

  // Buscar roster playoffs por ID
  static async getRosterById(id: number): Promise<RosterPlayoffs | null> {
    try {
      this.checkPostgresClient();
      
      const { rows } = await pool.query('SELECT * FROM roster_playoffs WHERE id = $1', [id]);

      if (rows.length === 0) {
        return null;
      }

      return this.parseRosterMinutes(rows[0]);
    } catch (error) {
      throw error;
    }
  }

  // Buscar roster playoffs por temporada
  static async getRosterBySeason(seasonId: number): Promise<RosterPlayoffs | null> {
    try {
      this.checkPostgresClient();
      
      const { rows } = await pool.query('SELECT * FROM roster_playoffs WHERE season_id = $1', [seasonId]);

      if (rows.length === 0) {
        return null;
      }

      return this.parseRosterMinutes(rows[0]);
    } catch (error) {
      throw error;
    }
  }

  // Criar novo roster playoffs
  static async createRoster(rosterData: CreateRosterPlayoffsRequest): Promise<RosterPlayoffs> {
    try {
      this.checkPostgresClient();
      
      const values = [
        rosterData.season_id,
        rosterData.team_id,
        rosterData.rotation_style,
        rosterData.minutes_starting ? JSON.stringify(rosterData.minutes_starting) : JSON.stringify([]),
        rosterData.minutes_bench ? JSON.stringify(rosterData.minutes_bench) : JSON.stringify([]),
        rosterData.total_players_rotation,
        rosterData.age_preference,
        rosterData.game_style,
        rosterData.franchise_player_id,
        rosterData.offense_style,
        rosterData.defense_style
      ];

      const { rows } = await pool.query(
        `INSERT INTO roster_playoffs (
          season_id, team_id, rotation_style, minutes_starting, minutes_bench, 
          total_players_rotation, age_preference, game_style, franchise_player_id, 
          offense_style, defense_style
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING *`,
        values
      );

      return this.parseRosterMinutes(rows[0]);
    } catch (error) {
      throw error;
    }
  }

  // Atualizar roster playoffs
  static async updateRoster(id: number, rosterData: Partial<CreateRosterPlayoffsRequest>): Promise<RosterPlayoffs> {
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
        values.push(rosterData.minutes_starting ? JSON.stringify(rosterData.minutes_starting) : JSON.stringify([]));
      }
      if (rosterData.minutes_bench !== undefined) {
        paramCount++;
        updates.push(`minutes_bench = $${paramCount}`);
        values.push(rosterData.minutes_bench ? JSON.stringify(rosterData.minutes_bench) : JSON.stringify([]));
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

      if (updates.length === 0) {
        throw createError('Nenhum campo fornecido para atualização', 400);
      }

      paramCount++;
      values.push(id);

      const { rows } = await pool.query(
        `UPDATE roster_playoffs SET ${updates.join(', ')} WHERE id = $${paramCount} RETURNING *`,
        values
      );

      if (rows.length === 0) {
        throw createError('Roster playoffs não encontrado', 404);
      }

      return this.parseRosterMinutes(rows[0]);
    } catch (error) {
      throw error;
    }
  }

  // Deletar roster playoffs
  static async deleteRoster(id: number): Promise<void> {
    try {
      this.checkPostgresClient();
      
      const { rowCount } = await pool.query('DELETE FROM roster_playoffs WHERE id = $1', [id]);

      if (rowCount === 0) {
        throw createError('Roster playoffs não encontrado', 404);
      }
    } catch (error) {
      throw error;
    }
  }

  // Buscar roster playoffs da temporada ativa
  static async getActiveSeasonRoster(): Promise<RosterPlayoffs | null> {
    try {
      this.checkPostgresClient();
      
      const { rows } = await pool.query(
        `SELECT rp.* FROM roster_playoffs rp 
         JOIN seasons s ON rp.season_id = s.id 
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
}
