import pool from '../utils/postgresClient.js';
import { 
  SeasonAwards, 
  CreateSeasonAwardsRequest, 
  UpdateSeasonAwardsRequest,
  SeasonAwardsWithDetails
} from '../types';

export class SeasonAwardsService {
  // Buscar todas as premiações
  static async getAllSeasonAwards(): Promise<SeasonAwardsWithDetails[]> {
    const { rows } = await pool.query(`
      SELECT 
        sa.*,
        s.season_number,
        s.year,
        mvp_p.name as mvp_player_name,
        mvp_p.position as mvp_player_position,
        mvp_p.ovr as mvp_player_ovr,
        mvp_t.name as mvp_team_name,
        mvp_t.abbreviation as mvp_team_abbreviation,
        roy_p.name as roy_player_name,
        roy_p.position as roy_player_position,
        roy_p.ovr as roy_player_ovr,
        roy_t.name as roy_team_name,
        roy_t.abbreviation as roy_team_abbreviation,
        smoy_p.name as smoy_player_name,
        smoy_p.position as smoy_player_position,
        smoy_p.ovr as smoy_player_ovr,
        smoy_t.name as smoy_team_name,
        smoy_t.abbreviation as smoy_team_abbreviation,
        dpoy_p.name as dpoy_player_name,
        dpoy_p.position as dpoy_player_position,
        dpoy_p.ovr as dpoy_player_ovr,
        dpoy_t.name as dpoy_team_name,
        dpoy_t.abbreviation as dpoy_team_abbreviation,
        mip_p.name as mip_player_name,
        mip_p.position as mip_player_position,
        mip_p.ovr as mip_player_ovr,
        mip_t.name as mip_team_name,
        mip_t.abbreviation as mip_team_abbreviation,
        coy_u.name as coy_user_name,
        coy_u.email as coy_user_email,
        coy_t.name as coy_team_name,
        coy_t.abbreviation as coy_team_abbreviation
      FROM season_awards sa
      LEFT JOIN seasons s ON sa.season_id = s.id
      LEFT JOIN players mvp_p ON sa.mvp_player_id = mvp_p.id
      LEFT JOIN teams mvp_t ON sa.mvp_team_id = mvp_t.id
      LEFT JOIN players roy_p ON sa.roy_player_id = roy_p.id
      LEFT JOIN teams roy_t ON sa.roy_team_id = roy_t.id
      LEFT JOIN players smoy_p ON sa.smoy_player_id = smoy_p.id
      LEFT JOIN teams smoy_t ON sa.smoy_team_id = smoy_t.id
      LEFT JOIN players dpoy_p ON sa.dpoy_player_id = dpoy_p.id
      LEFT JOIN teams dpoy_t ON sa.dpoy_team_id = dpoy_t.id
      LEFT JOIN players mip_p ON sa.mip_player_id = mip_p.id
      LEFT JOIN teams mip_t ON sa.mip_team_id = mip_t.id
      LEFT JOIN users coy_u ON sa.coy_user_id = coy_u.id
      LEFT JOIN teams coy_t ON sa.coy_team_id = coy_t.id
      ORDER BY s.season_number DESC, sa.created_at DESC
    `);
    return rows;
  }

