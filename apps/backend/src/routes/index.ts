import { Router } from 'express';
import playerRoutes from './playerRoutes';
import teamRoutes from './teamRoutes';
import authRoutes from './authRoutes';

const router = Router();

// Health check
router.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'API está funcionando',
    timestamp: new Date().toISOString()
  });
});

// Rotas da API
router.use('/players', playerRoutes);
router.use('/teams', teamRoutes);
router.use('/auth', authRoutes);

export default router; 