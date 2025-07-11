import { Router } from 'express';
import { DeadlineController } from '@/controllers/deadlineController';

const router = Router();

// Rotas públicas
router.get('/', DeadlineController.getAllDeadlines);
router.get('/upcoming', DeadlineController.getUpcomingDeadlines);
router.get('/season/:seasonId', DeadlineController.getDeadlinesBySeason);
router.get('/type/:type/season/:seasonId', DeadlineController.getDeadlineByTypeAndSeason);
router.get('/:id', DeadlineController.getDeadlineById);

// Rotas protegidas (apenas admin)
router.post('/', DeadlineController.createDeadline);
router.put('/:id', DeadlineController.updateDeadline);
router.delete('/:id', DeadlineController.deleteDeadline);

export default router; 