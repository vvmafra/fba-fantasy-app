import { Router } from 'express';
import { TeamStandingController } from '../controllers/teamStandingController.js';
import { authenticateToken } from '../middlewares/auth.js';

const router = Router();

// Rotas públicas (para visualização)
router.get('/', TeamStandingController.getAllStandings);
router.get('/season/:seasonId', TeamStandingController.getStandingsBySeason);
router.get('/team/:teamId', TeamStandingController.getStandingsByTeam);
router.get('/:id', TeamStandingController.getStandingById);
router.get('/season/:seasonId/champions', TeamStandingController.getChampionsBySeason);
router.get('/season/:seasonId/playoffs', TeamStandingController.getPlayoffTeamsBySeason);

// Rotas protegidas (requerem autenticação)
router.use(authenticateToken);

router.post('/', TeamStandingController.createStanding);
router.post('/bulk', TeamStandingController.upsertManyStandings);
router.put('/:id', TeamStandingController.updateStanding);
router.delete('/:id', TeamStandingController.deleteStanding);

export default router; 