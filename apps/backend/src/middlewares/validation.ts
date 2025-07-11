import { Request, Response, NextFunction } from 'express';
import { AnyZodObject, z } from 'zod';

export const validate = (schema: AnyZodObject) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      await schema.parseAsync(req.body);
      next();
    } catch (error) {
      next(error);
    }
  };
};

export const validateWithParams = (paramsSchema: AnyZodObject, bodySchema: AnyZodObject) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Validar parâmetros
      await paramsSchema.parseAsync(req.params);
      // Validar body
      await bodySchema.parseAsync(req.body);
      next();
    } catch (error) {
      next(error);
    }
  };
}; 