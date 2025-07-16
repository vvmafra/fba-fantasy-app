import { Request, Response } from 'express';
import { SeasonService } from '../services/seasonService.js';
import { asyncHandler } from '../middlewares/errorHandler.js';
import pool from '../utils/postgresClient.js';

export class SeasonController {
  // GET /api/v1/seasons - Listar todas as seasons
  static getAllSeasons = asyncHandler(async (req: Request, res: Response) => {
    const seasons = await SeasonService.getAllSeasons();
    return res.status(200).json({ success: true, data: seasons });
  });

  // GET /api/v1/seasons/active - Listar todas as seasons a partir da ativa
  static getSeasonsFromActive = asyncHandler(async (req: Request, res: Response) => {
    const seasons = await SeasonService.getSeasonsFromActive();
    return res.status(200).json({ success: true, data: seasons });
  });

  // GET /api/v1/seasons/:id - Buscar season por ID
  static getSeasonById = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ success: false, message: 'ID é obrigatório' });
    }
    const season = await SeasonService.getSeasonById(Number(id));
    return res.status(200).json({ success: true, data: season });
  });

  // POST /api/v1/seasons - Criar nova season
  static createSeason = asyncHandler(async (req: Request, res: Response) => {
    const season = await SeasonService.createSeason(req.body);
    return res.status(201).json({ success: true, data: season, message: 'Season criada com sucesso' });
  });

  // PUT /api/v1/seasons/:id - Atualizar season
  static updateSeason = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ success: false, message: 'ID é obrigatório' });
    }
    const season = await SeasonService.updateSeason(Number(id), req.body);
    return res.status(200).json({ success: true, data: season, message: 'Season atualizada com sucesso' });
  });

  // DELETE /api/v1/seasons/:id - Deletar season
  static deleteSeason = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ success: false, message: 'ID é obrigatório' });
    }
    await SeasonService.deleteSeason(Number(id));
    return res.status(200).json({ success: true, message: 'Season deletada com sucesso' });
  });

  // GET /api/v1/seasons/active - Buscar temporada ativa
  static getActiveSeason = asyncHandler(async (req: Request, res: Response) => {
    const season = await SeasonService.getActiveSeason();
    if (!season) {
      return res.status(404).json({ success: false, message: 'Nenhuma temporada ativa encontrada' });
    }
    return res.status(200).json({ success: true, data: season });
  });

  // POST /api/v1/seasons/advance-next - Avançar para próxima temporada
  static advanceToNextSeason = asyncHandler(async (req: Request, res: Response) => {
    const season = await SeasonService.advanceToNextSeason();

    // TO BE IMPLEMENTED
    // Adicionar picks subsequentes de todos os times
    // se for para temporada impar, resetar número de trades de cada time
    // Alterar as deadlines (datas)
    // Ajuste de CAP (vai ser manual atualmente)
    return res.status(200).json({ success: true, data: season, message: 'Avançou para próxima temporada com sucesso' });
  });

  // POST /api/v1/seasons/go-back - Voltar para temporada anterior
  static goBackToPreviousSeason = asyncHandler(async (req: Request, res: Response) => {
    const season = await SeasonService.goBackToPreviousSeason();
    return res.status(200).json({ success: true, data: season, message: 'Voltou para temporada anterior com sucesso' });
  });

  // POST /api/v1/seasons/:id/activate - Alterar temporada ativa
  static changeActiveSeason = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ success: false, message: 'ID é obrigatório' });
    }
    const season = await SeasonService.changeActiveSeason(Number(id));
    return res.status(200).json({ success: true, data: season, message: 'Temporada ativa alterada com sucesso' });
  });
} 