import { Request, Response } from 'express';
import { LeagueCapService } from '../services/leagueCapService.js';
import { asyncHandler } from '../middlewares/errorHandler.js';
import { CreateLeagueCapRequest, UpdateLeagueCapRequest } from '../types/index.js';

export class LeagueCapController {
  // GET /api/v1/league-cap - Listar todos os league caps
  static getAllLeagueCaps = asyncHandler(async (req: Request, res: Response) => {
    const leagueCaps = await LeagueCapService.getAllLeagueCaps();
    return res.status(200).json({ success: true, data: leagueCaps });
  });

  // GET /api/v1/league-cap/active - Buscar league cap ativo
  static getActiveLeagueCap = asyncHandler(async (req: Request, res: Response) => {
    const leagueCap = await LeagueCapService.getActiveLeagueCap();
    if (!leagueCap) {
      return res.status(404).json({ success: false, message: 'Nenhum league cap ativo encontrado' });
    }
    return res.status(200).json({ success: true, data: leagueCap });
  });

  // GET /api/v1/league-cap/current-average - Buscar CAP médio atual da liga
  static getCurrentLeagueAverageCap = asyncHandler(async (req: Request, res: Response) => {
    const averageCap = await LeagueCapService.getCurrentLeagueAverageCap();
    return res.status(200).json({ success: true, data: { average_cap: averageCap } });
  });

  // GET /api/v1/league-cap/:id - Buscar league cap por ID
  static getLeagueCapById = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ success: false, message: 'ID é obrigatório' });
    }
    const leagueCap = await LeagueCapService.getLeagueCapById(Number(id));
    if (!leagueCap) {
      return res.status(404).json({ success: false, message: 'League cap não encontrado' });
    }
    return res.status(200).json({ success: true, data: leagueCap });
  });

  // POST /api/v1/league-cap - Criar novo league cap
  static createLeagueCap = asyncHandler(async (req: Request, res: Response) => {
    const leagueCapData: CreateLeagueCapRequest = req.body;
    
    // Validação manual: max_cap deve ser maior ou igual ao min_cap
    if (leagueCapData.max_cap < leagueCapData.min_cap) {
      return res.status(400).json({ 
        success: false, 
        message: 'CAP máximo deve ser maior ou igual ao CAP mínimo' 
      });
    }
    
    const leagueCap = await LeagueCapService.createLeagueCap(leagueCapData);
    return res.status(201).json({ success: true, data: leagueCap, message: 'League cap criado com sucesso' });
  });

  // PUT /api/v1/league-cap/:id - Atualizar league cap
  static updateLeagueCap = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ success: false, message: 'ID é obrigatório' });
    }
    const leagueCapData: UpdateLeagueCapRequest = req.body;
    
    // Validação manual: se ambos os valores estão presentes, max_cap deve ser maior ou igual ao min_cap
    if (leagueCapData.min_cap !== undefined && leagueCapData.max_cap !== undefined) {
      if (leagueCapData.max_cap < leagueCapData.min_cap) {
        return res.status(400).json({ 
          success: false, 
          message: 'CAP máximo deve ser maior ou igual ao CAP mínimo' 
        });
      }
    }
    
    const leagueCap = await LeagueCapService.updateLeagueCap(Number(id), leagueCapData);
    return res.status(200).json({ success: true, data: leagueCap, message: 'League cap atualizado com sucesso' });
  });

  // DELETE /api/v1/league-cap/:id - Deletar league cap
  static deleteLeagueCap = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ success: false, message: 'ID é obrigatório' });
    }
    await LeagueCapService.deleteLeagueCap(Number(id));
    return res.status(200).json({ success: true, message: 'League cap deletado com sucesso' });
  });
} 