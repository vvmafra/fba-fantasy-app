import { Router } from 'express';
import { RosterPlayoffsController } from '../controllers/rosterPlayoffsController.js';
import { validate, validateWithParams } from '../middlewares/validation.js';
import { authenticateAndRequireAdmin } from '../middlewares/auth.js';
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

// Rotas POST (apenas admin)
router.post('/', authenticateAndRequireAdmin, validate(createRosterPlayoffsSchema), RosterPlayoffsController.createRoster);

// Rotas PUT (apenas admin)
router.put('/:id', authenticateAndRequireAdmin, validateWithParams(rosterPlayoffsIdSchema, updateRosterPlayoffsSchema), RosterPlayoffsController.updateRoster);

// Rotas DELETE (apenas admin)
router.delete('/:id', authenticateAndRequireAdmin, RosterPlayoffsController.deleteRoster);

export default router;