  // Buscar premiações por temporada
  static async getSeasonAwardsBySeason(seasonId: number): Promise<SeasonAwardsWithDetails | null> {
    const { rows } = await pool.query(`
      SELECT 
        sa.*,
        s.season_number,
        s.year,
        mvp_p.name as mvp_player_name,
        mvp_p.position as mvp_player_position,
        mvp_p.ovr as mvp_player_ovr,
        mvp_t.name as mvp_team_name,
        mvp_t.abbreviation as mvp_team_abbreviation,
        roy_p.name as roy_player_name,
        roy_p.position as roy_player_position,
        roy_p.ovr as roy_player_ovr,
        roy_t.name as roy_team_name,
        roy_t.abbreviation as roy_team_abbreviation,
        smoy_p.name as smoy_player_name,
        smoy_p.position as smoy_player_position,
        smoy_p.ovr as smoy_player_ovr,
        smoy_t.name as smoy_team_name,
        smoy_t.abbreviation as smoy_team_abbreviation,
        dpoy_p.name as dpoy_player_name,
        dpoy_p.position as dpoy_player_position,
        dpoy_p.ovr as dpoy_player_ovr,
        dpoy_t.name as dpoy_team_name,
        dpoy_t.abbreviation as dpoy_team_abbreviation,
        mip_p.name as mip_player_name,
        mip_p.position as mip_player_position,
        mip_p.ovr as mip_player_ovr,
        mip_t.name as mip_team_name,
        mip_t.abbreviation as mip_team_abbreviation,
        coy_u.name as coy_user_name,
        coy_u.email as coy_user_email,
        coy_t.name as coy_team_name,
        coy_t.abbreviation as coy_team_abbreviation
      FROM season_awards sa
      LEFT JOIN seasons s ON sa.season_id = s.id
      LEFT JOIN players mvp_p ON sa.mvp_player_id = mvp_p.id
      LEFT JOIN teams mvp_t ON sa.mvp_team_id = mvp_t.id
      LEFT JOIN players roy_p ON sa.roy_player_id = roy_p.id
      LEFT JOIN teams roy_t ON sa.roy_team_id = roy_t.id
      LEFT JOIN players smoy_p ON sa.smoy_player_id = smoy_p.id
      LEFT JOIN teams smoy_t ON sa.smoy_team_id = smoy_t.id
      LEFT JOIN players dpoy_p ON sa.dpoy_player_id = dpoy_p.id
      LEFT JOIN teams dpoy_t ON sa.dpoy_team_id = dpoy_t.id
      LEFT JOIN players mip_p ON sa.mip_player_id = mip_p.id
      LEFT JOIN teams mip_t ON sa.mip_team_id = mip_t.id
      LEFT JOIN users coy_u ON sa.coy_user_id = coy_u.id
      LEFT JOIN teams coy_t ON sa.coy_team_id = coy_t.id
      WHERE sa.season_id = $1
    `, [seasonId]);
    return rows[0] || null;
  }

  // Buscar premiação por ID
  static async getSeasonAwardsById(id: number): Promise<SeasonAwardsWithDetails | null> {
    const { rows } = await pool.query(`
      SELECT 
        sa.*,
        s.season_number,
        s.year,
        mvp_p.name as mvp_player_name,
        mvp_p.position as mvp_player_position,
        mvp_p.ovr as mvp_player_ovr,
        mvp_t.name as mvp_team_name,
        mvp_t.abbreviation as mvp_team_abbreviation,
        roy_p.name as roy_player_name,
        roy_p.position as roy_player_position,
        roy_p.ovr as roy_player_ovr,
        roy_t.name as roy_team_name,
        roy_t.abbreviation as roy_team_abbreviation,
        smoy_p.name as smoy_player_name,
        smoy_p.position as smoy_player_position,
        smoy_p.ovr as smoy_player_ovr,
        smoy_t.name as smoy_team_name,
        smoy_t.abbreviation as smoy_team_abbreviation,
        dpoy_p.name as dpoy_player_name,
        dpoy_p.position as dpoy_player_position,
        dpoy_p.ovr as dpoy_player_ovr,
        dpoy_t.name as dpoy_team_name,
        dpoy_t.abbreviation as dpoy_team_abbreviation,
        mip_p.name as mip_player_name,
        mip_p.position as mip_player_position,
        mip_p.ovr as mip_player_ovr,
        mip_t.name as mip_team_name,
        mip_t.abbreviation as mip_team_abbreviation,
        coy_u.name as coy_user_name,
        coy_u.email as coy_user_email,
        coy_t.name as coy_team_name,
        coy_t.abbreviation as coy_team_abbreviation
      FROM season_awards sa
      LEFT JOIN seasons s ON sa.season_id = s.id
      LEFT JOIN players mvp_p ON sa.mvp_player_id = mvp_p.id
      LEFT JOIN teams mvp_t ON sa.mvp_team_id = mvp_t.id
      LEFT JOIN players roy_p ON sa.roy_player_id = roy_p.id
      LEFT JOIN teams roy_t ON sa.roy_team_id = roy_t.id
      LEFT JOIN players smoy_p ON sa.smoy_player_id = smoy_p.id
      LEFT JOIN teams smoy_t ON sa.smoy_team_id = smoy_t.id
      LEFT JOIN players dpoy_p ON sa.dpoy_player_id = dpoy_p.id
      LEFT JOIN teams dpoy_t ON sa.dpoy_team_id = dpoy_t.id
      LEFT JOIN players mip_p ON sa.mip_player_id = mip_p.id
      LEFT JOIN teams mip_t ON sa.mip_team_id = mip_t.id
      LEFT JOIN users coy_u ON sa.coy_user_id = coy_u.id
      LEFT JOIN teams coy_t ON sa.coy_team_id = coy_t.id
      WHERE sa.id = $1
    `, [id]);
    return rows[0] || null;
  }

