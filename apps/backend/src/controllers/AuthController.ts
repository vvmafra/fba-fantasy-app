import { Request, Response } from 'express';
import { AuthService } from '../services/AuthService.js';
import { asyncHandler } from '../middlewares/errorHandler.js';

export class AuthController {
  static googleLogin = asyncHandler(async (req: Request, res: Response) => {
    const { credential } = req.body as { credential: string };

    if (!credential) {
      return res.status(400).json({ 
        success: false, 
        message: 'Credential é obrigatório' 
      });
    }

    const result = await AuthService.googleLogin(credential);

    return res.status(200).json({
      success: true,
      data: result
    });
  });

  static refreshToken = asyncHandler(async (req: Request, res: Response) => {
    // Os dados já foram validados pelo middleware validateRefreshToken
    const refreshUser = (req as any).refreshUser;
    
    if (!refreshUser) {
      return res.status(400).json({ 
        success: false, 
        message: 'Dados de refresh inválidos' 
      });
    }

    const result = await AuthService.refreshToken(refreshUser.id, refreshUser.refreshToken);

    return res.status(200).json({
      success: true,
      data: result
    });
  });

  static getCurrentUser = asyncHandler(async (req: Request, res: Response) => {
    const user = (req as any).user;
    
    if (!user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Usuário não autenticado' 
      });
    }

    // Buscar dados atualizados do usuário
    const userData = await AuthService.getUserById(parseInt(user.id));
    
    if (!userData) {
      return res.status(404).json({ 
        success: false, 
        message: 'Usuário não encontrado' 
      });
    }

    return res.status(200).json({
      success: true,
      data: userData
    });
  });
}
