import { Router } from 'express';
import playerRoutes from './playerRoutes.js';
import teamRoutes from './teamRoutes.js';
import authRoutes from './authRoutes.js';
import seasonRoutes from './seasonRoutes.js';
import pickRoutes from './pickRoutes.js';
import rosterRoutes from './rosterRoutes.js';
import rosterPlayoffsRoutes from './rosterPlayoffsRoutes.js';
import deadlineRoutes from './deadlineRoutes.js';
import tradeRoutes from './tradeRoutes.js';
import userRoutes from './userRoutes.js';
import leagueCapRoutes from './leagueCapRoutes.js';
import draftPickRoutes from './draftPickRoutes.js';
import seasonAwardsRoutes from './seasonAwardsRoutes.js';
import teamStandingRoutes from './teamStandingRoutes.js';

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
router.use('/seasons', seasonRoutes);
router.use('/picks', pickRoutes);
router.use('/roster', rosterRoutes);
router.use('/roster-playoffs', rosterPlayoffsRoutes);
router.use('/deadlines', deadlineRoutes);
router.use('/trades', tradeRoutes);
router.use('/users', userRoutes);
router.use('/league-cap', leagueCapRoutes);
router.use('/draft-picks', draftPickRoutes);
router.use('/season-awards', seasonAwardsRoutes);
router.use('/team-standings', teamStandingRoutes);

export default router; 