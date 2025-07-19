import { Request, Response } from 'express';
import asyncHandler from 'express-async-handler';
import { EditionRankingService } from '../services/editionRankingService.js';

export class EditionRankingController {
  // GET /api/v1/edition-ranking - Buscar ranking de edição geral
  static getEditionRanking = asyncHandler(async (req: Request, res: Response) => {
    const ranking = await EditionRankingService.getEditionRanking();
    res.status(200).json({ success: true, data: ranking });
  });

  // GET /api/v1/edition-ranking/season/:seasonId - Buscar ranking de edição por temporada
  static getEditionRankingBySeason = asyncHandler(async (req: Request, res: Response) => {
    const { seasonId } = req.params;
    if (!seasonId) {
      res.status(400).json({ success: false, message: 'ID da temporada é obrigatório' });
      return;
    }
    const ranking = await EditionRankingService.getEditionRankingBySeason(Number(seasonId));
    res.status(200).json({ success: true, data: ranking });
  });

  // GET /api/v1/edition-ranking/team/:teamId - Buscar ranking de um time específico
  static getTeamEditionRanking = asyncHandler(async (req: Request, res: Response) => {
    const { teamId } = req.params;
    if (!teamId) {
      res.status(400).json({ success: false, message: 'ID do time é obrigatório' });
      return;
    }
    const ranking = await EditionRankingService.getTeamEditionRanking(Number(teamId));
    if (!ranking) {
      res.status(404).json({ success: false, message: 'Time não encontrado' });
      return;
    }
    res.status(200).json({ success: true, data: ranking });
  });
} 