import { Router } from 'express';
import { PickSwapController } from '../controllers/pickSwapController.js';

const router = Router();

// Rotas públicas (se necessário)
router.get('/', PickSwapController.getAllPickSwaps);
router.get('/:id', PickSwapController.getPickSwapById);

// Rotas protegidas

router.post('/', PickSwapController.createPickSwap);
router.delete('/:id', PickSwapController.deletePickSwap);
router.get('/team/:teamId', PickSwapController.getTeamPickSwaps);

export default router; 