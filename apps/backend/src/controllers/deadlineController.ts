import { Request, Response } from 'express';
import { DeadlineService } from '../services/deadlineService.js';
import { asyncHandler } from '@/middlewares/errorHandler.js';

export class DeadlineController {
  // GET /api/v1/deadlines - Listar todos os deadlines
  static getAllDeadlines = asyncHandler(async (req: Request, res: Response) => {
    const deadlines = await DeadlineService.getAllDeadlines();
    return res.status(200).json({ success: true, data: deadlines });
  });

  // GET /api/v1/deadlines/season/:seasonId - Buscar deadlines por temporada
  static getDeadlinesBySeason = asyncHandler(async (req: Request, res: Response) => {
    const { seasonId } = req.params;
    if (!seasonId) {
      return res.status(400).json({ success: false, message: 'ID da temporada é obrigatório' });
    }
    const deadlines = await DeadlineService.getDeadlinesBySeason(Number(seasonId));
    return res.status(200).json({ success: true, data: deadlines });
  });

  // GET /api/v1/deadlines/upcoming - Buscar próximos deadlines da temporada ativa
  static getUpcomingDeadlines = asyncHandler(async (req: Request, res: Response) => {
    const deadlines = await DeadlineService.getUpcomingDeadlines();
    return res.status(200).json({ success: true, data: deadlines });
  });

  // GET /api/v1/deadlines/:id - Buscar deadline por ID
  static getDeadlineById = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ success: false, message: 'ID é obrigatório' });
    }
    const deadline = await DeadlineService.getDeadlineById(Number(id));
    if (!deadline) {
      return res.status(404).json({ success: false, message: 'Deadline não encontrado' });
    }
    return res.status(200).json({ success: true, data: deadline });
  });

  // POST /api/v1/deadlines - Criar novo deadline
  static createDeadline = asyncHandler(async (req: Request, res: Response) => {
    const deadline = await DeadlineService.createDeadline(req.body);
    return res.status(201).json({ success: true, data: deadline, message: 'Deadline criado com sucesso' });
  });

  // PUT /api/v1/deadlines/:id - Atualizar deadline
  static updateDeadline = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ success: false, message: 'ID é obrigatório' });
    }
    const deadline = await DeadlineService.updateDeadline(Number(id), req.body);
    return res.status(200).json({ success: true, data: deadline, message: 'Deadline atualizado com sucesso' });
  });

  // DELETE /api/v1/deadlines/:id - Deletar deadline
  static deleteDeadline = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ success: false, message: 'ID é obrigatório' });
    }
    await DeadlineService.deleteDeadline(Number(id));
    return res.status(200).json({ success: true, message: 'Deadline deletado com sucesso' });
  });

  // GET /api/v1/deadlines/type/:type/season/:seasonId - Buscar deadline por tipo e temporada
  static getDeadlineByTypeAndSeason = asyncHandler(async (req: Request, res: Response) => {
    const { type, seasonId } = req.params;
    if (!type || !seasonId) {
      return res.status(400).json({ success: false, message: 'Tipo e ID da temporada são obrigatórios' });
    }
    const deadline = await DeadlineService.getDeadlineByTypeAndSeason(type, Number(seasonId));
    return res.status(200).json({ success: true, data: deadline });
  });
} 