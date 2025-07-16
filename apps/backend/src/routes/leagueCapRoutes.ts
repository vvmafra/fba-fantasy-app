import { Router } from 'express';
import { LeagueCapController } from '../controllers/leagueCapController.js';
import { authenticateAndRequireAdmin } from '../middlewares/auth.js';
import { validate, validateWithParams } from '../middlewares/validation.js';
import { 
  createLeagueCapSchema, 
  updateLeagueCapSchema, 
  leagueCapIdSchema
} from '../validations/leagueCapValidation.js';

const router = Router();

// Rotas GET (públicas para consulta)
router.get('/', LeagueCapController.getAllLeagueCaps);
router.get('/active', LeagueCapController.getActiveLeagueCap);
router.get('/current-average', LeagueCapController.getCurrentLeagueAverageCap);
router.get('/:id', LeagueCapController.getLeagueCapById);

// Rotas POST/PUT/DELETE (apenas admin)
router.post('/', authenticateAndRequireAdmin, validate(createLeagueCapSchema), LeagueCapController.createLeagueCap);
router.put('/:id', authenticateAndRequireAdmin, validateWithParams(leagueCapIdSchema, updateLeagueCapSchema), LeagueCapController.updateLeagueCap);
router.delete('/:id', authenticateAndRequireAdmin, LeagueCapController.deleteLeagueCap);

export default router; 