import { Request, Response } from 'express';
import { PickService } from '../services/pickService.js';
import { asyncHandler } from '../middlewares/errorHandler.js';
import pool from '../utils/postgresClient.js';

export class PickController {
  // GET /api/v1/picks - Listar todos os picks
  static getAllPicks = asyncHandler(async (req: Request, res: Response) => {
    const picks = await PickService.getAllPicks();
    return res.status(200).json({ success: true, data: picks });
  });

  // GET /api/v1/picks/:id - Buscar pick por ID
  static getPickById = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ success: false, message: 'ID é obrigatório' });
    }
    const pick = await PickService.getPickById(Number(id));
    return res.status(200).json({ success: true, data: pick });
  });

  // POST /api/v1/picks - Criar novo pick
  static createPick = asyncHandler(async (req: Request, res: Response) => {
    const pick = await PickService.createPick(req.body);
    return res.status(201).json({ success: true, data: pick, message: 'Pick criado com sucesso' });
  });

  // PUT /api/v1/picks/:id - Atualizar pick
  static updatePick = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ success: false, message: 'ID é obrigatório' });
    }
    const pick = await PickService.updatePick(Number(id), req.body);
    return res.status(200).json({ success: true, data: pick, message: 'Pick atualizado com sucesso' });
  });

  // DELETE /api/v1/picks/:id - Deletar pick
  static deletePick = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ success: false, message: 'ID é obrigatório' });
    }
    await PickService.deletePick(Number(id));
    return res.status(200).json({ success: true, message: 'Pick deletado com sucesso' });
  });

  // GET /api/v1/picks/team/:teamId/future - Picks futuras agrupadas
  static getTeamFuturePicks = asyncHandler(async (req: Request, res: Response) => {
    const { teamId } = req.params;
    console.log(`[DEBUG] Controller getTeamFuturePicks - teamId: ${teamId}`);
    
    if (!teamId) {
      return res.status(400).json({ success: false, message: 'ID do time é obrigatório' });
    }
    
    const result = await PickService.getTeamFuturePicks(Number(teamId));
    console.log(`[DEBUG] Controller getTeamFuturePicks - resultado:`, result);
    
    return res.status(200).json({ success: true, data: result });
  });
}
