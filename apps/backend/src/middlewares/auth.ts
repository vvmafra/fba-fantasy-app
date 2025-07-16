import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import pool from '../utils/postgresClient.js';
import { SECURITY_CONFIG, logSecurityEvent } from '../config/security.js';

export const authenticateToken = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = (req.headers as any).authorization;
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    logSecurityEvent('AUTH_FAILED', { 
      reason: 'Token não fornecido', 
      ip: req.ip, 
      path: req.path 
    });
    res.status(401).json({ 
      success: false, 
      message: 'Token de acesso é obrigatório' 
    });
    return;
  }

  try {
    const decoded = jwt.verify(token, SECURITY_CONFIG.JWT.SECRET) as any;
    (req as any).user = {
      id: decoded.userId.toString(),
      email: decoded.email,
      role: decoded.role || 'user' // Extrai a role do token
    };

    next();
  } catch (error) {
    logSecurityEvent('AUTH_FAILED', { 
      reason: 'Token inválido ou expirado', 
      ip: req.ip, 
      path: req.path,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    res.status(403).json({ 
      success: false, 
      message: 'Token inválido ou expirado' 
    });
    return;
  }
};

// Middleware para validar refresh token com segurança adicional
export const validateRefreshToken = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userId, refreshToken } = req.body;

    if (!userId || !refreshToken) {
      logSecurityEvent('REFRESH_TOKEN_FAILED', { 
        reason: 'Dados obrigatórios ausentes', 
        ip: req.ip 
      });
      return res.status(400).json({
        success: false,
        message: 'userId e refreshToken são obrigatórios'
      });
    }

    // Verificar se o refresh token é válido no banco
    const { rows } = await pool.query(
      `SELECT refresh_token, token_updated_at, email 
       FROM users 
       WHERE id = $1 AND refresh_token = $2`,
      [userId, refreshToken]
    );

    if (rows.length === 0) {
      logSecurityEvent('REFRESH_TOKEN_FAILED', { 
        reason: 'Token inválido no banco', 
        ip: req.ip,
        userId 
      });
      return res.status(401).json({
        success: false,
        message: 'Refresh token inválido'
      });
    }

    // Verificar se o token não expirou (usando configuração)
    const tokenUpdatedAt = new Date(rows[0].token_updated_at);
    const now = new Date();
    const daysDiff = (now.getTime() - tokenUpdatedAt.getTime()) / (1000 * 60 * 60 * 24);

    if (daysDiff > SECURITY_CONFIG.REFRESH_TOKEN.MAX_AGE_DAYS) {
      logSecurityEvent('REFRESH_TOKEN_FAILED', { 
        reason: 'Token expirado', 
        ip: req.ip,
        userId,
        daysDiff: Math.round(daysDiff)
      });
      return res.status(401).json({
        success: false,
        message: 'Refresh token expirado'
      });
    }

    // Adicionar dados do usuário à requisição
    (req as any).refreshUser = {
      id: userId,
      email: rows[0].email,
      refreshToken
    };

    next();
  } catch (error) {
    logSecurityEvent('REFRESH_TOKEN_ERROR', { 
      reason: 'Erro interno', 
      ip: req.ip,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    console.error('Erro na validação do refresh token:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
};

// Cache simples para rate limiting (em produção, use Redis)
const rateLimitCache = new Map<string, { count: number; resetTime: number }>();

// Middleware para rate limiting básico
export const rateLimit = (req: Request, res: Response, next: NextFunction) => {
  const clientIP = req.ip || req.connection.remoteAddress;
  const endpoint = req.path;
  
  // Determinar limite baseado no endpoint
  let maxRequests = SECURITY_CONFIG.RATE_LIMIT.MAX_REQUESTS.GENERAL;
  if (endpoint.includes('/login') || endpoint.includes('/google-login')) {
    maxRequests = SECURITY_CONFIG.RATE_LIMIT.MAX_REQUESTS.LOGIN;
  } else if (endpoint.includes('/refresh')) {
    maxRequests = SECURITY_CONFIG.RATE_LIMIT.MAX_REQUESTS.REFRESH;
  }
  
  const key = `${clientIP}:${endpoint}`;
  const now = Date.now();
  const windowMs = SECURITY_CONFIG.RATE_LIMIT.WINDOW_MS;
  
  // Limpar cache expirado
  if (rateLimitCache.has(key)) {
    const entry = rateLimitCache.get(key)!;
    if (now > entry.resetTime) {
      rateLimitCache.delete(key);
    }
  }
  
  // Verificar rate limit
  if (rateLimitCache.has(key)) {
    const entry = rateLimitCache.get(key)!;
    if (entry.count >= maxRequests) {
      logSecurityEvent('RATE_LIMIT_EXCEEDED', { 
        ip: clientIP, 
        endpoint, 
        maxRequests,
        currentCount: entry.count
      });
      return res.status(429).json({
        success: false,
        message: 'Muitas requisições. Tente novamente mais tarde.',
        retryAfter: Math.ceil((entry.resetTime - now) / 1000)
      });
    }
    entry.count++;
  } else {
    rateLimitCache.set(key, {
      count: 1,
      resetTime: now + windowMs
    });
  }
  
  logSecurityEvent('RATE_LIMIT_CHECK', { 
    ip: clientIP, 
    endpoint, 
    maxRequests,
    currentCount: rateLimitCache.get(key)?.count || 1
  });
  
  next();
};

export const requireAdmin = (req: Request, res: Response, next: NextFunction) => {
  const user = (req as any).user;
  
  if (!user) {
    res.status(401).json({ 
      success: false, 
      message: 'Usuário não autenticado' 
    });
    return;
  }

  if (user.role !== 'admin') {
    res.status(403).json({ 
      success: false, 
      message: 'Acesso negado. Apenas administradores podem realizar esta ação.' 
    });
    return;
  }

  next();
};

// Middleware combinado: autenticação + admin
export const authenticateAndRequireAdmin = (req: Request, res: Response, next: NextFunction) => {
  authenticateToken(req, res, (err) => {
    if (err) return next(err);
    requireAdmin(req, res, next);
  });
};

// Middleware para verificar se o usuário é o dono do time
export const requireTeamOwnership = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = (req as any).user;
    const teamId = parseInt(req.params['teamId'] || req.params['id'] || '0');
    
    if (!user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Usuário não autenticado' 
      });
    }

    if (!teamId || teamId === 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'ID do time é obrigatório' 
      });
    }

    // Buscar o time no banco para verificar o owner_id
    const { rows } = await pool.query('SELECT owner_id FROM teams WHERE id = $1', [teamId]);
    
    if (rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Time não encontrado' 
      });
    }

    const teamOwnerId = rows[0].owner_id;
    const userId = parseInt(user.id);

    // Verificar se o usuário é o dono do time
    if (teamOwnerId !== userId) {
      return res.status(403).json({ 
        success: false, 
        message: 'Acesso negado. Apenas o dono do time pode realizar esta ação.' 
      });
    }

    return next();
  } catch (error) {
    console.error('Erro no middleware requireTeamOwnership:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Erro interno do servidor' 
    });
  }
};

