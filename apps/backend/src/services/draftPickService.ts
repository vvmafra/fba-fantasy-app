import pool from '../utils/postgresClient.js';
import { 
  DraftPick, 
  CreateDraftPickRequest, 
  UpdateDraftPickRequest, 
  DraftPickQueryParams,
  PaginatedResponse,
  AddPlayerToDraftPickRequest
} from '../types/index.js';

export class DraftPickService {
  static async getAllDraftPicks(params: DraftPickQueryParams): Promise<PaginatedResponse<DraftPick>> {
    const { page = 1, limit = 100, sortBy = 'pick_number', sortOrder = 'asc', season_id, team_id, is_added_to_2k } = params;
    const offset = (page - 1) * limit;

    try {
      let sql = `
        SELECT dp.*, 
               t.name as team_name,
               t.abbreviation as team_abbreviation,
               p.name as actual_player_name,
               p.position as actual_player_position,
               p.age as actual_player_age,
               p.ovr as actual_player_ovr
        FROM draft_picks dp
        JOIN teams t ON dp.team_id = t.id
        LEFT JOIN players p ON dp.player_id = p.id
        WHERE 1=1
      `;
      const values: any[] = [];
      let paramCount = 0;

      // Aplicar filtros
      if (season_id) {
        paramCount++;
        sql += ` AND dp.season_id = $${paramCount}`;
        values.push(season_id);
      }
      if (team_id) {
        paramCount++;
        sql += ` AND dp.team_id = $${paramCount}`;
        values.push(team_id);
      }
      if (is_added_to_2k !== undefined) {
        paramCount++;
        sql += ` AND dp.is_added_to_2k = $${paramCount}`;
        values.push(is_added_to_2k);
      }

      // Adicionar ordenação e paginação
      sql += ` ORDER BY dp.${sortBy} ${sortOrder === 'asc' ? 'ASC' : 'DESC'}`;
      sql += ` LIMIT ${limit} OFFSET ${offset}`;

      const { rows } = await pool.query(sql, values);

      // Contar total de registros
      let countSql = 'SELECT COUNT(*) FROM draft_picks dp WHERE 1=1';
      const countValues: any[] = [];
      paramCount = 0;

      if (season_id) {
        paramCount++;
        countSql += ` AND dp.season_id = $${paramCount}`;
        countValues.push(season_id);
      }
      if (team_id) {
        paramCount++;
        countSql += ` AND dp.team_id = $${paramCount}`;
        countValues.push(team_id);
      }
      if (is_added_to_2k !== undefined) {
        paramCount++;
        countSql += ` AND dp.is_added_to_2k = $${paramCount}`;
        countValues.push(is_added_to_2k);
      }

      const { rows: countRows } = await pool.query(countSql, countValues);
      const total = parseInt(countRows[0].count);

      console.log('rows', rows);

      return {
        success: true,
        data: rows,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      throw new Error(`Erro ao buscar draft picks: ${error}`);
    }
  }

  static async getDraftPickById(id: number): Promise<DraftPick> {
    const { rows } = await pool.query(`
      SELECT dp.*, 
             t.name as team_name,
             t.abbreviation as team_abbreviation,
             p.name as actual_player_name,
             p.position as actual_player_position,
             p.age as actual_player_age,
             p.ovr as actual_player_ovr
      FROM draft_picks dp
      JOIN teams t ON dp.team_id = t.id
      LEFT JOIN players p ON dp.player_id = p.id
      WHERE dp.id = $1
    `, [id]);

    if (rows.length === 0) {
      throw new Error('Draft pick não encontrado');
    }

    return rows[0];
  }

  static async createDraftPick(data: CreateDraftPickRequest): Promise<DraftPick> {
    const { season_id, team_id, pick_number } = data;

    // Verificar se já existe um pick com este número nesta temporada
    const existingPick = await pool.query(
      'SELECT id FROM draft_picks WHERE season_id = $1 AND pick_number = $2',
      [season_id, pick_number]
    );

    if (existingPick.rows.length > 0) {
      throw new Error(`Já existe um pick ${pick_number} para a temporada ${season_id}`);
    }

    const { rows } = await pool.query(`
      INSERT INTO draft_picks (season_id, team_id, pick_number)
      VALUES ($1, $2, $3)
      RETURNING *
    `, [season_id, team_id, pick_number]);

    return rows[0];
  }

  static async updateDraftPick(id: number, data: UpdateDraftPickRequest): Promise<DraftPick> {
    const { season_id, team_id, pick_number, is_added_to_2k, player_id } = data;

    const updates: string[] = [];
    const values: any[] = [];
    let paramCount = 0;

    if (season_id !== undefined) {
      paramCount++;
      updates.push(`season_id = $${paramCount}`);
      values.push(season_id);
    }
    if (team_id !== undefined) {
      paramCount++;
      updates.push(`team_id = $${paramCount}`);
      values.push(team_id);
    }
    if (pick_number !== undefined) {
      paramCount++;
      updates.push(`pick_number = $${paramCount}`);
      values.push(pick_number);
    }
    if (is_added_to_2k !== undefined) {
      paramCount++;
      updates.push(`is_added_to_2k = $${paramCount}`);
      values.push(is_added_to_2k);
    }
    if (player_id !== undefined) {
      paramCount++;
      updates.push(`player_id = $${paramCount}`);
      values.push(player_id);
    }

    if (updates.length === 0) {
      throw new Error('Nenhum campo para atualizar');
    }

    paramCount++;
    updates.push(`updated_at = NOW()`);
    values.push(id);

    const { rows } = await pool.query(`
      UPDATE draft_picks 
      SET ${updates.join(', ')}
      WHERE id = $${paramCount}
      RETURNING *
    `, values);

    if (rows.length === 0) {
      throw new Error('Draft pick não encontrado');
    }

    return rows[0];
  }

  static async deleteDraftPick(id: number): Promise<void> {
    const { rowCount } = await pool.query('DELETE FROM draft_picks WHERE id = $1', [id]);
    
    if (rowCount === 0) {
      throw new Error('Draft pick não encontrado');
    }
  }



  static async toggleAddedTo2k(id: number): Promise<DraftPick> {
    const { rows } = await pool.query(`
      UPDATE draft_picks 
      SET is_added_to_2k = NOT is_added_to_2k, updated_at = NOW()
      WHERE id = $1
      RETURNING *
    `, [id]);

    if (rows.length === 0) {
      throw new Error('Draft pick não encontrado');
    }

    return rows[0];
  }

  static async addPlayerToDraftPick(id: number, data: AddPlayerToDraftPickRequest): Promise<DraftPick> {
    const { player_id } = data;

    // Verificar se o jogador existe
    const playerExists = await pool.query('SELECT id FROM players WHERE id = $1', [player_id]);
    if (playerExists.rows.length === 0) {
      throw new Error('Jogador não encontrado');
    }

    // Verificar se o jogador já está em outro draft pick
    const existingDraftPick = await pool.query(
      'SELECT id FROM draft_picks WHERE player_id = $1 AND id != $2',
      [player_id, id]
    );
    if (existingDraftPick.rows.length > 0) {
      throw new Error('Jogador já está em outro draft pick');
    }

    const { rows } = await pool.query(`
      UPDATE draft_picks 
      SET player_id = $1, updated_at = NOW()
      WHERE id = $2
      RETURNING *
    `, [player_id, id]);

    if (rows.length === 0) {
      throw new Error('Draft pick não encontrado');
    }

    return rows[0];
  }

  static async createPlayerAndAddToDraftPick(id: number, playerData: any): Promise<DraftPick> {
    // Primeiro, buscar o draft pick para obter o team_id
    const draftPickResult = await pool.query('SELECT team_id, season_id FROM draft_picks WHERE id = $1', [id]);
    if (draftPickResult.rows.length === 0) {
      throw new Error('Draft pick não encontrado');
    }

    const { team_id, season_id } = draftPickResult.rows[0];

    // Criar o jogador
    const { rows: playerRows } = await pool.query(`
      INSERT INTO players (name, position, age, ovr, team_id, season_id, source)
      VALUES ($1, $2, $3, $4, $5, $6, 'manual')
      RETURNING id
    `, [playerData.name, playerData.position, playerData.age, playerData.ovr, team_id, season_id]);

    const playerId = playerRows[0].id;

    // Associar o jogador ao draft pick
    const { rows } = await pool.query(`
      UPDATE draft_picks 
      SET player_id = $1, updated_at = NOW()
      WHERE id = $2
      RETURNING *
    `, [playerId, id]);

    return rows[0];
  }

  static async getDraftPicksBySeason(seasonId: number): Promise<DraftPick[]> {
    const { rows } = await pool.query(`
      SELECT dp.*, 
             t.name as team_name,
             t.abbreviation as team_abbreviation,
             p.name as actual_player_name,
             p.position as actual_player_position,
             p.age as actual_player_age,
             p.ovr as actual_player_ovr
      FROM draft_picks dp
      JOIN teams t ON dp.team_id = t.id
      LEFT JOIN players p ON dp.player_id = p.id
      WHERE dp.season_id = $1
      ORDER BY dp.pick_number ASC
    `, [seasonId]);

    return rows;
  }

  static async getNextPickNumber(seasonId: number): Promise<number> {
    const { rows } = await pool.query(`
      SELECT COALESCE(MAX(pick_number), 0) + 1 as next_pick_number
      FROM draft_picks 
      WHERE season_id = $1
    `, [seasonId]);

    return rows[0].next_pick_number;
  }


} 