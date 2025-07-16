import { Router } from 'express';
import { RosterController } from '../controllers/rosterController.js';
import { validate, validateWithParams } from '../middlewares/validation.js';
import { 
  authenticateAndRequireAdmin, 
  authenticateAndRequireRosterPermission,
  authenticateAndRequireRosterOwnership
} from '../middlewares/auth.js';
import { 
  createRosterSeasonSchema, 
  updateRosterSeasonSchema, 
  rosterQuerySchema,
  rosterIdSchema
} from '../validations/rosterValidation.js';

const router = Router();

// Rotas GET
router.get('/test', RosterController.testConnection);
router.get('/', validate(rosterQuerySchema), RosterController.getAllRosters);
router.get('/active', RosterController.getActiveSeasonRoster);
router.get('/with-details', RosterController.getAllRostersWithDetails);
router.get('/season/:season_id', RosterController.getRosterBySeason);
router.get('/:id', RosterController.getRosterById);

// Rotas POST (admin ou dono do time)
router.post('/', authenticateAndRequireRosterPermission, validate(createRosterSeasonSchema), RosterController.createRoster);

// Rotas PUT (admin ou dono do time)
router.put('/:id', authenticateAndRequireRosterOwnership, validateWithParams(rosterIdSchema, updateRosterSeasonSchema), RosterController.updateRoster);

// Rotas DELETE (apenas admin)
router.delete('/:id', authenticateAndRequireAdmin, RosterController.deleteRoster);

export default router;