// Middleware combinado: autenticação + ownership do time
export const authenticateAndRequireTeamOwnership = (req: Request, res: Response, next: NextFunction) => {
  authenticateToken(req, res, (err) => {
    if (err) return next(err);
    requireTeamOwnership(req, res, next);
  });
};

// Middleware para verificar se o usuário é dono do time que possui o player
export const requirePlayerTeamOwnership = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = (req as any).user;
    const playerId = parseInt(req.params['id'] || '0');
    
    if (!user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Usuário não autenticado' 
      });
    }

    if (!playerId || playerId === 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'ID do player é obrigatório' 
      });
    }

    // Buscar o player no banco para verificar o team_id
    const { rows } = await pool.query('SELECT team_id FROM players WHERE id = $1', [playerId]);
    
    if (rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Player não encontrado' 
      });
    }

    const playerTeamId = rows[0].team_id;
    
    // Se o player não tem time (é free agent), não permitir operações
    if (!playerTeamId) {
      return res.status(403).json({ 
        success: false, 
        message: 'Player é Free Agent e não pode ser modificado desta forma.' 
      });
    }

    // Buscar o time para verificar o owner_id
    const { rows: teamRows } = await pool.query('SELECT owner_id FROM teams WHERE id = $1', [playerTeamId]);
    
    if (teamRows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Time do player não encontrado' 
      });
    }

    const teamOwnerId = teamRows[0].owner_id;
    const userId = parseInt(user.id);

    // Verificar se o usuário é o dono do time que possui o player
    if (teamOwnerId !== userId) {
      return res.status(403).json({ 
        success: false, 
        message: 'Acesso negado. Apenas o dono do time pode realizar esta ação.' 
      });
    }

    return next();
  } catch (error) {
    console.error('Erro no middleware requirePlayerTeamOwnership:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Erro interno do servidor' 
    });
  }
};

