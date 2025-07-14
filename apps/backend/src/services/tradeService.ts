import pool from '../utils/postgresClient.js';
import { 
  Trade, 
  TradeParticipant, 
  TradeAsset,
  TradeAssetMovement,
  CreateTradeRequest, 
  UpdateTradeParticipantRequest,
  TradeWithDetails,
  TradeQueryParams,
  ExecuteTradeRequest,
  RevertTradeRequest
} from '../types';

export class TradeService {
  // Buscar todas as trades com filtros
  static async getAllTrades(params: TradeQueryParams = {}): Promise<Trade[]> {
    const { page = 1, limit = 10, sortBy = 'created_at', sortOrder = 'desc', ...filters } = params;
    const offset = (page - 1) * limit;
    
    let whereClause = 'WHERE 1=1';
    const values: any[] = [];
    let valueIndex = 1;
    
    if (filters.season_id) {
      whereClause += ` AND t.season_id = $${valueIndex++}`;
      values.push(filters.season_id);
    }
    
    if (filters.status) {
      whereClause += ` AND t.status = $${valueIndex++}`;
      values.push(filters.status);
    }
    
    if (filters.team_id) {
      whereClause += ` AND EXISTS (
        SELECT 1 FROM trade_participants tp 
        WHERE tp.trade_id = t.id AND tp.team_id = $${valueIndex}
      )`;
      values.push(filters.team_id);
      valueIndex++;
    }
    
    if (filters.created_by_team) {
      whereClause += ` AND t.created_by_team = $${valueIndex++}`;
      values.push(filters.created_by_team);
    }
    
    const sql = `
      SELECT t.*
      FROM trades t
      ${whereClause}
      ORDER BY t.${sortBy} ${sortOrder}
      LIMIT $${valueIndex++} OFFSET $${valueIndex++}
    `;
    
    values.push(limit, offset);
    const { rows } = await pool.query(sql, values);
    
    // Para cada trade, buscar os participantes completos (mesma estrutura do getTradesByTeam)
    const tradesWithDetails = await Promise.all(
      rows.map(async (trade) => {
        // Buscar participantes da trade
        const participantsResult = await pool.query(`
          SELECT 
            tp.id,
            tp.team_id,
            tp.is_initiator,
            tp.response_status,
            tm.name as team_name,
            tm.abbreviation as team_abbreviation
          FROM trade_participants tp
          JOIN teams tm ON tm.id = tp.team_id
          WHERE tp.trade_id = $1
          ORDER BY tp.id
        `, [trade.id]);

        // Para cada participante, buscar seus assets
        const participantsWithAssets = await Promise.all(
          participantsResult.rows.map(async (participant) => {
            // Buscar assets do participante
            const assetsResult = await pool.query(`
              SELECT 
                ta.asset_type,
                ta.player_id,
                ta.pick_id,
                tam.from_team_id,
                tam.to_team_id,
                p.name as player_name,
                p.position as player_position,
                p.ovr as player_ovr,
                s.year as pick_year,
                pk.round as pick_round,
                pk.original_team_id,
                tm_original.name as pick_original_team_name,
                tm_from.name as from_team_name,
                tm_from.abbreviation as from_team_abbreviation,
                tm_to.name as to_team_name,
                tm_to.abbreviation as to_team_abbreviation,
                tm_dest.name as to_participant_team_name,
                tm_dest.abbreviation as to_participant_team_abbreviation
              FROM trade_assets ta
              LEFT JOIN players p ON p.id = ta.player_id
              LEFT JOIN picks pk ON pk.id = ta.pick_id
              LEFT JOIN seasons s ON s.id = pk.season_id
              LEFT JOIN teams tm_original ON tm_original.id = pk.original_team_id
              LEFT JOIN trade_asset_movements tam ON (tam.asset_type = ta.asset_type AND 
                (tam.asset_id = ta.player_id OR tam.asset_id = ta.pick_id))
              LEFT JOIN teams tm_from ON tm_from.id = tam.from_team_id
              LEFT JOIN teams tm_to ON tm_to.id = tam.to_team_id
              LEFT JOIN trade_participants tp_dest ON tp_dest.id = ta.to_participant_id
              LEFT JOIN teams tm_dest ON tm_dest.id = tp_dest.team_id
              WHERE ta.participant_id = $1
              ORDER BY ta.id
            `, [participant.id]);

            // Formatar assets
            const assets = assetsResult.rows.map(asset => {
              if (asset.asset_type === 'player') {
                return {
                  asset_type: 'player',
                  player_id: asset.player_id,
                  from_team_id: asset.from_team_id,
                  to_team_id: asset.to_team_id,
                  from_team_name: asset.from_team_name,
                  from_team_abbreviation: asset.from_team_abbreviation,
                  to_team_name: asset.to_team_name,
                  to_team_abbreviation: asset.to_team_abbreviation,
                  player: {
                    id: asset.player_id,
                    name: asset.player_name,
                    position: asset.player_position,
                    ovr: asset.player_ovr
                  },
                  to_participant_team_name: asset.to_participant_team_name,
                  to_participant_team_abbreviation: asset.to_participant_team_abbreviation
                };
              } else {
                return {
                  asset_type: 'pick',
                  pick_id: asset.pick_id,
                  from_team_id: asset.from_team_id,
                  to_team_id: asset.to_team_id,
                  from_team_name: asset.from_team_name,
                  from_team_abbreviation: asset.from_team_abbreviation,
                  to_team_name: asset.to_team_name,
                  to_team_abbreviation: asset.to_team_abbreviation,
                  pick: {
                    id: asset.pick_id,
                    year: asset.pick_year,
                    round: asset.pick_round,
                    original_team_id: asset.original_team_id,
                    original_team_name: asset.pick_original_team_name
                  },
                  to_participant_team_name: asset.to_participant_team_name,
                  to_participant_team_abbreviation: asset.to_participant_team_abbreviation
                };
              }
            });

            return {
              id: participant.id,
              team_id: participant.team_id,
              is_initiator: participant.is_initiator,
              response_status: participant.response_status,
              team: {
                id: participant.team_id,
                name: participant.team_name,
                abbreviation: participant.team_abbreviation
              },
              assets
            };
          })
        );

        return {
          ...trade,
          participants: participantsWithAssets
        };
      })
    );

    return tradesWithDetails;
  }

