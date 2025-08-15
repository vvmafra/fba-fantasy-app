import pool from '../utils/postgresClient.js';
import { 
  PickSwap, 
  CreatePickSwapRequest, 
  PickSwapWithDetails 
} from '../types/index.js';

export class PickSwapService {
  // Buscar todos os pick swaps
  static async getAllPickSwaps(): Promise<PickSwapWithDetails[]> {
    const { rows } = await pool.query(`
      SELECT 
        ps.*,
        pa.round as pick_a_round,
        sa.year as pick_a_year,
        pa.original_team_id as pick_a_original_team_id,
        ta_original.name as pick_a_original_team_name,
        ta_original.abbreviation as pick_a_original_team_abbreviation,
        pb.round as pick_b_round,
        sb.year as pick_b_year,
        pb.original_team_id as pick_b_original_team_id,
        tb_original.name as pick_b_original_team_name,
        tb_original.abbreviation as pick_b_original_team_abbreviation,
        t_owner.name as owned_by_team_name,
        t_owner.abbreviation as owned_by_team_abbreviation
      FROM pick_swaps ps
      JOIN picks pa ON ps.pick_a_id = pa.id
      JOIN picks pb ON ps.pick_b_id = pb.id
      JOIN seasons sa ON pa.season_id = sa.id
      JOIN seasons sb ON pb.season_id = sb.id
      JOIN teams ta_original ON pa.original_team_id = ta_original.id
      JOIN teams tb_original ON pb.original_team_id = tb_original.id
      JOIN teams t_owner ON ps.owned_by_team_id = t_owner.id
      ORDER BY ps.created_at DESC
    `);

    return rows.map(row => ({
      id: row.id,
      season_id: row.season_id,
      swap_type: row.swap_type,
      pick_a_id: row.pick_a_id,
      pick_b_id: row.pick_b_id,
      owned_by_team_id: row.owned_by_team_id,
      created_at: row.created_at,
      pick_a: {
        id: row.pick_a_id,
        round: row.pick_a_round,
        year: parseInt(row.pick_a_year.split('/')[0]),
        original_team_id: row.pick_a_original_team_id,
        original_team_name: row.pick_a_original_team_name,
        original_team_abbreviation: row.pick_a_original_team_abbreviation
      },
      pick_b: {
        id: row.pick_b_id,
        round: row.pick_b_round,
        year: parseInt(row.pick_b_year.split('/')[0]),
        original_team_id: row.pick_b_original_team_id,
        original_team_name: row.pick_b_original_team_name,
        original_team_abbreviation: row.pick_b_original_team_abbreviation
      },
      owned_by_team: {
        id: row.owned_by_team_id,
        name: row.owned_by_team_name,
        abbreviation: row.owned_by_team_abbreviation
      }
    }));
  }

  // Buscar pick swap por ID
  static async getPickSwapById(id: number): Promise<PickSwapWithDetails | null> {
    const { rows } = await pool.query(`
      SELECT 
        ps.*,
        pa.round as pick_a_round,
        sa.year as pick_a_year,
        pa.original_team_id as pick_a_original_team_id,
        ta_original.name as pick_a_original_team_name,
        ta_original.abbreviation as pick_a_original_team_abbreviation,
        pb.round as pick_b_round,
        sb.year as pick_b_year,
        pb.original_team_id as pick_b_original_team_id,
        tb_original.name as pick_b_original_team_name,
        tb_original.abbreviation as pick_b_original_team_abbreviation,
        t_owner.name as owned_by_team_name,
        t_owner.abbreviation as owned_by_team_abbreviation
      FROM pick_swaps ps
      JOIN picks pa ON ps.pick_a_id = pa.id
      JOIN picks pb ON ps.pick_b_id = pb.id
      JOIN seasons sa ON pa.season_id = sa.id
      JOIN seasons sb ON pb.season_id = sb.id
      JOIN teams ta_original ON pa.original_team_id = ta_original.id
      JOIN teams tb_original ON pb.original_team_id = tb_original.id
      JOIN teams t_owner ON ps.owned_by_team_id = t_owner.id
      WHERE ps.id = $1
    `, [id]);

    if (rows.length === 0) return null;

    const row = rows[0];
    return {
      id: row.id,
      season_id: row.season_id,
      swap_type: row.swap_type,
      pick_a_id: row.pick_a_id,
      pick_b_id: row.pick_b_id,
      owned_by_team_id: row.owned_by_team_id,
      created_at: row.created_at,
      pick_a: {
        id: row.pick_a_id,
        round: row.pick_a_round,
        year: parseInt(row.pick_a_year.split('/')[0]),
        original_team_id: row.pick_a_original_team_id,
        original_team_name: row.pick_a_original_team_name,
        original_team_abbreviation: row.pick_a_original_team_abbreviation
      },
      pick_b: {
        id: row.pick_b_id,
        round: row.pick_b_round,
        year: parseInt(row.pick_b_year.split('/')[0]),
        original_team_id: row.pick_b_original_team_id,
        original_team_name: row.pick_b_original_team_name,
        original_team_abbreviation: row.pick_b_original_team_abbreviation
      },
      owned_by_team: {
        id: row.owned_by_team_id,
        name: row.owned_by_team_name,
        abbreviation: row.owned_by_team_abbreviation
      }
    };
  }

