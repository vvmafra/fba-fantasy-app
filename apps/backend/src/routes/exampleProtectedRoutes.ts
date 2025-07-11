import { Router } from 'express';
import { 
  authenticateToken, 
  authenticateAndRequireAdmin, 
  authenticateAndRequireTeamOwnership,
  authenticateAndRequirePlayerTeamOwnership,
  authenticateAndRequireAnyTeam,
  authenticateAndRequireTeamEditPermission
} from '../middlewares/auth';

const router = Router();

// ========================================
// EXEMPLOS DE APLICAÇÃO DOS MIDDLEWARES
// ========================================

// 1. ROTA PÚBLICA (sem autenticação)
router.get('/public', (req, res) => {
  res.json({ message: 'Rota pública - qualquer um pode acessar' });
});

// 2. ROTA COM AUTENTICAÇÃO BÁSICA
router.get('/profile', authenticateToken, (req, res) => {
  const user = (req as any).user;
  res.json({ 
    message: 'Perfil do usuário', 
    user: { id: user.id, email: user.email } 
  });
});

// 3. ROTA ADMINISTRATIVA
router.post('/admin/create-user', authenticateAndRequireAdmin, (req, res) => {
  const adminUser = (req as any).user;
  res.json({ 
    message: 'Usuário criado por admin', 
    admin: { id: adminUser.id, email: adminUser.email } 
  });
});

// 4. ROTA QUE PRECISA DE OWNERSHIP DE TIME ESPECÍFICO
router.put('/teams/:id/settings', authenticateAndRequireTeamOwnership, (req, res) => {
  const teamId = req.params['id'];
  const user = (req as any).user;
  res.json({ 
    message: 'Configurações do time atualizadas', 
    teamId, 
    owner: { id: user.id, email: user.email } 
  });
});

// 5. ROTA QUE PRECISA DE OWNERSHIP DO TIME DO PLAYER
router.patch('/players/:id/transfer', authenticateAndRequirePlayerTeamOwnership, (req, res) => {
  const playerId = req.params['id'];
  const user = (req as any).user;
  res.json({ 
    message: 'Player transferido', 
    playerId, 
    owner: { id: user.id, email: user.email } 
  });
});

// 6. ROTA QUE PRECISA QUE O USUÁRIO TENHA ALGUM TIME
router.get('/trades', authenticateAndRequireAnyTeam, (req, res) => {
  const user = (req as any).user;
  res.json({ 
    message: 'Lista de trades', 
    user: { id: user.id, email: user.email } 
  });
});

// 7. ROTA COM MÚLTIPLOS MIDDLEWARES
router.post('/teams/:id/players', 
  authenticateAndRequireTeamOwnership, // Primeiro verifica ownership do time
  (req, res, next) => {
    // Middleware customizado adicional 
    next();
  },
  (req, res) => {
    res.json({ message: 'Player adicionado ao time' });
  }
);

// 8. ROTA COM VALIDAÇÃO + AUTENTICAÇÃO
router.post('/teams/:id/players/:playerId/assign', 
  authenticateAndRequireTeamOwnership,
  (req, res, next) => {
    // Validação customizada
    const { position } = req.body;
    if (!position) {
      return res.status(400).json({ 
        success: false, 
        message: 'Posição é obrigatória' 
      });
    }
    next();
  },
  (req, res) => {
    res.json({ message: 'Player atribuído à posição' });
  }
);

// 9. NOVA ROTA COM PERMISSÕES ESPECÍFICAS DE EDIÇÃO
// Admins podem editar qualquer campo, donos só podem editar player_order
router.put('/teams/:id/update', authenticateAndRequireTeamEditPermission, (req, res) => {
  const teamId = req.params['id'];
  const user = (req as any).user;
  const updateData = req.body;
  
  res.json({ 
    message: 'Time atualizado com permissões específicas', 
    teamId, 
    updatedBy: { 
      id: user.id, 
      email: user.email, 
      role: user.role 
    },
    fieldsUpdated: Object.keys(updateData),
    data: updateData
  });
});

// 10. EXEMPLO DE ROTA PARA ATUALIZAR APENAS PLAYER_ORDER
router.patch('/teams/:id/player-order', authenticateAndRequireTeamEditPermission, (req, res) => {
  const teamId = req.params['id'];
  const user = (req as any).user;
  const { player_order } = req.body;
  
  res.json({ 
    message: 'Ordem dos players atualizada', 
    teamId, 
    updatedBy: { 
      id: user.id, 
      email: user.email, 
      role: user.role 
    },
    player_order
  });
});

export default router; 