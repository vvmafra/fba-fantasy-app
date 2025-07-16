import { z } from 'zod';

// Schema para ID de usuário
export const userIdSchema = z.object({
  id: z.string().regex(/^\d+$/, 'ID deve ser um número').transform(Number)
});

// Schema para criação de usuário
export const createUserSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório').max(100, 'Nome muito longo'),
  email: z.string().email('Email inválido').max(255, 'Email muito longo'),
  role: z.enum(['admin', 'user']).optional().default('user')
});

// Schema para atualização de usuário
export const updateUserSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório').max(100, 'Nome muito longo').optional(),
  email: z.string().email('Email inválido').max(255, 'Email muito longo').optional(),
  role: z.enum(['admin', 'user']).optional()
});

// Schema para query parameters
export const userQuerySchema = z.object({
  page: z.string().regex(/^\d+$/, 'Página deve ser um número').transform(Number).optional(),
  limit: z.string().regex(/^\d+$/, 'Limite deve ser um número').transform(Number).optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
  name: z.string().optional(),
  email: z.string().optional(),
  role: z.enum(['admin', 'user']).optional()
}); 