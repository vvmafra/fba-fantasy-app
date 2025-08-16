import { Router } from 'express';
import { WaiverController } from '../controllers/waiverController.js';
import { authenticateToken } from '../middlewares/auth.js';
import { validate, validateWithParams } from '../middlewares/validation.js';
import { addReleasedPlayerSchema, updateWaiverSchema, waiverParamsSchema } from '../validations/waiverValidation.js';
import { z } from 'zod';

const router = Router();
const waiverController = new WaiverController();

// Rotas protegidas por autenticação
router.use(authenticateToken);

// Adicionar jogador dispensado aos waivers
router.post('/add-released-player', validate(addReleasedPlayerSchema), waiverController.addReleasedPlayer);

// Obter todos os waivers
router.get('/', waiverController.getAllWaivers);

// Obter waivers por temporada
router.get('/season/:seasonId', validateWithParams(waiverParamsSchema.pick({ seasonId: true }), z.object({})), waiverController.getWaiversBySeason);

// Obter waivers por time
router.get('/team/:teamId', validateWithParams(waiverParamsSchema.pick({ teamId: true }), z.object({})), waiverController.getWaiversByTeam);

// Obter waiver específico
router.get('/:id', validateWithParams(waiverParamsSchema.pick({ id: true }), z.object({})), waiverController.getWaiverById);

// Atualizar waiver
router.put('/:id', validateWithParams(waiverParamsSchema.pick({ id: true }), updateWaiverSchema), waiverController.updateWaiver);

// Deletar waiver
router.delete('/:id', validateWithParams(waiverParamsSchema.pick({ id: true }), z.object({})), waiverController.deleteWaiver);

export default router;