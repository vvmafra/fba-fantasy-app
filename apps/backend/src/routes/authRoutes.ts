import { AuthController } from '../controllers/AuthController.js';
import { Router } from 'express';
import { validateRefreshToken, rateLimit } from '../middlewares/auth.js';

const router = Router();

// Rota de login Google (pública, mas com rate limiting)
router.post('/google-login', rateLimit, AuthController.googleLogin);

// Rota de refresh token (com validação de segurança)
router.post('/refresh-token', rateLimit, validateRefreshToken, AuthController.refreshToken);

export default router; 