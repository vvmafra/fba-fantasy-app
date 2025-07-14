import { Router } from 'express';
import { SeasonController } from '@/controllers/seasonController.js';

const router = Router();

router.get('/', SeasonController.getAllSeasons);
router.get('/active', SeasonController.getActiveSeason);
router.get('/active/seasons', SeasonController.getSeasonsFromActive);
router.get('/:id', SeasonController.getSeasonById);
router.post('/', SeasonController.createSeason);
router.put('/:id', SeasonController.updateSeason);
router.delete('/:id', SeasonController.deleteSeason);

export default router; 