  // Criar nova premiação
  static async createSeasonAwards(data: CreateSeasonAwardsRequest): Promise<SeasonAwards> {
    // Verificar se já existe premiação para esta temporada
    const { rows: existing } = await pool.query(
      'SELECT id FROM season_awards WHERE season_id = $1',
      [data.season_id]
    );

    if (existing.length > 0) {
      throw new Error('Já existe premiação para esta temporada');
    }

    const { rows } = await pool.query(`
      INSERT INTO season_awards (
        season_id,
        mvp_player_id,
        mvp_team_id,
        roy_player_id,
        roy_team_id,
        smoy_player_id,
        smoy_team_id,
        dpoy_player_id,
        dpoy_team_id,
        mip_player_id,
        mip_team_id,
        coy_user_id,
        coy_team_id
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING *
    `, [
      data.season_id,
      data.mvp_player_id || null,
      data.mvp_team_id || null,
      data.roy_player_id || null,
      data.roy_team_id || null,
      data.smoy_player_id || null,
      data.smoy_team_id || null,
      data.dpoy_player_id || null,
      data.dpoy_team_id || null,
      data.mip_player_id || null,
      data.mip_team_id || null,
      data.coy_user_id || null,
      data.coy_team_id || null
    ]);

    return rows[0];
  }

  // Atualizar premiação
  static async updateSeasonAwards(id: number, data: UpdateSeasonAwardsRequest): Promise<SeasonAwards> {
    const { rows } = await pool.query(`
      UPDATE season_awards SET
        season_id = COALESCE($1, season_id),
        mvp_player_id = COALESCE($2, mvp_player_id),
        mvp_team_id = COALESCE($3, mvp_team_id),
        roy_player_id = COALESCE($4, roy_player_id),
        roy_team_id = COALESCE($5, roy_team_id),
        smoy_player_id = COALESCE($6, smoy_player_id),
        smoy_team_id = COALESCE($7, smoy_team_id),
        dpoy_player_id = COALESCE($8, dpoy_player_id),
        dpoy_team_id = COALESCE($9, dpoy_team_id),
        mip_player_id = COALESCE($10, mip_player_id),
        mip_team_id = COALESCE($11, mip_team_id),
        coy_user_id = COALESCE($12, coy_user_id),
        coy_team_id = COALESCE($13, coy_team_id)
      WHERE id = $14
      RETURNING *
    `, [
      data.season_id,
      data.mvp_player_id,
      data.mvp_team_id,
      data.roy_player_id,
      data.roy_team_id,
      data.smoy_player_id,
      data.smoy_team_id,
      data.dpoy_player_id,
      data.dpoy_team_id,
      data.mip_player_id,
      data.mip_team_id,
      data.coy_user_id,
      data.coy_team_id,
      id
    ]);

    if (rows.length === 0) {
      throw new Error('Premiação não encontrada');
    }

    return rows[0];
  }

  // Deletar premiação
  static async deleteSeasonAwards(id: number): Promise<void> {
    const { rows } = await pool.query(
      'DELETE FROM season_awards WHERE id = $1 RETURNING id',
      [id]
    );

    if (rows.length === 0) {
      throw new Error('Premiação não encontrada');
    }
  }

  // Buscar ou criar premiação para uma temporada
  static async getOrCreateSeasonAwards(seasonId: number): Promise<SeasonAwardsWithDetails> {
    let awards = await this.getSeasonAwardsBySeason(seasonId);
    
    if (!awards) {
      // Criar nova premiação vazia para a temporada
      const newAwards = await this.createSeasonAwards({
        season_id: seasonId
      });
      
      // Buscar novamente com detalhes
      awards = await this.getSeasonAwardsById(newAwards.id);
    }
    
    return awards!;
  }
} 