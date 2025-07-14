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
}
