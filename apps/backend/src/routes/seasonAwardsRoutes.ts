import { Router } from 'express';
import { SeasonAwardsController } from '../controllers/seasonAwardsController.js';
import { authenticateAndRequireAdmin } from '../middlewares/auth.js';
import { validate, validateWithParams } from '../middlewares/validation.js';
import { 
  createSeasonAwardsSchema, 
  updateSeasonAwardsSchema, 
  seasonAwardsIdSchema,
  seasonIdSchema
} from '../validations/seasonAwardsValidation.js';

const router = Router();

// GET /api/v1/season-awards - Listar todas as premiações
router.get('/', authenticateAndRequireAdmin, SeasonAwardsController.getAllSeasonAwards);

// GET /api/v1/season-awards/season/:seasonId - Buscar premiação por temporada
router.get('/season/:seasonId', authenticateAndRequireAdmin, SeasonAwardsController.getSeasonAwardsBySeason);

// GET /api/v1/season-awards/:id - Buscar premiação por ID
router.get('/:id', authenticateAndRequireAdmin, SeasonAwardsController.getSeasonAwardsById);

// POST /api/v1/season-awards - Criar nova premiação
router.post('/', authenticateAndRequireAdmin, validate(createSeasonAwardsSchema), SeasonAwardsController.createSeasonAwards);

// PUT /api/v1/season-awards/:id - Atualizar premiação
router.put('/:id', authenticateAndRequireAdmin, validateWithParams(seasonAwardsIdSchema, updateSeasonAwardsSchema), SeasonAwardsController.updateSeasonAwards);

// DELETE /api/v1/season-awards/:id - Deletar premiação
router.delete('/:id', authenticateAndRequireAdmin, SeasonAwardsController.deleteSeasonAwards);

export default router; 