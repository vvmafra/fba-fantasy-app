import { Router } from 'express';
import { PickController } from '../controllers/pickController.js';

const router = Router();

router.get('/', PickController.getAllPicks);
router.get('/:id', PickController.getPickById);
router.post('/', PickController.createPick);
router.put('/:id', PickController.updatePick);
router.delete('/:id', PickController.deletePick);
router.get('/team/:teamId/future', PickController.getTeamFuturePicks);

export default router;