  // Criar novo pick swap
  static async createPickSwap(data: CreatePickSwapRequest): Promise<PickSwap> {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');

      // Validar se as picks existem e não estão em outro swap
      const { rows: pickA } = await client.query(`
        SELECT id, is_in_swap FROM picks WHERE id = $1
      `, [data.pick_a_id]);

      const { rows: pickB } = await client.query(`
        SELECT id, is_in_swap FROM picks WHERE id = $2
      `, [data.pick_b_id]);

      if (pickA.length === 0) {
        throw new Error('Pick A não encontrada');
      }

      if (pickB.length === 0) {
        throw new Error('Pick B não encontrada');
      }

      if (pickA[0].is_in_swap) {
        throw new Error('Pick A já está em um swap');
      }

      if (pickB[0].is_in_swap) {
        throw new Error('Pick B já está em um swap');
      }

      // Validar se as picks são diferentes
      if (data.pick_a_id === data.pick_b_id) {
        throw new Error('As picks devem ser diferentes');
      }

      // Validar se o time é dono de pelo menos uma das picks
      const { rows: ownedPicks } = await client.query(`
        SELECT id FROM picks 
        WHERE id IN ($1, $2) AND current_team_id = $3
      `, [data.pick_a_id, data.pick_b_id, data.owned_by_team_id]);

      if (ownedPicks.length === 0) {
        throw new Error('O time deve ser dono de pelo menos uma das picks');
      }

      // Criar o swap
      const { rows } = await client.query(`
        INSERT INTO pick_swaps (season_id, swap_type, pick_a_id, pick_b_id, owned_by_team_id)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING *
      `, [data.season_id, data.swap_type, data.pick_a_id, data.pick_b_id, data.owned_by_team_id]);

      // Marcar as picks como em swap
      await client.query(`
        UPDATE picks SET is_in_swap = true WHERE id IN ($1, $2)
      `, [data.pick_a_id, data.pick_b_id]);

      await client.query('COMMIT');
      return rows[0];
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  // Deletar pick swap
  static async deletePickSwap(id: number): Promise<void> {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');

      // Buscar o swap para pegar as picks
      const { rows } = await client.query(`
        SELECT pick_a_id, pick_b_id FROM pick_swaps WHERE id = $1
      `, [id]);

      if (rows.length === 0) {
        throw new Error('Pick swap não encontrado');
      }

      const swap = rows[0];

      // Deletar o swap
      await client.query(`
        DELETE FROM pick_swaps WHERE id = $1
      `, [id]);

      // Desmarcar as picks como em swap
      await client.query(`
        UPDATE picks SET is_in_swap = false WHERE id IN ($1, $2)
      `, [swap.pick_a_id, swap.pick_b_id]);

      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  // Buscar swaps de um time
  static async getTeamPickSwaps(teamId: number): Promise<PickSwapWithDetails[]> {
    const { rows } = await pool.query(`
      SELECT 
        ps.*,
        pa.round as pick_a_round,
        sa.year as pick_a_year,
        pa.original_team_id as pick_a_original_team_id,
        ta_original.name as pick_a_original_team_name,
        ta_original.abbreviation as pick_a_original_team_abbreviation,
        pb.round as pick_b_round,
        sb.year as pick_b_year,
        pb.original_team_id as pick_b_original_team_id,
        tb_original.name as pick_b_original_team_name,
        tb_original.abbreviation as pick_b_original_team_abbreviation,
        t_owner.name as owned_by_team_name,
        t_owner.abbreviation as owned_by_team_abbreviation
      FROM pick_swaps ps
      JOIN picks pa ON ps.pick_a_id = pa.id
      JOIN picks pb ON ps.pick_b_id = pb.id
      JOIN seasons sa ON pa.season_id = sa.id
      JOIN seasons sb ON pb.season_id = sb.id
      JOIN teams ta_original ON pa.original_team_id = ta_original.id
      JOIN teams tb_original ON pb.original_team_id = tb_original.id
      JOIN teams t_owner ON ps.owned_by_team_id = t_owner.id
      WHERE ps.owned_by_team_id = $1
      ORDER BY ps.created_at DESC
    `, [teamId]);

    return rows.map(row => ({
      id: row.id,
      season_id: row.season_id,
      swap_type: row.swap_type,
      pick_a_id: row.pick_a_id,
      pick_b_id: row.pick_b_id,
      owned_by_team_id: row.owned_by_team_id,
      created_at: row.created_at,
      pick_a: {
        id: row.pick_a_id,
        round: row.pick_a_round,
        year: parseInt(row.pick_a_year.split('/')[0]),
        original_team_id: row.pick_a_original_team_id,
        original_team_name: row.pick_a_original_team_name,
        original_team_abbreviation: row.pick_a_original_team_abbreviation
      },
      pick_b: {
        id: row.pick_b_id,
        round: row.pick_b_round,
        year: parseInt(row.pick_b_year.split('/')[0]),
        original_team_id: row.pick_b_original_team_id,
        original_team_name: row.pick_b_original_team_name,
        original_team_abbreviation: row.pick_b_original_team_abbreviation
      },
      owned_by_team: {
        id: row.owned_by_team_id,
        name: row.owned_by_team_name,
        abbreviation: row.owned_by_team_abbreviation
      }
    }));
  }

  // Transferir ownership de um swap
  static async transferSwapOwnership(swapId: number, newOwnerTeamId: number): Promise<void> {
    await pool.query(`
      UPDATE pick_swaps 
      SET owned_by_team_id = $1 
      WHERE id = $2
    `, [newOwnerTeamId, swapId]);
  }
} 