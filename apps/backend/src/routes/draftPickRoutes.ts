import { Router } from 'express';
import { DraftPickController } from '../controllers/draftPickController.js';
import { authenticateAndRequireAdmin } from '../middlewares/auth.js';
import { validate, validateWithParams } from '../middlewares/validation.js';
import { 
  createDraftPickSchema, 
  updateDraftPickSchema, 
  draftPickIdSchema,
  addPlayerToDraftPickSchema,
  createPlayerForDraftPickSchema,
  draftPickQuerySchema,
  seasonIdSchema
} from '../validations/draftPickValidation.js';

const router = Router();

// Rotas públicas (apenas leitura)
router.get('/', DraftPickController.getAllDraftPicks);
router.get('/:id', DraftPickController.getDraftPickById);
router.get('/season/:seasonId', DraftPickController.getDraftPicksBySeason);
router.get('/next-pick/:seasonId', DraftPickController.getNextPickNumber);

// Rotas protegidas (apenas admin)
router.post('/', authenticateAndRequireAdmin, validate(createDraftPickSchema), DraftPickController.createDraftPick);
router.put('/:id', authenticateAndRequireAdmin, validateWithParams(draftPickIdSchema, updateDraftPickSchema), DraftPickController.updateDraftPick);
router.delete('/:id', authenticateAndRequireAdmin, DraftPickController.deleteDraftPick);

router.post('/:id/toggle-2k', authenticateAndRequireAdmin, DraftPickController.toggleAddedTo2k);
router.post('/:id/add-player', authenticateAndRequireAdmin, validateWithParams(draftPickIdSchema, addPlayerToDraftPickSchema), DraftPickController.addPlayerToDraftPick);
router.post('/:id/create-player', authenticateAndRequireAdmin, validateWithParams(draftPickIdSchema, createPlayerForDraftPickSchema), DraftPickController.createPlayerAndAddToDraftPick);

export default router; 