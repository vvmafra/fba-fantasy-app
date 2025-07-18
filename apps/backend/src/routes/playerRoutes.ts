import { Router } from 'express';
import { PlayerController } from '../controllers/playerController.js';
import { validate, validateWithParams } from '../middlewares/validation.js';
import { authenticateAndRequireAdmin, authenticateAndRequirePlayerTeamOwnership } from '../middlewares/auth.js';
import { 
  createPlayerSchema, 
  updatePlayerSchema, 
  playerQuerySchema,
  playerIdSchema,
  ocrRequestSchema,
  transferPlayerSchema,
  batchUpdateSchema
} from '../validations/playerValidation.js';

const router = Router();

// Rotas GET
router.get('/test', PlayerController.testConnection);
router.get('/', validate(playerQuerySchema), PlayerController.getAllPlayers);
router.get('/all', PlayerController.getAllPlayersWithoutPagination);
// router.get('/free-agents', PlayerController.getFreeAgents);
router.get('/team/:team_id', PlayerController.getPlayersByTeam);
// router.get('/position/:position', PlayerController.getPlayersByPosition);
router.get('/:id', PlayerController.getPlayerById);

// Rotas POST (apenas admin)
router.post('/', authenticateAndRequireAdmin, validate(createPlayerSchema), PlayerController.createPlayer);
router.post('/ocr', authenticateAndRequireAdmin, validate(ocrRequestSchema), PlayerController.createPlayerOCR);

// Rotas PUT
router.put('/:id', validateWithParams(playerIdSchema, updatePlayerSchema), PlayerController.updatePlayer);
// router.put('/batch', validate(batchUpdateSchema), PlayerController.batchUpdatePlayers);

// Rotas PATCH (precisam de ownership do time)
// router.patch('/:id/transfer', validate(transferPlayerSchema), PlayerController.transferPlayer);
router.patch('/:id/release', authenticateAndRequirePlayerTeamOwnership, PlayerController.releasePlayer);

// Rotas DELETE (precisam de ownership do time)
router.delete('/:id', authenticateAndRequirePlayerTeamOwnership, PlayerController.deletePlayer);

export default router; 