  // Buscar trade por ID com detalhes completos
  static async getTradeById(id: number): Promise<TradeWithDetails | null> {
    const { rows } = await pool.query(`
      SELECT 
        t.*,
        tp.id as participant_id,
        tp.team_id,
        tp.is_initiator,
        tp.response_status,
        tp.responded_at,
        tm.id as team_id,
        tm.name as team_name,
        tm.abbreviation as team_abbreviation,
        ta.id as asset_id,
        ta.asset_type,
        ta.player_id,
        ta.pick_id,
        p.name as player_name,
        p.position as player_position,
        p.ovr as player_ovr,
        pk.round as pick_round,
        pk.year as pick_year,
        pk.original_team_id as pick_original_team_id
      FROM trades t
      LEFT JOIN trade_participants tp ON t.id = tp.trade_id
      LEFT JOIN teams tm ON tp.team_id = tm.id
      LEFT JOIN trade_assets ta ON tp.id = ta.participant_id
      LEFT JOIN players p ON ta.player_id = p.id
      LEFT JOIN picks pk ON ta.pick_id = pk.id
      WHERE t.id = $1
      ORDER BY tp.id, ta.id
    `, [id]);

    if (rows.length === 0) return null;

    // Estruturar os dados
    const trade: TradeWithDetails = {
      id: rows[0].id,
      season_id: rows[0].season_id,
      status: rows[0].status,
      created_by_team: rows[0].created_by_team,
      created_at: rows[0].created_at,
      executed_at: rows[0].executed_at,
      reverted_at: rows[0].reverted_at,
      reverted_by_user: rows[0].reverted_by_user,
      participants: [],
      movements: []
    };

    // Agrupar participantes e assets
    const participantsMap = new Map();
    
    rows.forEach(row => {
      if (row.participant_id) {
        if (!participantsMap.has(row.participant_id)) {
          participantsMap.set(row.participant_id, {
            id: row.participant_id,
            trade_id: row.id,
            team_id: row.team_id,
            is_initiator: row.is_initiator,
            response_status: row.response_status,
            responded_at: row.responded_at,
            team: {
              id: row.team_id,
              name: row.team_name,
              abbreviation: row.team_abbreviation
            },
            assets: []
          });
        }

        if (row.asset_id) {
          const asset = {
            id: row.asset_id,
            participant_id: row.participant_id,
            asset_type: row.asset_type,
            player_id: row.player_id,
            pick_id: row.pick_id,
            player: row.player_id ? {
              id: row.player_id,
              name: row.player_name,
              position: row.player_position,
              ovr: row.player_ovr
            } : null,
            pick: row.pick_id ? {
              id: row.pick_id,
              round: row.pick_round,
              year: row.pick_year,
              original_team_id: row.pick_original_team_id
            } : null,
            to_participant_team_name: row.to_participant_team_name,
            to_participant_team_abbreviation: row.to_participant_team_abbreviation
          };
          participantsMap.get(row.participant_id).assets.push(asset);
        }
      }
    });

    trade.participants = Array.from(participantsMap.values());

    // Buscar movimentos se a trade foi executada
    if (trade.status === 'executed' || trade.status === 'reverted') {
      const movementsResult = await pool.query(`
        SELECT 
          m.*,
          t_from.name as from_team_name,
          t_from.abbreviation as from_team_abbreviation,
          t_to.name as to_team_name,
          t_to.abbreviation as to_team_abbreviation
        FROM trade_asset_movements m
        LEFT JOIN teams t_from ON t_from.id = m.from_team_id
        LEFT JOIN teams t_to ON t_to.id = m.to_team_id
        WHERE m.trade_id = $1
        ORDER BY m.moved_at DESC
      `, [id]);
      trade.movements = movementsResult.rows;
    }

    return trade;
  }

