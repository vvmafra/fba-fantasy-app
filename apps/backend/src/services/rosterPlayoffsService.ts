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
    const { page = 1, limit = 10, sortBy = 'updated_at', sortOrder = 'desc', season_id, team_id, rotation_style, game_style, offense_style, defense_style } = params;
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
        rosterData.defense_style,
        rosterData.offensive_tempo,
        rosterData.offensive_rebounding,
        rosterData.defensive_aggression,
        rosterData.defensive_rebounding,
        rosterData.rotation_made || false
      ];

      const { rows } = await pool.query(
        `INSERT INTO roster_playoffs (
          season_id, team_id, rotation_style, minutes_starting, minutes_bench, 
          total_players_rotation, age_preference, game_style, franchise_player_id, 
          offense_style, defense_style, offensive_tempo, offensive_rebounding, 
          defensive_aggression, defensive_rebounding, rotation_made, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, 
                 (NOW() AT TIME ZONE 'America/Sao_Paulo'), (NOW() AT TIME ZONE 'America/Sao_Paulo')) RETURNING *`,
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

      // Sempre definir rotation_made como false quando atualizar
      paramCount++;
      updates.push(`rotation_made = $${paramCount}`);
      values.push(false);

      // Sempre atualizar o timestamp (sem parâmetro)
      updates.push(`updated_at = (NOW() AT TIME ZONE 'America/Sao_Paulo')`);

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

  // Atualizar apenas o status de rotation_made
  static async updateRotationMade(id: number, rotationMade: boolean): Promise<RosterPlayoffs> {
    try {
      this.checkPostgresClient();
      
      const { rows } = await pool.query(
        'UPDATE roster_playoffs SET rotation_made = $1 WHERE id = $2 RETURNING *',
        [rotationMade, id]
      );

      if (rows.length === 0) {
        throw createError('Roster playoffs não encontrado', 404);
      }

      return this.parseRosterMinutes(rows[0]);
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

  // Buscar todos os rosters playoffs com informações dos times e jogadores
  static async getAllRostersWithDetails(params: { season_id?: number; sortBy?: string; sortOrder?: 'asc' | 'desc' } = {}): Promise<any[]> {
    try {
      this.checkPostgresClient();
      
      const { season_id, sortBy = 'updated_at', sortOrder = 'desc' } = params;
      
      let sql = `
        SELECT 
          rp.*,
          t.name as team_name,
          t.abbreviation as team_abbreviation
        FROM roster_playoffs rp
        JOIN teams t ON rp.team_id = t.id
        WHERE 1=1
      `;
      
      const values: any[] = [];
      let paramCount = 0;

      if (season_id) {
        paramCount++;
        sql += ` AND rp.season_id = $${paramCount}`;
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

          // Buscar informações dos jogadores G-League (roster playoffs não tem gleague1_player_id e gleague2_player_id)
          const gleaguePlayers: any[] = [];

          // Buscar informações do jogador franquia
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

  // Testar conexão com o banco
  static async testConnection(): Promise<void> {
    try {
      this.checkPostgresClient();
      
      const { rows } = await pool.query('SELECT NOW() as current_time, version() as postgres_version');
      console.log('✅ Conexão com banco de dados OK');
      console.log('🕐 Hora atual do banco:', rows[0].current_time);
      console.log('🐘 Versão do PostgreSQL:', rows[0].postgres_version);
    } catch (error) {
      console.error('💥 Erro na conexão com banco de dados:', error);
    }
  }

  // Verificar estrutura da tabela
  static async checkTableStructure(): Promise<void> {
    try {
      this.checkPostgresClient();
      
      // Primeiro verificar se a tabela existe
      const tableExists = await pool.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = 'roster_playoffs'
        );
      `);
      
      if (!tableExists.rows[0].exists) {
        console.error('❌ Tabela roster_playoffs não existe!');
        return;
      }
      
      console.log('✅ Tabela roster_playoffs existe');
      
      const { rows } = await pool.query(`
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns 
        WHERE table_name = 'roster_playoffs' 
        ORDER BY ordinal_position
      `);
      
      console.log('📋 Estrutura da tabela roster_playoffs:');
      rows.forEach(row => {
        console.log(`  - ${row.column_name}: ${row.data_type} (nullable: ${row.is_nullable}, default: ${row.column_default})`);
      });
      
      // Verificar se há colunas com valores padrão
      const columnsWithDefaults = rows.filter(row => row.column_default);
      if (columnsWithDefaults.length > 0) {
        console.log('🔧 Colunas com valores padrão:');
        columnsWithDefaults.forEach(row => {
          console.log(`  - ${row.column_name}: ${row.column_default}`);
        });
      }
    } catch (error) {
      console.error('💥 Erro ao verificar estrutura da tabela:', error);
    }
  }
}
