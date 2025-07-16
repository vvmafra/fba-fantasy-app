import { Router } from 'express';
import { UserController } from '../controllers/userController.js';
import { authenticateAndRequireAdmin } from '../middlewares/auth.js';

const router = Router();

// Rotas GET
router.get('/test', (req, res) => {
  res.json({ message: 'User routes working!' });
});

router.get('/', authenticateAndRequireAdmin, UserController.getAllUsers);
router.get('/:id', authenticateAndRequireAdmin, UserController.getUserById);

// Rotas POST (apenas admin)
router.post('/', authenticateAndRequireAdmin, UserController.createUser);

// Rotas PUT (apenas admin)
router.put('/:id', authenticateAndRequireAdmin, UserController.updateUser);

// Rotas DELETE (apenas admin)
router.delete('/:id', authenticateAndRequireAdmin, UserController.deleteUser);

export default router; 