// Middleware combinado: autenticação + ownership do time do player
export const authenticateAndRequirePlayerTeamOwnership = (req: Request, res: Response, next: NextFunction) => {
  authenticateToken(req, res, (err) => {
    if (err) return next(err);
    requirePlayerTeamOwnership(req, res, next);
  });
};

// Middleware para verificar se o usuário tem pelo menos um time
export const requireAnyTeamOwnership = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = (req as any).user;
    
    if (!user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Usuário não autenticado' 
      });
    }

    const userId = parseInt(user.id);

    // Verificar se o usuário tem pelo menos um time
    const { rows } = await pool.query('SELECT COUNT(*) FROM teams WHERE owner_id = $1', [userId]);
    const teamCount = parseInt(rows[0].count);

    if (teamCount === 0) {
      return res.status(403).json({ 
        success: false, 
        message: 'Acesso negado. Você precisa ter pelo menos um time para acessar este recurso.' 
      });
    }

    return next();
  } catch (error) {
    console.error('Erro no middleware requireAnyTeamOwnership:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Erro interno do servidor' 
    });
  }
};

// Middleware combinado: autenticação + ter pelo menos um time
export const authenticateAndRequireAnyTeam = (req: Request, res: Response, next: NextFunction) => {
  authenticateToken(req, res, (err) => {
    if (err) return next(err);
    requireAnyTeamOwnership(req, res, next);
  });
};

// Middleware para verificar permissões de edição de time
// Admins podem editar qualquer campo, donos só podem editar player_order
export const requireTeamEditPermission = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = (req as any).user;
    const teamId = parseInt(req.params['teamId'] || req.params['id'] || '0');
    
    if (!user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Usuário não autenticado' 
      });
    }

    if (!teamId || teamId === 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'ID do time é obrigatório' 
      });
    }

    // Se for admin, permitir tudo
    if (user.role === 'admin') {
      return next();
    }

    // Buscar o time no banco para verificar o owner_id
    const { rows } = await pool.query('SELECT owner_id FROM teams WHERE id = $1', [teamId]);
    
    if (rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Time não encontrado' 
      });
    }

    const teamOwnerId = rows[0].owner_id;
    const userId = parseInt(user.id);

    // Verificar se o usuário é o dono do time
    if (teamOwnerId !== userId) {
      return res.status(403).json({ 
        success: false, 
        message: 'Acesso negado. Apenas o dono do time pode realizar esta ação.' 
      });
    }

    return next();
  } catch (error) {
    console.error('Erro no middleware requireTeamEditPermission:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Erro interno do servidor' 
    });
  }
};

// Middleware combinado: autenticação + permissão de edição de time
export const authenticateAndRequireTeamEditPermission = (req: Request, res: Response, next: NextFunction) => {
  authenticateToken(req, res, (err) => {
    if (err) return next(err);
    requireTeamEditPermission(req, res, next);
  });
}; 