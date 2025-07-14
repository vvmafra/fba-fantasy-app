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
    const revertData: RevertTradeRequest = req.body;
    
    if (!id) {
      res.status(400).json({ success: false, message: 'ID da trade é obrigatório' });
      return;
    }
    
    const user = (req as any).user;
    const trade = await TradeService.revertTrade(Number(id), revertData.reverted_by_user);
    
    res.status(200).json({ 
      success: true, 
      data: trade, 
      message: 'Trade revertida com sucesso',
      revertedBy: {
        id: user.id,
        email: user.email,
        role: user.role
      }
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
} 