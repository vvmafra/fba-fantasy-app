import { Request, Response } from 'express';
import asyncHandler from 'express-async-handler';
import { TradeService } from '../services/tradeService.js';
import { 
  CreateTradeRequest, 
  UpdateTradeParticipantRequest,
  ExecuteTradeRequest,
  RevertTradeRequest
} from '../types';

export class TradeController {
  // GET /api/v1/trades - Listar todas as trades
  static getAllTrades = asyncHandler(async (req: Request, res: Response) => {
    const trades = await TradeService.getAllTrades(req.query);
    res.status(200).json({ success: true, data: trades });
  });

  // GET /api/v1/trades/:id - Buscar trade por ID com detalhes
  static getTradeById = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    if (!id) {
      res.status(400).json({ success: false, message: 'ID é obrigatório' });
      return;
    }
    
    const trade = await TradeService.getTradeById(Number(id));
    if (!trade) {
      res.status(404).json({ success: false, message: 'Trade não encontrada' });
      return;
    }
    
    res.status(200).json({ success: true, data: trade });
  });

  // GET /api/v1/trades/team/:teamId - Buscar trades de um time específico
  static getTradesByTeam = asyncHandler(async (req: Request, res: Response) => {
    const { teamId } = req.params;
    const { season_id } = req.query;
    
    if (!teamId) {
      res.status(400).json({ success: false, message: 'Team ID é obrigatório' });
      return;
    }
    
    const trades = await TradeService.getTradesByTeam(
      Number(teamId), 
      season_id ? Number(season_id) : undefined
    );
    
    res.status(200).json({ success: true, data: trades });
  });

  // GET /api/v1/trades/counts - Contar trades por status
  static getTradeCounts = asyncHandler(async (req: Request, res: Response) => {
    const { season_id } = req.query;
    
    const counts = await TradeService.getTradeCounts(
      season_id ? Number(season_id) : undefined
    );
    
    res.status(200).json({ success: true, data: counts });
  });

  // POST /api/v1/trades - Criar nova trade
  static createTrade = asyncHandler(async (req: Request, res: Response) => {
    const tradeData: CreateTradeRequest = req.body;
    const trade = await TradeService.createTrade(tradeData);

    res.status(201).json({ 
      success: true, 
      data: trade, 
      message: 'Trade criada com sucesso' 
    });
  });

  // PATCH /api/v1/trades/participants/:id - Responder à trade
  static updateParticipantResponse = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const responseData: UpdateTradeParticipantRequest = req.body;
    
    if (!id) {
      res.status(400).json({ success: false, message: 'ID do participante é obrigatório' });
      return;
    }
    
    const participant = await TradeService.updateParticipantResponse(
      Number(id), 
      responseData
    );
    
    const message = responseData.response_status === 'accepted' 
      ? 'Trade aceita com sucesso' 
      : 'Trade rejeitada com sucesso';
    
    res.status(200).json({ 
      success: true, 
      data: participant, 
      message 
    });
  });

  // POST /api/v1/trades/:id/execute - Executar trade (admin apenas)
  static executeTrade = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    
    if (!id) {
      res.status(400).json({ success: false, message: 'ID da trade é obrigatório' });
      return;
    }
    
    const user = (req as any).user;
    const trade = await TradeService.executeTrade(Number(id));
    
    res.status(200).json({ 
      success: true, 
      data: trade, 
      message: 'Trade executada com sucesso',
      executedBy: {
        id: user.id,
        email: user.email,
        role: user.role
      }
    });
  });

  // POST /api/v1/trades/:id/revert - Reverter trade (admin apenas)
  static revertTrade = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { reverted_by_user } = req.body;
    
    if (!id) {
      res.status(400).json({ success: false, message: 'ID da trade é obrigatório' });
      return;
    }
    
    if (!reverted_by_user) {
      res.status(400).json({ success: false, message: 'ID do usuário que reverteu é obrigatório' });
      return;
    }
    
    const trade = await TradeService.revertTrade(Number(id), Number(reverted_by_user));
    
    res.status(200).json({ 
      success: true, 
      data: trade, 
      message: 'Trade revertida com sucesso'
    });
  });

  // POST /api/v1/trades/reject-pending-after-deadline - Rejeitar trades pendentes após deadline
  static rejectPendingTradesAfterDeadline = asyncHandler(async (req: Request, res: Response) => {
    const result = await TradeService.rejectPendingTradesAfterDeadline();
    
    res.status(200).json({ 
      success: true, 
      data: result, 
      message: `${result.rejected} trades pendentes foram rejeitadas automaticamente após o deadline` 
    });
  });

  // GET /api/v1/trades/my-trades - Buscar trades do usuário autenticado
  static getMyTrades = asyncHandler(async (req: Request, res: Response) => {
    const user = (req as any).user;
    const { team_id } = req.query;
    if (!user) {
      res.status(401).json({ success: false, message: 'Usuário não autenticado' });
      return;
    }
    if (!team_id) {
      res.status(400).json({ success: false, message: 'team_id é obrigatório' });
      return;
    }
    const trades = await TradeService.getMyTrades(Number(team_id));
    res.status(200).json({ success: true, data: trades });
  });

  static countMyTrades = asyncHandler(async (req: Request, res: Response) => {
    const user = (req as any).user;
    const { team_id } = req.query;
    if (!user) {
      res.status(401).json({ success: false, message: 'Usuário não autenticado' });
      return;
    }
    if (!team_id) {
      res.status(400).json({ success: false, message: 'team_id é obrigatório' });
      return;
    }
    const count = await TradeService.countMyTrades(Number(team_id));
    res.status(200).json({ success: true, data: count });
  });

  // GET /api/v1/trades/team/:teamId/executed-count - Contar trades executadas de um time em um período
  static countExecutedTradesByTeam = asyncHandler(async (req: Request, res: Response) => {
    const { teamId } = req.params;
    const { season_start, season_end } = req.query;
    
    if (!teamId) {
      res.status(400).json({ success: false, message: 'Team ID é obrigatório' });
      return;
    }
    
    if (!season_start || !season_end) {
      res.status(400).json({ success: false, message: 'season_start e season_end são obrigatórios' });
      return;
    }
    
    const count = await TradeService.countExecutedTradesByTeam(
      Number(teamId), 
      Number(season_start), 
      Number(season_end)
    );
    
    res.status(200).json({ 
      success: true, 
      data: {
        team_id: Number(teamId),
        season_start: Number(season_start),
        season_end: Number(season_end),
        trades_used: count,
        trades_limit: 10
      }
    });
  });

  // GET /api/v1/trades/:id/trade-limits - Verificar limites de trades de todos os participantes
  static checkTradeLimits = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    
    if (!id) {
      res.status(400).json({ success: false, message: 'ID da trade é obrigatório' });
      return;
    }
    
    const tradeLimits = await TradeService.checkAllParticipantsTradeLimit(Number(id));
    
    res.status(200).json({ 
      success: true, 
      data: tradeLimits
    });
  });

  // CANCELAR trade (iniciador ou admin)
  static cancelTrade = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    if (!id) {
      res.status(400).json({ success: false, message: 'ID da trade é obrigatório' });
      return;
    }
    await TradeService.cancelTrade(Number(id));
    res.status(200).json({ success: true, message: 'Trade cancelada com sucesso' });
  });

  // PATCH /api/v1/trades/:id/made - Atualizar campo made de uma trade (admin apenas)
  static updateTradeMade = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { made } = req.body;
    
    if (!id) {
      res.status(400).json({ success: false, message: 'ID da trade é obrigatório' });
      return;
    }
    
    if (typeof made !== 'boolean') {
      res.status(400).json({ success: false, message: 'Campo made deve ser um booleano' });
      return;
    }
    
    const trade = await TradeService.updateTradeMade(Number(id), made);
    
    res.status(200).json({ 
      success: true, 
      data: trade, 
      message: `Trade ${made ? 'marcada' : 'desmarcada'} como feita com sucesso` 
    });
  });
} 