import { Router } from 'express';
import { SeasonController } from '../controllers/seasonController.js';
import { authenticateAndRequireAdmin } from '../middlewares/auth.js';
import { validate, validateWithParams } from '../middlewares/validation.js';
import { 
  createSeasonSchema, 
  updateSeasonSchema, 
  seasonIdSchema
} from '../validations/seasonValidation.js';

const router = Router();

router.get('/', SeasonController.getAllSeasons);
router.get('/active', SeasonController.getActiveSeason);
router.get('/active/seasons', SeasonController.getSeasonsFromActive);
router.get('/:id', SeasonController.getSeasonById);
router.post('/', authenticateAndRequireAdmin, validate(createSeasonSchema), SeasonController.createSeason);
router.put('/:id', authenticateAndRequireAdmin, validateWithParams(seasonIdSchema, updateSeasonSchema), SeasonController.updateSeason);
router.delete('/:id', authenticateAndRequireAdmin, SeasonController.deleteSeason);

// Novas rotas para funcionalidades da página de temporadas (rotas específicas devem vir antes das rotas com parâmetros)
router.post('/advance-next', authenticateAndRequireAdmin, SeasonController.advanceToNextSeason);
router.post('/go-back', authenticateAndRequireAdmin, SeasonController.goBackToPreviousSeason);
router.post('/:id/activate', authenticateAndRequireAdmin, validate(seasonIdSchema), SeasonController.changeActiveSeason);

export default router; 