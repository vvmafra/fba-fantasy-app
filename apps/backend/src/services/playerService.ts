import pool from '../utils/postgresClient.js';
import { 
  Player, 
  CreatePlayerRequest, 
  UpdatePlayerRequest, 
  PaginationParams, 
  PaginatedResponse,
  PlayerQueryParams,
  BatchUpdateRequest,
  TransferPlayerRequest,
  OCRRequest,
  OCRResponse
} from '../types';
import { createError } from '../middlewares/errorHandler.js';

export class PlayerService {
  // Verificar se o cliente PostgreSQL está inicializado
  private static checkPostgresClient() {
    if (!pool) {
      throw createError('Cliente PostgreSQL não inicializado. Verifique suas variáveis de ambiente.', 500);
    }
  }

  // Buscar todos os players com paginação e filtros
  static async getAllPlayers(params: PlayerQueryParams): Promise<PaginatedResponse<Player>> {
    const { page = 1, limit = 10, sortBy = 'created_at', sortOrder = 'desc', name, team, position, isFreeAgent } = params;
    const offset = (page - 1) * limit;

    try {
      this.checkPostgresClient();
      
      let sql = 'SELECT * FROM players WHERE 1=1';
      const values: any[] = [];
      let paramCount = 0;

      // Aplicar filtros
      if (name) {
        paramCount++;
        sql += ` AND name ILIKE $${paramCount}`;
        values.push(`%${name}%`);
      }
      if (team) {
        paramCount++;
        sql += ` AND team_id = $${paramCount}`;
        values.push(team);
      }
      if (position) {
        paramCount++;
        sql += ` AND position = $${paramCount}`;
        values.push(position);
      }
      if (isFreeAgent !== undefined) {
        if (isFreeAgent) {
          sql += ' AND team_id IS NULL';
        } else {
          sql += ' AND team_id IS NOT NULL';
        }
      }

      // Adicionar ordenação e paginação
      sql += ` ORDER BY ${sortBy} ${sortOrder === 'asc' ? 'ASC' : 'DESC'}`;
      sql += ` LIMIT ${limit} OFFSET ${offset}`;

      const { rows } = await pool.query(sql, values);

      // Contar total de registros
      let countSql = 'SELECT COUNT(*) FROM players WHERE 1=1';
      const countValues: any[] = [];
      paramCount = 0;

      if (name) {
        paramCount++;
        countSql += ` AND name ILIKE $${paramCount}`;
        countValues.push(`%${name}%`);
      }
      if (team) {
        paramCount++;
        countSql += ` AND team_id = $${paramCount}`;
        countValues.push(team);
      }
      if (position) {
        paramCount++;
        countSql += ` AND position = $${paramCount}`;
        countValues.push(position);
      }
      if (isFreeAgent !== undefined) {
        if (isFreeAgent) {
          countSql += ' AND team_id IS NULL';
        } else {
          countSql += ' AND team_id IS NOT NULL';
        }
      }

      const { rows: countRows } = await pool.query(countSql, countValues);
      const total = parseInt(countRows[0].count);
      const totalPages = Math.ceil(total / limit);

      return {
        success: true,
        data: rows,
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

  // Buscar player por ID
  static async getPlayerById(id: number): Promise<Player> {
    try {
      this.checkPostgresClient();
      
      const { rows } = await pool.query('SELECT * FROM players WHERE id = $1', [id]);

      if (rows.length === 0) {
        throw createError('Player não encontrado', 404);
      }

      return rows[0];
    } catch (error) {
      throw error;
    }
  }

  // Criar novo player
  static async createPlayer(playerData: CreatePlayerRequest): Promise<Player> {
    try {
      this.checkPostgresClient();
      
      // Verificar se já existe um jogador com o mesmo nome
      const { rows: existingPlayers } = await pool.query(
        'SELECT id, name, team_id FROM players WHERE LOWER(name) = LOWER($1)',
        [playerData.name]
      );
      
      if (existingPlayers.length > 0) {
        const existingPlayer = existingPlayers[0];
        throw createError(
          `Já existe um jogador chamado "${existingPlayer.name}" no sistema.`,
          409
        );
      }
      
      // Buscar o season_id ativo
      const { rows: seasonRows } = await pool.query('SELECT id FROM seasons WHERE is_active = true LIMIT 1');
      
      if (seasonRows.length === 0) {
        throw createError('Nenhuma temporada ativa encontrada', 400);
      }
      
      const activeSeasonId = seasonRows[0].id;
      
      const { rows } = await pool.query('INSERT INTO players (name, position, age, ovr, ins, mid, "3pt", ins_d, per_d, plmk, reb, phys, iq, pot, team_id, source, season_id) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17) RETURNING *', [
        playerData.name,
        playerData.position,
        playerData.age,
        playerData.ovr,
        playerData.ins || null,
        playerData.mid || null,
        playerData["3pt"] || null,
        playerData.ins_d || null,
        playerData.per_d || null,
        playerData.plmk || null,
        playerData.reb || null,
        playerData.phys || null,
        playerData.iq || null,
        playerData.pot || null,
        playerData.team_id || null,
        playerData.source || 'manual',
        activeSeasonId
      ]);

      return rows[0];
    } catch (error) {
      throw error;
    }
  }

  // Criar múltiplos players (para OCR)
  static async createMultiplePlayers(playersData: CreatePlayerRequest[]): Promise<Player[]> {
    try {
      this.checkPostgresClient();
      
      const createdPlayers: Player[] = [];
      
      for (const playerData of playersData) {
        const player = await this.createPlayer(playerData);
        createdPlayers.push(player);
      }

      return createdPlayers;
    } catch (error) {
      throw error;
    }
  }

  // Atualizar player
  static async updatePlayer(id: number, playerData: Partial<CreatePlayerRequest>): Promise<Player> {
    try {
      this.checkPostgresClient();
      
      // Construir query dinamicamente baseada nos campos fornecidos
      const updates: string[] = [];
      const values: any[] = [];
      let paramCount = 0;

      if (playerData.name !== undefined) {
        paramCount++;
        updates.push(`name = $${paramCount}`);
        values.push(playerData.name);
      }
      if (playerData.position !== undefined) {
        paramCount++;
        updates.push(`position = $${paramCount}`);
        values.push(playerData.position);
      }
      if (playerData.age !== undefined) {
        paramCount++;
        updates.push(`age = $${paramCount}`);
        values.push(playerData.age);
      }
      if (playerData.ovr !== undefined) {
        paramCount++;
        updates.push(`ovr = $${paramCount}`);
        values.push(playerData.ovr);
      }
      if (playerData.ins !== undefined) {
        paramCount++;
        updates.push(`ins = $${paramCount}`);
        values.push(playerData.ins);
      }
      if (playerData.mid !== undefined) {
        paramCount++;
        updates.push(`mid = $${paramCount}`);
        values.push(playerData.mid);
      }
      if (playerData["3pt"] !== undefined) {
        paramCount++;
        updates.push(`"3pt" = $${paramCount}`);
        values.push(playerData["3pt"]);
      }
      if (playerData.ins_d !== undefined) {
        paramCount++;
        updates.push(`ins_d = $${paramCount}`);
        values.push(playerData.ins_d);
      }
      if (playerData.per_d !== undefined) {
        paramCount++;
        updates.push(`per_d = $${paramCount}`);
        values.push(playerData.per_d);
      }
      if (playerData.plmk !== undefined) {
        paramCount++;
        updates.push(`plmk = $${paramCount}`);
        values.push(playerData.plmk);
      }
      if (playerData.reb !== undefined) {
        paramCount++;
        updates.push(`reb = $${paramCount}`);
        values.push(playerData.reb);
      }
      if (playerData.phys !== undefined) {
        paramCount++;
        updates.push(`phys = $${paramCount}`);
        values.push(playerData.phys);
      }
      if (playerData.iq !== undefined) {
        paramCount++;
        updates.push(`iq = $${paramCount}`);
        values.push(playerData.iq);
      }
      if (playerData.pot !== undefined) {
        paramCount++;
        updates.push(`pot = $${paramCount}`);
        values.push(playerData.pot);
      }
      if (playerData.team_id !== undefined) {
        paramCount++;
        updates.push(`team_id = $${paramCount}`);
        values.push(playerData.team_id);
      }
      if (playerData.source !== undefined) {
        paramCount++;
        updates.push(`source = $${paramCount}`);
        values.push(playerData.source);
      }

      if (updates.length === 0) {
        throw createError('Nenhum campo para atualizar', 400);
      }

      paramCount++;
      values.push(id);

      const sql = `UPDATE players SET ${updates.join(', ')} WHERE id = $${paramCount} RETURNING *`;
      const { rows } = await pool.query(sql, values);

      if (rows.length === 0) {
        throw createError('Player não encontrado', 404);
      }

      return rows[0];
    } catch (error) {
      throw error;
    }
  }

  // Atualizar múltiplos players em lote
  static async batchUpdatePlayers(batchData: BatchUpdateRequest): Promise<Player[]> {
    try {
      const updatedPlayers: Player[] = [];
      
      for (const { id, updates } of batchData.players) {
        const updatedPlayer = await this.updatePlayer(id, updates);
        updatedPlayers.push(updatedPlayer);
      }

      return updatedPlayers;
    } catch (error) {
      throw error;
    }
  }

  // Transferir player para outro time
  static async transferPlayer(id: number, transferData: TransferPlayerRequest): Promise<Player> {
    try {
      this.checkPostgresClient();
      
      const { rows } = await pool.query('UPDATE players SET team_id = $1 WHERE id = $2 RETURNING *', [
        transferData.newTeam,
        id
      ]);

      if (rows.length === 0) {
        throw createError('Player não encontrado', 404);
      }

      return rows[0];
    } catch (error) {
      throw error;
    }
  }

  // Liberar player (tornar free agent)
  static async releasePlayer(id: number): Promise<Player> {
    try {
      this.checkPostgresClient();
      
      const { rows } = await pool.query('UPDATE players SET team_id = NULL WHERE id = $1 RETURNING *', [id]);

      if (rows.length === 0) {
        throw createError('Player não encontrado', 404);
      }

      return rows[0];
    } catch (error) {
      throw error;
    }
  }

  // Deletar player
  static async deletePlayer(id: number): Promise<void> {
    try {
      this.checkPostgresClient();
      
      const { rows } = await pool.query('DELETE FROM players WHERE id = $1 RETURNING *', [id]);

      if (rows.length === 0) {
        throw createError('Player não encontrado', 404);
      }
    } catch (error) {
      throw error;
    }
  }

  // Buscar players por posição
  static async getPlayersByPosition(position: string): Promise<Player[]> {
    try {
      this.checkPostgresClient();
      
      const { rows } = await pool.query('SELECT * FROM players WHERE position = $1 ORDER BY name', [position]);

      return rows;
    } catch (error) {
      throw error;
    }
  }

  // Buscar players por time
  static async getPlayersByTeam(teamId: number): Promise<Player[]> {
    try {
      this.checkPostgresClient();
      
      const { rows } = await pool.query('SELECT * FROM players WHERE team_id = $1', [teamId]);

      return rows;
    } catch (error) {
      console.error('💥 Erro em getPlayersByTeam:', error);
      throw error;
    }
  }

  // Buscar Free Agents
  static async getFreeAgents(): Promise<Player[]> {
    try {
      this.checkPostgresClient();
      
      const { rows } = await pool.query('SELECT * FROM players WHERE team_id IS NULL ORDER BY name');

      return rows;
    } catch (error) {
      throw error;
    }
  }

  // Buscar todos os players sem paginação
  static async getAllPlayersWithoutPagination(): Promise<Player[]> {
    try {
      this.checkPostgresClient();
      
      const { rows } = await pool.query('SELECT * FROM players ORDER BY name');

      return rows;
    } catch (error) {
      throw error;
    }
  }

  // Processar OCR (simulado - você precisará implementar a integração real com OpenAI)
  static async processOCR(ocrData: OCRRequest): Promise<OCRResponse> {
    try {
      // TODO: Implementar integração real com OpenAI Vision API
      // Por enquanto, retorna dados simulados
      
      // Simulação de resposta do OCR
      const mockPlayers: CreatePlayerRequest[] = [
        {
          name: 'Jogador Exemplo',
          position: 'PG',
          age: 25,
          ovr: 75,
          ins: '70',
          mid: '75',
          "3pt": '80',
          ins_d: '65',
          per_d: '70',
          plmk: '75',
          reb: '60',
          phys: '70',
          iq: '80',
          pot: '85'
        }
      ];

      return {
        players: mockPlayers,
        confidence: 0.85
      };
    } catch (error) {
      throw createError('Erro ao processar OCR', 500);
    }
  }
} 