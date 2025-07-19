import { Router } from 'express';
import { PlayoffImageController } from '../controllers/playoffImageController.js';
import { authenticateToken, authenticateAndRequireAdmin } from '../middlewares/auth.js';

const router = Router();

// Rotas públicas (para visualização)
router.get('/', PlayoffImageController.getAllPlayoffImages);
router.get('/season/:seasonId', PlayoffImageController.getPlayoffImageBySeason);
router.get('/:id', PlayoffImageController.getPlayoffImageById);

// Rotas protegidas (apenas admins)
router.post('/', authenticateAndRequireAdmin, PlayoffImageController.createPlayoffImage);
router.put('/:id', authenticateAndRequireAdmin, PlayoffImageController.updatePlayoffImage);
router.delete('/:id', authenticateAndRequireAdmin, PlayoffImageController.deletePlayoffImage);
router.delete('/cleanup/invalid', authenticateAndRequireAdmin, PlayoffImageController.cleanupInvalidImages);

export default router; 