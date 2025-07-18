import { Request, Response } from 'express';
import { SeasonAwardsService } from '../services/seasonAwardsService.js';
import { asyncHandler } from '../middlewares/errorHandler.js';

export class SeasonAwardsController {
  // GET /api/v1/season-awards - Listar todas as premiações
  static getAllSeasonAwards = asyncHandler(async (req: Request, res: Response) => {
    const awards = await SeasonAwardsService.getAllSeasonAwards();
    return res.status(200).json({ success: true, data: awards });
  });

  // GET /api/v1/season-awards/season/:seasonId - Buscar premiação por temporada
  static getSeasonAwardsBySeason = asyncHandler(async (req: Request, res: Response) => {
    const { seasonId } = req.params;
    if (!seasonId) {
      return res.status(400).json({ success: false, message: 'ID da temporada é obrigatório' });
    }
    
    const awards = await SeasonAwardsService.getOrCreateSeasonAwards(Number(seasonId));
    return res.status(200).json({ success: true, data: awards });
  });

  // GET /api/v1/season-awards/:id - Buscar premiação por ID
  static getSeasonAwardsById = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ success: false, message: 'ID é obrigatório' });
    }
    
    const awards = await SeasonAwardsService.getSeasonAwardsById(Number(id));
    if (!awards) {
      return res.status(404).json({ success: false, message: 'Premiação não encontrada' });
    }
    
    return res.status(200).json({ success: true, data: awards });
  });

  // POST /api/v1/season-awards - Criar nova premiação
  static createSeasonAwards = asyncHandler(async (req: Request, res: Response) => {
    const awards = await SeasonAwardsService.createSeasonAwards(req.body);
    return res.status(201).json({ 
      success: true, 
      data: awards, 
      message: 'Premiação criada com sucesso' 
    });
  });

  // PUT /api/v1/season-awards/:id - Atualizar premiação
  static updateSeasonAwards = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ success: false, message: 'ID é obrigatório' });
    }
    
    const awards = await SeasonAwardsService.updateSeasonAwards(Number(id), req.body);
    return res.status(200).json({ 
      success: true, 
      data: awards, 
      message: 'Premiação atualizada com sucesso' 
    });
  });

  // DELETE /api/v1/season-awards/:id - Deletar premiação
  static deleteSeasonAwards = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ success: false, message: 'ID é obrigatório' });
    }
    
    await SeasonAwardsService.deleteSeasonAwards(Number(id));
    return res.status(200).json({ 
      success: true, 
      message: 'Premiação deletada com sucesso' 
    });
  });
} 