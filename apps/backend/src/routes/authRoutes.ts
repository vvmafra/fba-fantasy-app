import { AuthController } from '@/controllers/AuthController';
import { Router } from 'express';

const router = Router();

router.post('/google-login', AuthController.googleLogin);

export default router; 