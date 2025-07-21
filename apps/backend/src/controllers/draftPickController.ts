import { Request, Response } from 'express';
import { DraftPickService } from '../services/draftPickService.js';
import { asyncHandler } from '../middlewares/errorHandler.js';

export class DraftPickController {
  // GET /api/v1/draft-picks - Listar todos os draft picks
  static getAllDraftPicks = asyncHandler(async (req: Request, res: Response) => {
    const params: any = {
      page: req.query['page'] ? parseInt(req.query['page'] as string) : 1,
      limit: req.query['limit'] ? parseInt(req.query['limit'] as string) : 100,
      sortBy: req.query['sortBy'] as string || 'pick_number',
      sortOrder: req.query['sortOrder'] as 'asc' | 'desc' || 'asc',
      season_id: req.query['season_id'] ? parseInt(req.query['season_id'] as string) : undefined,
      team_id: req.query['team_id'] ? parseInt(req.query['team_id'] as string) : undefined,
      is_added_to_2k: req.query['is_added_to_2k'] !== undefined ? req.query['is_added_to_2k'] === 'true' : undefined
    };

    const result = await DraftPickService.getAllDraftPicks(params);
    return res.status(200).json(result);
  });

  // GET /api/v1/draft-picks/:id - Buscar draft pick por ID
  static getDraftPickById = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ success: false, message: 'ID é obrigatório' });
    }
    const draftPick = await DraftPickService.getDraftPickById(Number(id));
    return res.status(200).json({ success: true, data: draftPick });
  });

  // POST /api/v1/draft-picks - Criar novo draft pick
  static createDraftPick = asyncHandler(async (req: Request, res: Response) => {
    const draftPick = await DraftPickService.createDraftPick(req.body);
    return res.status(201).json({ success: true, data: draftPick, message: 'Draft pick criado com sucesso' });
  });

  // PUT /api/v1/draft-picks/:id - Atualizar draft pick
  static updateDraftPick = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ success: false, message: 'ID é obrigatório' });
    }
    const draftPick = await DraftPickService.updateDraftPick(Number(id), req.body);
    return res.status(200).json({ success: true, data: draftPick, message: 'Draft pick atualizado com sucesso' });
  });

  // DELETE /api/v1/draft-picks/:id - Deletar draft pick
  static deleteDraftPick = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ success: false, message: 'ID é obrigatório' });
    }
    await DraftPickService.deleteDraftPick(Number(id));
    return res.status(200).json({ success: true, message: 'Draft pick deletado com sucesso' });
  });



  // POST /api/v1/draft-picks/:id/toggle-2k - Alternar status is_added_to_2k
  static toggleAddedTo2k = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ success: false, message: 'ID é obrigatório' });
    }
    const draftPick = await DraftPickService.toggleAddedTo2k(Number(id));
    return res.status(200).json({ success: true, data: draftPick, message: 'Status do 2K atualizado com sucesso' });
  });

  // POST /api/v1/draft-picks/:id/add-player - Adicionar jogador ao draft pick
  static addPlayerToDraftPick = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ success: false, message: 'ID é obrigatório' });
    }
    const draftPick = await DraftPickService.addPlayerToDraftPick(Number(id), req.body);
    return res.status(200).json({ success: true, data: draftPick, message: 'Jogador adicionado com sucesso' });
  });

  // POST /api/v1/draft-picks/:id/create-player - Criar jogador e adicionar ao draft pick
  static createPlayerAndAddToDraftPick = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ success: false, message: 'ID é obrigatório' });
    }
    const draftPick = await DraftPickService.createPlayerAndAddToDraftPick(Number(id), req.body);
    return res.status(200).json({ success: true, data: draftPick, message: 'Jogador criado e adicionado com sucesso' });
  });

  // GET /api/v1/draft-picks/season/:seasonId - Buscar draft picks por temporada
  static getDraftPicksBySeason = asyncHandler(async (req: Request, res: Response) => {
    const { seasonId } = req.params;
    if (!seasonId) {
      return res.status(400).json({ success: false, message: 'Season ID é obrigatório' });
    }
    const draftPicks = await DraftPickService.getDraftPicksBySeason(Number(seasonId));
    return res.status(200).json({ success: true, data: draftPicks });
  });

  // GET /api/v1/draft-picks/next-pick/:seasonId - Buscar próximo número de pick
  static getNextPickNumber = asyncHandler(async (req: Request, res: Response) => {
    const { seasonId } = req.params;
    if (!seasonId) {
      return res.status(400).json({ success: false, message: 'Season ID é obrigatório' });
    }
    const nextPickNumber = await DraftPickService.getNextPickNumber(Number(seasonId));
    return res.status(200).json({ success: true, data: { next_pick_number: nextPickNumber } });
  });


} 