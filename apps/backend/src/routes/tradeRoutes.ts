import { Router } from 'express';
import { z } from 'zod';
import { TradeController } from '../controllers/tradeController.js';
import { validate, validateWithParams } from '../middlewares/validation.js';
import { 
  createTradeSchema, 
  updateTradeParticipantSchema, 
  tradeIdSchema, 
  participantIdSchema,
  tradeQuerySchema,
  executeTradeSchema,
  revertTradeSchema
} from '../validations/tradeValidation.js';
import { authenticateToken, authenticateAndRequireAdmin } from '../middlewares/auth.js';
import { 
  requireTradeCreationPermission, 
  requireTradeResponsePermission, 
  requireTradeViewPermission 
} from '../middlewares/tradeAuth.js';

const router = Router();

// Aplicar autenticação em todas as rotas
router.use(authenticateToken);

// GET /api/v1/trades - Listar todas as trades
router.get('/', validate(tradeQuerySchema), TradeController.getAllTrades);

// GET /api/v1/trades/counts - Contar trades por status
router.get('/counts', TradeController.getTradeCounts);

// GET /api/v1/trades/my-trades - Buscar trades do usuário autenticado
router.get('/my-trades', TradeController.getMyTrades);

// GET /api/v1/trades/my-trades/count - Contar trades do usuário autenticado
router.get('/my-trades/count', requireTradeViewPermission, TradeController.countMyTrades);

// GET /api/v1/trades/team/:teamId - Buscar trades de um time específico
router.get('/team/:teamId', requireTradeViewPermission, TradeController.getTradesByTeam);

// GET /api/v1/trades/team/:teamId/executed-count - Contar trades executadas de um time em um período
router.get('/team/:teamId/executed-count', requireTradeViewPermission, TradeController.countExecutedTradesByTeam);

// GET /api/v1/trades/:id/trade-limits - Verificar limites de trades de todos os participantes
router.get('/:id/trade-limits', TradeController.checkTradeLimits);

// GET /api/v1/trades/:id - Buscar trade por ID com detalhes
router.get('/:id', validate(tradeIdSchema), TradeController.getTradeById);

// POST /api/v1/trades - Criar nova trade
router.post('/', requireTradeCreationPermission, validate(createTradeSchema), TradeController.createTrade);

// PATCH /api/v1/trades/participants/:id - Responder à trade
router.patch(
  '/participants/:id', 
  requireTradeResponsePermission,
  validateWithParams(participantIdSchema, updateTradeParticipantSchema), 
  TradeController.updateParticipantResponse
);

// POST /api/v1/trades/:id/execute - Executar trade (admin apenas)
router.post(
  '/:id/execute', 
  authenticateAndRequireAdmin,
  validate(tradeIdSchema), 
  TradeController.executeTrade
);

// POST /api/v1/trades/:id/revert - Reverter trade (admin apenas)
router.post(
  '/:id/revert', 
  authenticateAndRequireAdmin,
  validateWithParams(tradeIdSchema, revertTradeSchema), 
  TradeController.revertTrade
);

// POST /api/v1/trades/reject-pending-after-deadline - Rejeitar trades pendentes após o deadline (admin apenas)
router.post(
  '/reject-pending-after-deadline',
  authenticateAndRequireAdmin,
  TradeController.rejectPendingTradesAfterDeadline
);

// PATCH /api/v1/trades/:id/made - Atualizar campo made de uma trade (admin apenas)
router.patch(
  '/:id/made',
  authenticateAndRequireAdmin,
  validateWithParams(tradeIdSchema, z.object({ made: z.boolean() })), 
  TradeController.updateTradeMade
);

// DELETE /api/v1/trades/:id/cancel - Cancelar trade (iniciador ou admin)
router.delete('/:id/cancel', requireTradeCreationPermission, TradeController.cancelTrade);

export default router; 