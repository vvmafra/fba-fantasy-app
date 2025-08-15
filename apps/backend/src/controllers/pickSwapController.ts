import { Request, Response } from 'express';
import { PickSwapService } from '../services/pickSwapService.js';
import { asyncHandler } from '../middlewares/errorHandler.js';
import { createPickSwapSchema, pickSwapIdSchema, teamIdSchema } from '../validations/pickSwapValidation.js';

export class PickSwapController {
  // GET /api/v1/pick-swaps - Listar todos os pick swaps
  static getAllPickSwaps = asyncHandler(async (req: Request, res: Response) => {
    const swaps = await PickSwapService.getAllPickSwaps();
    return res.status(200).json({ success: true, data: swaps });
  });

  // GET /api/v1/pick-swaps/:id - Buscar pick swap por ID
  static getPickSwapById = asyncHandler(async (req: Request, res: Response) => {
    const { id } = pickSwapIdSchema.parse(req.params);
    const swap = await PickSwapService.getPickSwapById(id);
    if (!swap) {
      return res.status(404).json({ success: false, message: 'Pick swap não encontrado' });
    }
    return res.status(200).json({ success: true, data: swap });
  });

  // POST /api/v1/pick-swaps - Criar novo pick swap
  static createPickSwap = asyncHandler(async (req: Request, res: Response) => {
    const validatedData = createPickSwapSchema.parse(req.body);
    const swap = await PickSwapService.createPickSwap(validatedData);
    return res.status(201).json({ success: true, data: swap, message: 'Pick swap criado com sucesso' });
  });

  // DELETE /api/v1/pick-swaps/:id - Deletar pick swap
  static deletePickSwap = asyncHandler(async (req: Request, res: Response) => {
    const { id } = pickSwapIdSchema.parse(req.params);
    await PickSwapService.deletePickSwap(id);
    return res.status(200).json({ success: true, message: 'Pick swap deletado com sucesso' });
  });

  // GET /api/v1/pick-swaps/team/:teamId - Buscar swaps de um time
  static getTeamPickSwaps = asyncHandler(async (req: Request, res: Response) => {
    const { teamId } = teamIdSchema.parse(req.params);
    const swaps = await PickSwapService.getTeamPickSwaps(teamId);
    return res.status(200).json({ success: true, data: swaps });
  });
} 