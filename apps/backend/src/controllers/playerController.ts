import { Request, Response } from 'express';
import { PlayerService } from '../services/playerService.js';
import { asyncHandler } from '../middlewares/errorHandler.js';
import { PlayerQueryParams, BatchUpdateRequest, TransferPlayerRequest, OCRRequest } from '../types';
import pool from '../utils/postgresClient.js';

export class PlayerController {
  // GET /api/v1/players/test - Teste de conexão
  static testConnection = asyncHandler(async (req: Request, res: Response) => {
    try {
      
      if (!pool) {
        return res.status(500).json({
          success: false,
          message: 'Cliente PostgreSQL não inicializado',
          env: {
            hasDatabaseUrl: !!process.env['DATABASE_URL']
          }
        });
      }
      
      const { rows } = await pool.query('SELECT COUNT(*) FROM players');
      
      return res.status(200).json({
        success: true,
        message: 'Conexão com PostgreSQL OK',
        data: { playerCount: parseInt(rows[0].count) }
      });
    } catch (error) {
      console.error('💥 Erro no teste:', error);
      return res.status(500).json({
        success: false,
        message: 'Erro interno',
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      });
    }
  });

  // GET /api/v1/players - Listar todos os players com filtros
  static getAllPlayers = asyncHandler(async (req: Request, res: Response) => {
    const params: PlayerQueryParams = {
      page: Number(req.query['page']) || 1,
      limit: Number(req.query['limit']) || 10,
      sortBy: req.query['sortBy'] as string || 'created_at',
      sortOrder: (req.query['sortOrder'] as 'asc' | 'desc') || 'desc',
      name: req.query['name'] as string,
      position: req.query['position'] as string,
      isFreeAgent: req.query['isFreeAgent'] === 'true'
    };

    // Adicionar team apenas se fornecido
    if (req.query['team']) {
      params.team = Number(req.query['team']);
    }

    const result = await PlayerService.getAllPlayers(params);
    
    return res.status(200).json(result);
  });

  // GET /api/v1/players/:id - Buscar player por ID
  static getPlayerById = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ success: false, message: 'ID é obrigatório' });
    }
    const player = await PlayerService.getPlayerById(Number(id));
    
    return res.status(200).json({
      success: true,
      data: player
    });
  });

  // GET /api/v1/players/team/:team_id - Listar players por time
  static getPlayersByTeam = asyncHandler(async (req: Request, res: Response) => {
    const { team_id } = req.params;

    if (!team_id) {
      return res.status(400).json({ success: false, message: 'ID do time é obrigatório' });
    }
    
    try {
      const players = await PlayerService.getPlayersByTeam(Number(team_id));
      
      return res.status(200).json({
        success: true,
        data: players
      });
    } catch (error) {
      console.error('💥 Erro no controller:', error);
      return res.status(500).json({
        success: false,
        message: 'Erro interno do servidor',
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      });
    }
  });

  // GET /api/v1/players/free-agents - Listar Free Agents
  // static getFreeAgents = asyncHandler(async (req: Request, res: Response) => {
  //   const players = await PlayerService.getFreeAgents();
    
  //   res.status(200).json({
  //     success: true,
  //     data: players
  //   });
  // });

  // POST /api/v1/players - Criar novo player manualmente
  static createPlayer = asyncHandler(async (req: Request, res: Response) => {

    const adminUser = (req as any).user; // Admin que fez a requisição
    const player = await PlayerService.createPlayer(req.body);
    
    res.status(201).json({
      success: true,
      data: player,
      message: 'Player criado com sucesso',
      admin: {
        id: adminUser.id,
        email: adminUser.email
      }
    });
  });

  // POST /api/v1/players/ocr - Criar players via OCR (apenas admin)
  static createPlayerOCR = asyncHandler(async (req: Request, res: Response) => {
    const ocrData: OCRRequest = req.body;
    const adminUser = (req as any).user; // Admin que fez a requisição
    
    // Processar OCR
    const ocrResult = await PlayerService.processOCR(ocrData);
    
    // Criar players no banco
    const createdPlayers = await PlayerService.createMultiplePlayers(ocrResult.players);
    
    return res.status(201).json({
      success: true,
      data: createdPlayers,
      message: `${createdPlayers.length} players criados via OCR com confiança de ${(ocrResult.confidence * 100).toFixed(1)}%`,
      admin: {
        id: adminUser.id,
        email: adminUser.email
      }
    });
  });

  // PUT /api/v1/players/:id - Atualizar player
  static updatePlayer = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    if (!id) {
      res.status(400).json({ success: false, message: 'ID é obrigatório' });
    }
    const player = await PlayerService.updatePlayer(Number(id), req.body);
    
    res.status(200).json({
      success: true,
      data: player,
      message: 'Player atualizado com sucesso'
    });
  });

  // PUT /api/v1/players/batch - Atualizar múltiplos players
  // static batchUpdatePlayers = asyncHandler(async (req: Request, res: Response) => {
  //   const batchData: BatchUpdateRequest = req.body;
    
  //   if (!batchData.players || batchData.players.length === 0) {
  //     return res.status(400).json({ success: false, message: 'Dados de atualização em lote são obrigatórios' });
  //   }
    
  //   const updatedPlayers = await PlayerService.batchUpdatePlayers(batchData);
    
  //   res.status(200).json({
  //     success: true,
  //     data: updatedPlayers,
  //     message: `${updatedPlayers.length} players atualizados com sucesso`
  //   });
  // });

  // PATCH /api/v1/players/:id/transfer - Transferir player
  // static transferPlayer = asyncHandler(async (req: Request, res: Response) => {
  //   const { id } = req.params;
  //   if (!id) {
  //     return res.status(400).json({ success: false, message: 'ID é obrigatório' });
  //   }
    
  //   const transferData: TransferPlayerRequest = req.body;
  //   if (!transferData.newTeam) {
  //     return res.status(400).json({ success: false, message: 'Novo time é obrigatório' });
  //   }
    
  //   const player = await PlayerService.transferPlayer(id, transferData);
    
  //   res.status(200).json({
  //     success: true,
  //     data: player,
  //     message: `Player transferido para ${transferData.newTeam} com sucesso`
  //   });
  // });

  // PATCH /api/v1/players/:id/release - Liberar player (Free Agent)
  static releasePlayer = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    if (!id) {
      res.status(400).json({ success: false, message: 'ID é obrigatório' });
    }
    
    const player = await PlayerService.releasePlayer(Number(id));
    
    res.status(200).json({
      success: true,
      data: player,
      message: 'Player liberado e movido para Free Agents com sucesso'
    });
  });

  // DELETE /api/v1/players/:id - Deletar player
  static deletePlayer = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    if (!id) {
      res.status(400).json({ success: false, message: 'ID é obrigatório' });
    }
    await PlayerService.deletePlayer(Number(id));
    
    res.status(200).json({
      success: true,
      message: 'Player deletado com sucesso'
    });
  });

//   // GET /api/v1/players/position/:position - Buscar players por posição
//   static getPlayersByPosition = asyncHandler(async (req: Request, res: Response) => {
//     const { position } = req.params;
//     if (!position) {
//       return res.status(400).json({ success: false, message: 'Posição é obrigatória' });
//     }
//     const players = await PlayerService.getPlayersByPosition(position);
    
//     res.status(200).json({
//       success: true,
//       data: players
//     });
//   });
// } 
} 