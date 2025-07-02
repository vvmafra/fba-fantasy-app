import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { AppError } from '@/types';

// Middleware para tratamento de erros
export const errorHandler = (
  error: Error | AppError | ZodError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  console.error('Error:', error);

  // Erro de validação Zod
  if (error instanceof ZodError) {
    return res.status(400).json({
      success: false,
      error: 'Erro de validação',
      details: error.errors.map(err => ({
        field: err.path.join('.'),
        message: err.message
      }))
    });
  }

  // Erro personalizado da aplicação
  if ('statusCode' in error && 'isOperational' in error) {
    return res.status(error.statusCode).json({
      success: false,
      error: error.message
    });
  }

  // Erro do Supabase
  if (error.message.includes('Supabase')) {
    return res.status(500).json({
      success: false,
      error: 'Erro na conexão com o banco de dados'
    });
  }

  // Erro genérico
  const statusCode = 500;
  const message = process.env.NODE_ENV === 'production' 
    ? 'Erro interno do servidor' 
    : error.message;

  res.status(statusCode).json({
    success: false,
    error: message
  });
};

// Função para criar erros personalizados
export const createError = (message: string, statusCode: number = 500): AppError => {
  const error = new Error(message) as AppError;
  error.statusCode = statusCode;
  error.isOperational = true;
  return error;
};

// Middleware para capturar erros assíncronos
export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}; 