  // Criar nova trade
  static async createTrade(tradeData: CreateTradeRequest): Promise<Trade> {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // 1. Criar a trade
      const tradeResult = await client.query(`
        INSERT INTO trades (season_id, created_by_team, status)
        VALUES ($1, $2, 'proposed')
        RETURNING *
      `, [tradeData.season_id, tradeData.created_by_team]);
      
      const trade = tradeResult.rows[0];
      
      // 2. Criar participantes e mapear índices para IDs
      const participantIdMap = new Map<number, number>(); // índice -> ID real
      const participantRecords: any[] = [];
      for (let i = 0; i < tradeData.participants.length; i++) {
        const participant = tradeData.participants[i];
        if (!participant) continue;
        const responseStatus = participant.is_initiator ? 'accepted' : 'pending';
        const participantResult = await client.query(`
          INSERT INTO trade_participants (trade_id, team_id, is_initiator, response_status)
          VALUES ($1, $2, $3, $4)
          RETURNING *
        `, [trade.id, participant.team_id, participant.is_initiator, responseStatus]);
        const participantRecord = participantResult.rows[0];
        participantIdMap.set(i, participantRecord.id);
        participantRecords.push({ ...participant, db_id: participantRecord.id });
      }
      // 3. Inserir todos os assets agora que todos os participantes existem
      for (let i = 0; i < tradeData.participants.length; i++) {
        const participant = tradeData.participants[i];
        const participantDbId = participantIdMap.get(i);
        if (!participant || !participantDbId) continue;
        for (const asset of participant.assets) {
          const realToParticipantId = asset.to_participant_id !== undefined 
            ? participantIdMap.get(asset.to_participant_id) 
            : null;
          await client.query(`
            INSERT INTO trade_assets (participant_id, to_participant_id, asset_type, player_id, pick_id)
            VALUES ($1, $2, $3, $4, $5)
          `, [
            participantDbId,
            realToParticipantId,
            asset.asset_type,
            asset.player_id || null,
            asset.pick_id || null
          ]);
        }
      }
      await client.query('COMMIT');
      return trade;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  // Atualizar resposta de participante
  static async updateParticipantResponse(
    participantId: number, 
    responseData: UpdateTradeParticipantRequest
  ): Promise<TradeParticipant> {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // 1. Atualizar participante
      const participantResult = await client.query(`
        UPDATE trade_participants 
        SET response_status = $1, responded_at = NOW()
        WHERE id = $2
        RETURNING *
      `, [responseData.response_status, participantId]);
      
      if (participantResult.rows.length === 0) {
        throw new Error('Participante não encontrado');
      }
      
      const participant = participantResult.rows[0];
      
      // Após atualizar o participante:
      if (responseData.response_status === 'rejected') {
        // Se rejeitou, cancela a trade imediatamente
        await client.query(`
          UPDATE trades 
          SET status = 'cancelled'
          WHERE id = $1
        `, [participant.trade_id]);
        await client.query('COMMIT');
        return participant;
      }
      
      // 2. Verificar se todos os participantes responderam
      const allParticipantsResult = await client.query(`
        SELECT response_status 
        FROM trade_participants 
        WHERE trade_id = $1
      `, [participant.trade_id]);
      
      const allParticipants = allParticipantsResult.rows;
      const allResponded = allParticipants.every(p => p.response_status !== 'pending');
      
      if (allResponded) {
        const hasRejection = allParticipants.some(p => p.response_status === 'rejected');
        
        if (hasRejection) {
          // Se alguém rejeitou, cancela a trade
          await client.query(`
            UPDATE trades 
            SET status = 'cancelled'
            WHERE id = $1
          `, [participant.trade_id]);
        } else {
          // Se todos aceitaram, executa automaticamente
          await client.query(`
            UPDATE trades 
            SET status = 'pending'
            WHERE id = $1
          `, [participant.trade_id]);
          
          // Executar a trade automaticamente
          await this.executeTradeInternal(client, participant.trade_id);
        }
      }
      
      await client.query('COMMIT');
      return participant;
      
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  // Executar trade (versão pública - abre nova transação)
  static async executeTrade(tradeId: number): Promise<Trade> {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // 1. Verificar se a trade pode ser executada
      const tradeResult = await client.query(`
        SELECT status FROM trades WHERE id = $1
      `, [tradeId]);
      
      if (tradeResult.rows.length === 0) {
        throw new Error('Trade não encontrada');
      }
      
      if (tradeResult.rows[0].status !== 'pending') {
        throw new Error('Trade não pode ser executada. Status deve ser pending');
      }
      
      // Executar a trade
      await this.executeTradeInternal(client, tradeId);
      
      await client.query('COMMIT');
      
      // Retornar a trade atualizada
      const updatedTradeResult = await client.query(`
        SELECT * FROM trades WHERE id = $1
      `, [tradeId]);
      
      return updatedTradeResult.rows[0];
      
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  // Executar trade (versão interna - usa transação existente)
  private static async executeTradeInternal(client: any, tradeId: number): Promise<void> {
    // 2. Buscar todos os assets da trade
    const assetsResult = await client.query(`
      SELECT 
        ta.*,
        tp.team_id as participant_team_id,
        tp.is_initiator
      FROM trade_assets ta
      JOIN trade_participants tp ON ta.participant_id = tp.id
      WHERE tp.trade_id = $1
    `, [tradeId]);
    
    const assets = assetsResult.rows;
    
    // 3. Para cada asset, determinar o time de destino
    for (const asset of assets) {
      // Encontrar o time que ofereceu este asset (não é o dono atual)
      const toTeamResult = await client.query(`
        SELECT tp.team_id
        FROM trade_participants tp
        WHERE tp.id = $1
      `, [asset.to_participant_id]);
      const toTeamId = toTeamResult.rows[0].team_id;
      
      // 4. Registrar movimento
      await client.query(`
        INSERT INTO trade_asset_movements 
        (trade_id, asset_type, asset_id, from_team_id, to_team_id)
        VALUES ($1, $2, $3, $4, $5)
      `, [
        tradeId,
        asset.asset_type,
        asset.player_id || asset.pick_id,
        asset.participant_team_id,
        toTeamId
      ]);
      
      // 5. Atualizar ownership do asset
      if (asset.asset_type === 'player') {
        await client.query(`
          UPDATE players 
          SET team_id = $1 
          WHERE id = $2
        `, [toTeamId, asset.player_id]);
      } else {
        await client.query(`
          UPDATE picks 
          SET current_team_id = $1 
          WHERE id = $2
        `, [toTeamId, asset.pick_id]);
      }
    }
    
    // 6. Atualizar status da trade
    await client.query(`
      UPDATE trades 
      SET status = 'executed', executed_at = NOW()
      WHERE id = $1
    `, [tradeId]);
  }

  // Reverter trade (apenas admin)
  static async revertTrade(tradeId: number, revertedByUser: number): Promise<Trade> {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // 1. Verificar se a trade pode ser revertida
      const tradeResult = await client.query(`
        SELECT status FROM trades WHERE id = $1
      `, [tradeId]);
      
      if (tradeResult.rows.length === 0) {
        throw new Error('Trade não encontrada');
      }
      
      if (tradeResult.rows[0].status !== 'executed') {
        throw new Error('Trade não pode ser revertida. Status deve ser executed');
      }
      
      // 2. Buscar todos os movimentos da trade (ordem decrescente)
      const movementsResult = await client.query(`
        SELECT * FROM trade_asset_movements 
        WHERE trade_id = $1 
        ORDER BY moved_at DESC
      `, [tradeId]);
      
      const movements = movementsResult.rows;
      
      // 3. Reverter cada movimento
      for (const movement of movements) {
        if (movement.asset_type === 'player') {
          await client.query(`
            UPDATE players 
            SET team_id = $1 
            WHERE id = $2
          `, [movement.from_team_id, movement.asset_id]);
        } else {
          await client.query(`
            UPDATE picks 
            SET current_team_id = $1 
            WHERE id = $2
          `, [movement.from_team_id, movement.asset_id]);
        }
      }
      
      // 4. Atualizar status da trade
      const updatedTradeResult = await client.query(`
        UPDATE trades 
        SET status = 'reverted', reverted_at = NOW(), reverted_by_user = $1
        WHERE id = $2
        RETURNING *
      `, [revertedByUser, tradeId]);
      
      await client.query('COMMIT');
      return updatedTradeResult.rows[0];
      
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  // Buscar trades de um time específico
  static async getTradesByTeam(teamId: number, seasonId?: number): Promise<Trade[]> {
    let sql = `
      SELECT DISTINCT t.*
      FROM trades t
      JOIN trade_participants tp ON t.id = tp.trade_id
      WHERE tp.team_id = $1
    `;
    
    const values: any[] = [teamId];
    let valueIndex = 2;
    
    if (seasonId) {
      sql += ` AND t.season_id = $${valueIndex++}`;
      values.push(seasonId);
    }
    
    sql += ` ORDER BY t.created_at DESC`;
    
    const { rows } = await pool.query(sql, values);
    
    // Para cada trade, buscar os participantes completos
    const tradesWithDetails = await Promise.all(
      rows.map(async (trade) => {
        // Buscar participantes da trade
        const participantsResult = await pool.query(`
          SELECT 
            tp.id,
            tp.team_id,
            tp.is_initiator,
            tp.response_status,
            tm.name as team_name,
            tm.abbreviation as team_abbreviation
          FROM trade_participants tp
          JOIN teams tm ON tm.id = tp.team_id
          WHERE tp.trade_id = $1
          ORDER BY tp.id
        `, [trade.id]);

        // Para cada participante, buscar seus assets
        const participantsWithAssets = await Promise.all(
          participantsResult.rows.map(async (participant) => {
            // Buscar assets do participante
            const assetsResult = await pool.query(`
              SELECT 
                ta.asset_type,
                ta.player_id,
                ta.pick_id,
                tam.from_team_id,
                tam.to_team_id,
                p.name as player_name,
                p.position as player_position,
                p.ovr as player_ovr,
                s.year as pick_year,
                pk.round as pick_round,
                pk.original_team_id,
                tm_original.name as pick_original_team_name,
                tm_from.name as from_team_name,
                tm_from.abbreviation as from_team_abbreviation,
                tm_to.name as to_team_name,
                tm_to.abbreviation as to_team_abbreviation,
                tm_dest.name as to_participant_team_name,
                tm_dest.abbreviation as to_participant_team_abbreviation
              FROM trade_assets ta
              LEFT JOIN players p ON p.id = ta.player_id
              LEFT JOIN picks pk ON pk.id = ta.pick_id
              LEFT JOIN seasons s ON s.id = pk.season_id
              LEFT JOIN teams tm_original ON tm_original.id = pk.original_team_id
              LEFT JOIN trade_asset_movements tam ON (tam.asset_type = ta.asset_type AND 
                (tam.asset_id = ta.player_id OR tam.asset_id = ta.pick_id))
              LEFT JOIN teams tm_from ON tm_from.id = tam.from_team_id
              LEFT JOIN teams tm_to ON tm_to.id = tam.to_team_id
              LEFT JOIN trade_participants tp_dest ON tp_dest.id = ta.to_participant_id
              LEFT JOIN teams tm_dest ON tm_dest.id = tp_dest.team_id
              WHERE ta.participant_id = $1
              ORDER BY ta.id
            `, [participant.id]);

            // Formatar assets
            const assets = assetsResult.rows.map(asset => {
              if (asset.asset_type === 'player') {
                return {
                  asset_type: 'player',
                  player_id: asset.player_id,
                  from_team_id: asset.from_team_id,
                  to_team_id: asset.to_team_id,
                  from_team_name: asset.from_team_name,
                  from_team_abbreviation: asset.from_team_abbreviation,
                  to_team_name: asset.to_team_name,
                  to_team_abbreviation: asset.to_team_abbreviation,
                  player: {
                    id: asset.player_id,
                    name: asset.player_name,
                    position: asset.player_position,
                    ovr: asset.player_ovr
                  },
                  to_participant_team_name: asset.to_participant_team_name,
                  to_participant_team_abbreviation: asset.to_participant_team_abbreviation
                };
              } else {
                return {
                  asset_type: 'pick',
                  pick_id: asset.pick_id,
                  from_team_id: asset.from_team_id,
                  to_team_id: asset.to_team_id,
                  from_team_name: asset.from_team_name,
                  from_team_abbreviation: asset.from_team_abbreviation,
                  to_team_name: asset.to_team_name,
                  to_team_abbreviation: asset.to_team_abbreviation,
                  pick: {
                    id: asset.pick_id,
                    year: asset.pick_year,
                    round: asset.pick_round,
                    original_team_id: asset.original_team_id,
                    original_team_name: asset.pick_original_team_name
                  },
                  to_participant_team_name: asset.to_participant_team_name,
                  to_participant_team_abbreviation: asset.to_participant_team_abbreviation
                };
              }
            });

            return {
              id: participant.id,
              team_id: participant.team_id,
              is_initiator: participant.is_initiator,
              response_status: participant.response_status,
              team: {
                id: participant.team_id,
                name: participant.team_name,
                abbreviation: participant.team_abbreviation
              },
              assets
            };
          })
        );

        return {
          ...trade,
          participants: participantsWithAssets
        };
      })
    );

    return tradesWithDetails;
  }

  // Buscar trades em que o time está envolvido (participant_id ou to_participant_id)
  static async getMyTrades(teamId: number): Promise<TradeWithDetails[]> {
    // 1. Buscar todos os participant_id do time
    const { rows: participants } = await pool.query(
      'SELECT id FROM trade_participants WHERE team_id = $1',
      [teamId]
    );
    const participantIds = participants.map((p: any) => p.id);
    if (participantIds.length === 0) {
      return [];
    }

    // 2. Buscar todas as trades onde esses participant_id aparecem em trade_assets
    const { rows: trades } = await pool.query(
      `SELECT DISTINCT t.*
       FROM trades t
       JOIN trade_assets ta ON t.id = ta.trade_id
       WHERE ta.participant_id = ANY($1) OR ta.to_participant_id = ANY($1)
       ORDER BY t.created_at DESC`,
      [participantIds]
    );

    // 3. Buscar detalhes dos participantes e assets (igual getTradesByTeam)
    const tradesWithDetails = await Promise.all(
      trades.map(async (trade) => {
        // Buscar participantes da trade
        const participantsResult = await pool.query(`
          SELECT 
            tp.id,
            tp.team_id,
            tp.is_initiator,
            tp.response_status,
            tm.name as team_name,
            tm.abbreviation as team_abbreviation
          FROM trade_participants tp
          JOIN teams tm ON tm.id = tp.team_id
          WHERE tp.trade_id = $1
          ORDER BY tp.id
        `, [trade.id]);

        // Para cada participante, buscar seus assets
        const participantsWithAssets = await Promise.all(
          participantsResult.rows.map(async (participant) => {
            // Buscar assets do participante
            const assetsResult = await pool.query(`
              SELECT 
                ta.asset_type,
                ta.player_id,
                ta.pick_id,
                tam.from_team_id,
                tam.to_team_id,
                p.name as player_name,
                p.position as player_position,
                p.ovr as player_ovr,
                s.year as pick_year,
                pk.round as pick_round,
                pk.original_team_id,
                tm_original.name as pick_original_team_name,
                tm_from.name as from_team_name,
                tm_from.abbreviation as from_team_abbreviation,
                tm_to.name as to_team_name,
                tm_to.abbreviation as to_team_abbreviation,
                tm_dest.name as to_participant_team_name,
                tm_dest.abbreviation as to_participant_team_abbreviation
              FROM trade_assets ta
              LEFT JOIN players p ON p.id = ta.player_id
              LEFT JOIN picks pk ON pk.id = ta.pick_id
              LEFT JOIN seasons s ON s.id = pk.season_id
              LEFT JOIN teams tm_original ON tm_original.id = pk.original_team_id
              LEFT JOIN trade_asset_movements tam ON (tam.asset_type = ta.asset_type AND 
                (tam.asset_id = ta.player_id OR tam.asset_id = ta.pick_id))
              LEFT JOIN teams tm_from ON tm_from.id = tam.from_team_id
              LEFT JOIN teams tm_to ON tm_to.id = tam.to_team_id
              LEFT JOIN trade_participants tp_dest ON tp_dest.id = ta.to_participant_id
              LEFT JOIN teams tm_dest ON tm_dest.id = tp_dest.team_id
              WHERE ta.participant_id = $1
              ORDER BY ta.id
            `, [participant.id]);

            // Formatar assets
            const assets = assetsResult.rows.map(asset => {
              if (asset.asset_type === 'player') {
                return {
                  asset_type: 'player',
                  player_id: asset.player_id,
                  from_team_id: asset.from_team_id,
                  to_team_id: asset.to_team_id,
                  from_team_name: asset.from_team_name,
                  from_team_abbreviation: asset.from_team_abbreviation,
                  to_team_name: asset.to_team_name,
                  to_team_abbreviation: asset.to_team_abbreviation,
                  player: {
                    id: asset.player_id,
                    name: asset.player_name,
                    position: asset.player_position,
                    ovr: asset.player_ovr
                  },
                  to_participant_team_name: asset.to_participant_team_name,
                  to_participant_team_abbreviation: asset.to_participant_team_abbreviation
                };
              } else {
                return {
                  asset_type: 'pick',
                  pick_id: asset.pick_id,
                  from_team_id: asset.from_team_id,
                  to_team_id: asset.to_team_id,
                  from_team_name: asset.from_team_name,
                  from_team_abbreviation: asset.from_team_abbreviation,
                  to_team_name: asset.to_team_name,
                  to_team_abbreviation: asset.to_team_abbreviation,
                  pick: {
                    id: asset.pick_id,
                    year: asset.pick_year,
                    round: asset.pick_round,
                    original_team_id: asset.original_team_id,
                    original_team_name: asset.pick_original_team_name
                  },
                  to_participant_team_name: asset.to_participant_team_name,
                  to_participant_team_abbreviation: asset.to_participant_team_abbreviation
                };
              }
            });

            return {
              id: participant.id,
              team_id: participant.team_id,
              is_initiator: participant.is_initiator,
              response_status: participant.response_status,
              team: {
                id: participant.team_id,
                name: participant.team_name,
                abbreviation: participant.team_abbreviation
              },
              assets
            };
          })
        );

        return {
          ...trade,
          participants: participantsWithAssets
        };
      })
    );

    return tradesWithDetails;
  }

  // Contar trades por status
  static async getTradeCounts(seasonId?: number): Promise<Record<string, number>> {
    let sql = `
      SELECT status, COUNT(*) as count
      FROM trades
    `;
    
    const values: any[] = [];
    
    if (seasonId) {
      sql += ` WHERE season_id = $1`;
      values.push(seasonId);
    }
    
    sql += ` GROUP BY status`;
    
    const { rows } = await pool.query(sql, values);
    
    const counts: Record<string, number> = {
      proposed: 0,
      pending: 0,
      executed: 0,
      reverted: 0,
      cancelled: 0
    };
    
    rows.forEach(row => {
      counts[row.status] = parseInt(row.count);
    });
    
    return counts;
  }

  static async countMyTrades(teamId: number): Promise<number> {
    // 1. Buscar todos os participant_id do time
    const { rows: participants } = await pool.query(
      'SELECT id FROM trade_participants WHERE team_id = $1',
      [teamId]
    );
    const participantIds = participants.map((p: any) => p.id);
    if (participantIds.length === 0) {
      return 0;
    }

    // 2. Contar todas as trades onde esses participant_id aparecem em trade_assets
    const { rows } = await pool.query(
      `SELECT COUNT(DISTINCT t.id) as count
       FROM trades t
       JOIN trade_assets ta ON t.id = ta.trade_id
       WHERE ta.participant_id = ANY($1) OR ta.to_participant_id = ANY($1)`,
      [participantIds]
    );

    return Number(rows[0]?.count || 0);
  }
} 