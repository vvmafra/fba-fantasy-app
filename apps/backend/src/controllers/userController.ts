import { Request, Response } from 'express';
import asyncHandler from 'express-async-handler';
import { UserService } from '../services/UserService.js';
import { CreateUserRequest, UpdateUserRequest, UserQueryParams } from '../types/index.js';

export class UserController {
  // GET /api/v1/users - Listar todos os usuários com filtros
  static getAllUsers = asyncHandler(async (req: Request, res: Response) => {
    const params: UserQueryParams = {
      page: Number(req.query['page']) || 1,
      limit: Number(req.query['limit']) || 10,
      sortOrder: (req.query['sortOrder'] as 'asc' | 'desc') || 'desc',
      name: req.query['name'] as string,
      email: req.query['email'] as string,
      ...(req.query['role'] && { role: req.query['role'] as 'admin' | 'user' })
    };

    const result = await UserService.getAllUsers(params);
    
    res.status(200).json(result);
  });

  // GET /api/v1/users/:id - Buscar usuário por ID
  static getUserById = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    if (!id) {
      res.status(400).json({ success: false, message: 'ID é obrigatório' });
      return;
    }
    const user = await UserService.getUserById(Number(id));
    
    res.status(200).json({
      success: true,
      data: user
    });
  });

  // POST /api/v1/users - Criar novo usuário
  static createUser = asyncHandler(async (req: Request, res: Response) => {
    const adminUser = (req as any).user; // Admin que fez a requisição
    const userData: CreateUserRequest = req.body;
    const user = await UserService.createUser(userData);
    
    res.status(201).json({
      success: true,
      data: user,
      message: 'Usuário criado com sucesso',
      admin: {
        id: adminUser.id,
        email: adminUser.email
      }
    });
  });

  // PUT /api/v1/users/:id - Atualizar usuário
  static updateUser = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const adminUser = (req as any).user;
    
    if (!id) {
      res.status(400).json({ success: false, message: 'ID é obrigatório' });
      return;
    }
    
    const userData: UpdateUserRequest = req.body;
    const user = await UserService.updateUser(Number(id), userData);
    
    res.status(200).json({
      success: true,
      data: user,
      message: 'Usuário atualizado com sucesso',
      updatedBy: {
        id: adminUser.id,
        email: adminUser.email,
        role: adminUser.role
      }
    });
  });

  // DELETE /api/v1/users/:id - Deletar usuário
  static deleteUser = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const adminUser = (req as any).user;
    
    if (!id) {
      res.status(400).json({ success: false, message: 'ID é obrigatório' });
      return;
    }
    
    await UserService.deleteUser(Number(id));
    
    res.status(200).json({
      success: true,
      message: 'Usuário deletado com sucesso',
      deletedBy: {
        id: adminUser.id,
        email: adminUser.email,
        role: adminUser.role
      }
    });
  });
}