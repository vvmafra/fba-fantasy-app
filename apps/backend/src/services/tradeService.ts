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
  // Função auxiliar para buscar assets de um participante
  private static async getParticipantAssets(participantId: number) {
    // Primeiro, buscar o trade_id para este participante
    const tradeResult = await pool.query(`
      SELECT trade_id FROM trade_participants WHERE id = $1
    `, [participantId]);
    
    if (tradeResult.rows.length === 0) return [];
    
    const tradeId = tradeResult.rows[0].trade_id;
    
    // Buscar todos os participantes da trade para determinar o destino
    const participantsResult = await pool.query(`
      SELECT id, team_id FROM trade_participants WHERE trade_id = $1 ORDER BY id
    `, [tradeId]);
    
    const participants = participantsResult.rows;
    const isTwoTeamTrade = participants.length === 2;
    
    const assetsResult = await pool.query(`
      SELECT 
        ta.id as asset_id,
        ta.participant_id,
        ta.to_participant_id,
        ta.asset_type,
        ta.player_id,
        ta.pick_id,
        p.name as player_name,
        p.position as player_position,
        p.ovr as player_ovr,
        pk.round as pick_round,
        s.year as pick_year,
        pk.original_team_id as pick_original_team_id,
        tm_original.name as pick_original_team_name,
        tm_original.abbreviation as pick_original_team_abbreviation
      FROM trade_assets ta
      LEFT JOIN players p ON p.id = ta.player_id
      LEFT JOIN picks pk ON pk.id = ta.pick_id
      LEFT JOIN seasons s ON pk.season_id = s.id
      LEFT JOIN teams tm_original ON tm_original.id = pk.original_team_id
      WHERE ta.participant_id = $1
      ORDER BY ta.id
    `, [participantId]);

    // Buscar informações dos times de destino de uma vez
    const teamIds = participants.map(p => p.team_id);
    const teamsResult = await pool.query(`
      SELECT id, name, abbreviation FROM teams WHERE id = ANY($1)
    `, [teamIds]);
    
    const teamsMap = new Map();
    teamsResult.rows.forEach(team => {
      teamsMap.set(team.id, team);
    });

    return assetsResult.rows.map(asset => {
      // Determinar o destino do asset
      let toParticipantId = asset.to_participant_id;
      let toTeamId = null;
      let toTeamName = null;
      let toTeamAbbreviation = null;
      
      if (!toParticipantId && isTwoTeamTrade) {
        // Para trades de 2 times, o destino é o outro participante
        toParticipantId = participants.find(p => p.id !== participantId)?.id || null;
      }
      
      if (toParticipantId) {
        const toParticipant = participants.find(p => p.id === toParticipantId);
        if (toParticipant) {
          toTeamId = toParticipant.team_id;
          const toTeam = teamsMap.get(toTeamId);
          if (toTeam) {
            toTeamName = toTeam.name;
            toTeamAbbreviation = toTeam.abbreviation;
          }
        }
      }
      
      if (asset.asset_type === 'player') {
        return {
          id: asset.asset_id,
          participant_id: asset.participant_id,
          to_participant_id: toParticipantId,
          asset_type: 'player' as const,
          player_id: asset.player_id,
          pick_id: null,
          player: {
            id: asset.player_id,
            name: asset.player_name,
            position: asset.player_position,
            ovr: asset.player_ovr
          },
          pick: null,
          to_team: toTeamId ? {
            id: toTeamId,
            name: toTeamName,
            abbreviation: toTeamAbbreviation
          } : null
        };
      } else {
        return {
          id: asset.asset_id,
          participant_id: asset.participant_id,
          to_participant_id: toParticipantId,
          asset_type: 'pick' as const,
          player_id: null,
          pick_id: asset.pick_id,
          player: null,
          pick: {
            id: asset.pick_id,
            year: asset.pick_year,
            round: asset.pick_round,
            original_team_id: asset.pick_original_team_id,
            original_team_name: asset.pick_original_team_name,
            original_team_abbreviation: asset.pick_original_team_abbreviation
          },
          to_team: toTeamId ? {
            id: toTeamId,
            name: toTeamName,
            abbreviation: toTeamAbbreviation
          } : null
        };
      }
    });
  }

  // Função auxiliar para buscar trades com detalhes completos
  private static async getTradeWithDetails(trade: any) {
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
        const assets = await this.getParticipantAssets(participant.id);

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
  }

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
    
    if (filters.made !== undefined) {
      whereClause += ` AND t.made = $${valueIndex++}`;
      values.push(filters.made);
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
    
    // Para cada trade, buscar os participantes completos usando a função auxiliar
    const tradesWithDetails = await Promise.all(
      rows.map(async (trade) => {
        return await this.getTradeWithDetails(trade);
      })
    );

    return tradesWithDetails;
  }

  // Buscar trade por ID com detalhes completos
  static async getTradeById(id: number): Promise<TradeWithDetails | null> {
    // 1. Buscar dados básicos da trade
    const tradeResult = await pool.query(`
      SELECT * FROM trades WHERE id = $1
    `, [id]);

    if (tradeResult.rows.length === 0) return null;

    const tradeData = tradeResult.rows[0];

    // 2. Buscar participantes
    const participantsResult = await pool.query(`
      SELECT 
        tp.*,
        t.name as team_name,
        t.abbreviation as team_abbreviation
      FROM trade_participants tp
      JOIN teams t ON tp.team_id = t.id
      WHERE tp.trade_id = $1
      ORDER BY tp.id
    `, [id]);

    // 3. Buscar assets para cada participante
    const participants = [];
    for (const participant of participantsResult.rows) {
      const assets = await this.getParticipantAssets(participant.id);

      participants.push({
        id: participant.id,
        trade_id: participant.trade_id,
        team_id: participant.team_id,
        is_initiator: participant.is_initiator,
        response_status: participant.response_status,
        responded_at: participant.responded_at,
        team: {
          id: participant.team_id,
          name: participant.team_name,
          abbreviation: participant.team_abbreviation
        },
        assets
      });
    }

    const trade: TradeWithDetails = {
      id: tradeData.id,
      season_id: tradeData.season_id,
      status: tradeData.status,
      created_by_team: tradeData.created_by_team,
      created_at: tradeData.created_at,
      executed_at: tradeData.executed_at,
      reverted_at: tradeData.reverted_at,
      reverted_by_user: tradeData.reverted_by_user,
      participants,
      movements: []
    };

    // 4. Buscar movimentos se a trade foi executada
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

  // Verificar se um time atingiu o limite de trades
  static async checkTradeLimit(teamId: number, seasonStart: number, seasonEnd: number): Promise<{ canTrade: boolean; tradesUsed: number; tradesLimit: number }> {
    const tradesUsed = await this.countExecutedTradesByTeam(teamId, seasonStart, seasonEnd);
    const tradesLimit = 10; // Limite fixo de 10 trades a cada 2 temporadas
    
    return {
      canTrade: tradesUsed < tradesLimit,
      tradesUsed,
      tradesLimit
    };
  }

  // Verificar se todos os participantes de uma trade podem aceitar (não atingiram limite)
  static async checkAllParticipantsTradeLimit(tradeId: number): Promise<{ canAccept: boolean; participants: Array<{ teamId: number; teamName: string; canTrade: boolean; tradesUsed: number; tradesLimit: number }> }> {
    // Buscar todos os participantes da trade
    const participantsResult = await pool.query(`
      SELECT tp.team_id, t.name as team_name, tr.season_id
      FROM trade_participants tp
      JOIN trades tr ON tp.trade_id = tr.id
      JOIN teams t ON tp.team_id = t.id
      WHERE tp.trade_id = $1
    `, [tradeId]);
    
    if (participantsResult.rows.length === 0) {
      throw new Error('Trade não encontrada');
    }
    
    const seasonId = participantsResult.rows[0].season_id;
    const seasonStart = Math.floor((seasonId - 1) / 2) * 2 + 1;
    const seasonEnd = seasonStart + 1;
    
    const participants = [];
    let allCanAccept = true;
    
    for (const participant of participantsResult.rows) {
      const tradeLimitCheck = await this.checkTradeLimit(participant.team_id, seasonStart, seasonEnd);
      
      participants.push({
        teamId: participant.team_id,
        teamName: participant.team_name,
        canTrade: tradeLimitCheck.canTrade,
        tradesUsed: tradeLimitCheck.tradesUsed,
        tradesLimit: tradeLimitCheck.tradesLimit
      });
      
      if (!tradeLimitCheck.canTrade) {
        allCanAccept = false;
      }
    }
    
    return {
      canAccept: allCanAccept,
      participants
    };
  }

  // Atualizar resposta de participante
  static async updateParticipantResponse(
    participantId: number, 
    responseData: UpdateTradeParticipantRequest
  ): Promise<TradeParticipant> {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // 1. Buscar informações do participante e trade
      const participantResult = await client.query(`
        SELECT tp.*, t.season_id 
        FROM trade_participants tp
        JOIN trades t ON tp.trade_id = t.id
        WHERE tp.id = $1
      `, [participantId]);
      
      if (participantResult.rows.length === 0) {
        throw new Error('Participante não encontrado');
      }
      
      const participant = participantResult.rows[0];
      const seasonId = participant.season_id;
      
      // 2. Verificar limite de trades se estiver tentando aceitar
      if (responseData.response_status === 'accepted') {
        // Calcular período atual para limite de trades (a cada 2 temporadas)
        const seasonStart = Math.floor((seasonId - 1) / 2) * 2 + 1;
        const seasonEnd = seasonStart + 1;
        
        const tradeLimitCheck = await this.checkTradeLimit(participant.team_id, seasonStart, seasonEnd);
        
        if (!tradeLimitCheck.canTrade) {
          throw new Error(`Time atingiu o limite de ${tradeLimitCheck.tradesLimit} trades para o período ${seasonStart}-${seasonEnd}. Trades utilizadas: ${tradeLimitCheck.tradesUsed}`);
        }
      }
      
      // 3. Atualizar participante
      const updateResult = await client.query(`
        UPDATE trade_participants 
        SET response_status = $1, responded_at = NOW()
        WHERE id = $2
        RETURNING *
      `, [responseData.response_status, participantId]);
      
      const updatedParticipant = updateResult.rows[0];
      
      // Após atualizar o participante:
      if (responseData.response_status === 'rejected') {
        // Se rejeitou, cancela a trade imediatamente
        await client.query(`
          UPDATE trades 
          SET status = 'cancelled'
          WHERE id = $1
        `, [updatedParticipant.trade_id]);
        await client.query('COMMIT');
        return updatedParticipant;
      }
      
      // 2. Verificar se todos os participantes responderam
      const allParticipantsResult = await client.query(`
        SELECT response_status 
        FROM trade_participants 
        WHERE trade_id = $1
      `, [updatedParticipant.trade_id]);
      
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
          `, [updatedParticipant.trade_id]);
          
          // Executar a trade automaticamente
          await this.executeTradeInternal(client, updatedParticipant.trade_id);
        }
      }
      
      await client.query('COMMIT');
      return updatedParticipant;
      
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
      let toParticipantId = asset.to_participant_id;
      if (!toParticipantId) {
        // Buscar todos os participantes da trade
        const participantsResult = await client.query(`
          SELECT id FROM trade_participants WHERE trade_id = $1
        `, [tradeId]);
        const participantIds = participantsResult.rows.map((r: any) => r.id);
        if (participantIds.length === 2) {
          // O destino é o outro participante
          toParticipantId = participantIds.find((id: number) => id !== asset.participant_id);
        }
      }
      const toTeamResult = await client.query(`
        SELECT tp.team_id
        FROM trade_participants tp
        WHERE tp.id = $1
      `, [toParticipantId]);
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

      // 5. Atualizar campo made da trade
      await client.query(`
        UPDATE trades 
        SET made = false
        WHERE id = $1
      `, [tradeId]);
      
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
        return await this.getTradeWithDetails(trade);
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

    // 3. Buscar detalhes dos participantes e assets
    const tradesWithDetails = await Promise.all(
      trades.map(async (trade) => {
        return await this.getTradeWithDetails(trade);
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

  // Contar trades executadas de um time em um período específico
  static async countExecutedTradesByTeam(teamId: number, seasonStart: number, seasonEnd: number): Promise<number> {
    const { rows } = await pool.query(`
      SELECT COUNT(DISTINCT t.id) as trades_used
      FROM trades t
      JOIN trade_participants tp ON t.id = tp.trade_id
      WHERE t.status = 'executed' 
        AND tp.team_id = $1
        AND t.season_id BETWEEN $2 AND $3
    `, [teamId, seasonStart, seasonEnd]);
    
    return Number(rows[0]?.trades_used || 0);
  }

  // Cancelar trade (apenas se não executada)
  static async cancelTrade(tradeId: number): Promise<void> {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      // Verifica status
      const tradeResult = await client.query('SELECT status FROM trades WHERE id = $1', [tradeId]);
      if (tradeResult.rows.length === 0) throw new Error('Trade não encontrada');
      const status = tradeResult.rows[0].status;
      if (status !== 'proposed' && status !== 'pending') {
        throw new Error('Só é possível cancelar trades que não foram executadas ou rejeitadas');
      }
      // Deleta assets
      await client.query('DELETE FROM trade_assets WHERE participant_id IN (SELECT id FROM trade_participants WHERE trade_id = $1)', [tradeId]);
      // Deleta participantes
      await client.query('DELETE FROM trade_participants WHERE trade_id = $1', [tradeId]);
      // Deleta trade
      await client.query('DELETE FROM trades WHERE id = $1', [tradeId]);
      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  // Atualizar campo made de uma trade
  static async updateTradeMade(tradeId: number, made: boolean): Promise<Trade> {
    const { rows } = await pool.query(`
      UPDATE trades 
      SET made = $1      WHERE id = $2
      RETURNING *
    `, [made, tradeId]);
    
    if (rows.length === 0) {
      throw new Error('Trade não encontrada');
    }
    
    return rows[0];
  }

  // Rejeitar automaticamente todas as trades pendentes após o deadline
  static async rejectPendingTradesAfterDeadline(): Promise<{ rejected: number }> {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Buscar todas as trades pendentes ou propostas
      const pendingTradesResult = await client.query(`
        SELECT id FROM trades 
        WHERE status IN ('pending', 'proposed')
      `);
      
      if (pendingTradesResult.rows.length === 0) {
        await client.query('COMMIT');
        return { rejected: 0 };
      }
      
      const tradeIds = pendingTradesResult.rows.map(row => row.id);
      
      // Atualizar status das trades para 'cancelled'
      await client.query(`
        UPDATE trades 
        SET status = 'cancelled'
        WHERE id = ANY($1)
      `, [tradeIds]);
      
      // Atualizar todos os participantes para 'rejected'
      await client.query(`
        UPDATE trade_participants 
        SET response_status = 'rejected', 
            responded_at = NOW() 
        WHERE trade_id = ANY($1)
      `, [tradeIds]);
      
      await client.query('COMMIT');
      return { rejected: tradeIds.length };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
} 