import { AuthController } from '../controllers/AuthController.js';
import { Router } from 'express';
import { validateRefreshToken, rateLimit, authenticateToken } from '../middlewares/auth.js';

const router = Router();

// Rota de login Google (pública, mas com rate limiting)
router.post('/google-login', rateLimit, AuthController.googleLogin);

// Rota de refresh token (pública, mas com validação)
router.post('/refresh-token', validateRefreshToken, AuthController.refreshToken);

// Rota para buscar dados do usuário atual (protegida)
router.get('/me', authenticateToken, AuthController.getCurrentUser);

export default router; 