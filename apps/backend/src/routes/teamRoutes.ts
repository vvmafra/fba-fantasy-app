import { Router } from 'express';
import { TeamController } from '../controllers/TeamController.js';
import { authenticateToken, authenticateAndRequireTeamOwnership, authenticateAndRequireTeamEditPermission } from '../middlewares/auth.js';

const router = Router();

router.get('/', TeamController.getAllTeams);
router.get('/ranking', TeamController.getTeamsWithCAP);
router.get('/my-teams', authenticateToken, TeamController.getMyTeams);

// Rota com parâmetro deve vir por último para evitar conflitos
router.get('/:id', TeamController.getTeamById);

// Rotas que precisam de autenticação e ownership
router.post('/', authenticateToken, TeamController.createTeam);

// Rota de atualização com permissões específicas
// Admins podem editar qualquer campo, donos só podem editar player_order
router.put('/:id', authenticateAndRequireTeamEditPermission, TeamController.updateTeam);

// Rota de exclusão que precisa de ownership completo
router.delete('/:id', authenticateAndRequireTeamOwnership, TeamController.deleteTeam);

export default router; 