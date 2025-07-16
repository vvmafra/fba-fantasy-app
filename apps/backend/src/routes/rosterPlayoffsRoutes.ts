import { Router } from 'express';
import { RosterPlayoffsController } from '../controllers/rosterPlayoffsController.js';
import { validate, validateWithParams } from '../middlewares/validation.js';
import { 
  authenticateAndRequireAdmin,
  authenticateAndRequireRosterPlayoffsPermission,
  authenticateAndRequireRosterPlayoffsOwnership
} from '../middlewares/auth.js';
import { 
  createRosterPlayoffsSchema, 
  updateRosterPlayoffsSchema, 
  rosterPlayoffsQuerySchema,
  rosterPlayoffsIdSchema
} from '../validations/rosterPlayoffsValidation.js';

const router = Router();

// Rotas GET
router.get('/test', RosterPlayoffsController.testConnection);
router.get('/', validate(rosterPlayoffsQuerySchema), RosterPlayoffsController.getAllRosters);
router.get('/active', RosterPlayoffsController.getActiveSeasonRoster);
router.get('/season/:season_id', RosterPlayoffsController.getRosterBySeason);
router.get('/:id', RosterPlayoffsController.getRosterById);

// Rotas POST (admin ou dono do time)
router.post('/', authenticateAndRequireRosterPlayoffsPermission, validate(createRosterPlayoffsSchema), RosterPlayoffsController.createRoster);

// Rotas PUT (admin ou dono do time)
router.put('/:id', authenticateAndRequireRosterPlayoffsOwnership, validateWithParams(rosterPlayoffsIdSchema, updateRosterPlayoffsSchema), RosterPlayoffsController.updateRoster);

// Rotas DELETE (apenas admin)
router.delete('/:id', authenticateAndRequireAdmin, RosterPlayoffsController.deleteRoster);

export default router;
