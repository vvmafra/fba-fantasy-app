import { Router } from 'express';
import { RosterController } from '@/controllers/RosterController';
import { validate, validateWithParams } from '@/middlewares/validation';
import { authenticateAndRequireAdmin } from '@/middlewares/auth';
import { 
  createRosterSeasonSchema, 
  updateRosterSeasonSchema, 
  rosterQuerySchema,
  rosterIdSchema
} from '@/validations/rosterValidation';

const router = Router();

// Rotas GET
router.get('/test', RosterController.testConnection);
router.get('/', validate(rosterQuerySchema), RosterController.getAllRosters);
router.get('/active', RosterController.getActiveSeasonRoster);
router.get('/season/:season_id', RosterController.getRosterBySeason);
router.get('/:id', RosterController.getRosterById);

// Rotas POST (apenas admin)
router.post('/', authenticateAndRequireAdmin, validate(createRosterSeasonSchema), RosterController.createRoster);

// Rotas PUT (apenas admin)
router.put('/:id', authenticateAndRequireAdmin, validateWithParams(rosterIdSchema, updateRosterSeasonSchema), RosterController.updateRoster);

// Rotas DELETE (apenas admin)
router.delete('/:id', authenticateAndRequireAdmin, RosterController.deleteRoster);

export default router;
