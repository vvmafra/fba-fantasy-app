import { Router } from 'express';
import { EditionRankingController } from '../controllers/editionRankingController.js';

const router = Router();

// Rotas públicas (para visualização)
router.get('/', EditionRankingController.getEditionRanking);
router.get('/season/:seasonId', EditionRankingController.getEditionRankingBySeason);
router.get('/team/:teamId', EditionRankingController.getTeamEditionRanking);

export default router; 