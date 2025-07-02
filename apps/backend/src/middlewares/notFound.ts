import { Request, Response } from 'express';

export const notFound = (req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: `Rota ${req.originalUrl} não encontrada`
  });
}; 