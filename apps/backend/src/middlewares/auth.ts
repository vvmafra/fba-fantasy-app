import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import pool from '../utils/postgresClient';

export const authenticateToken = (req: Request, res: Response, next: NextFunction) => {
  console.log("=== MIDDLEWARE AUTHENTICATE TOKEN ===");
  const authHeader = (req.headers as any).authorization;
  console.log("authHeader: ", authHeader);
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN
  console.log("token extraído: ", token ? "TOKEN PRESENTE" : "TOKEN AUSENTE");

  if (!token) {
    console.log("Token não fornecido");
    res.status(401).json({ 
      success: false, 
      message: 'Token de acesso é obrigatório' 
    });
    return;
  }

  try {
    const decoded = jwt.verify(token, process.env['JWT_SECRET']!) as any;
    console.log("Token decodificado: ", decoded);
    (req as any).user = {
      id: decoded.userId.toString(),
      email: decoded.email,
      role: decoded.role || 'user' // Extrai a role do token
    };

    console.log('Usuário autenticado com sucesso:', (req as any).user);
    next();
  } catch (error) {
    console.log("Erro ao verificar token: ", error);
    res.status(403).json({ 
      success: false, 
      message: 'Token inválido ou expirado' 
    });
    return;
  }
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

    console.log(`Usuário ${userId} autorizado para acessar time ${teamId}`);
    next();
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
      res.status(401).json({ 
        success: false, 
        message: 'Usuário não autenticado' 
      });
    }

    if (!playerId || playerId === 0) {
      res.status(400).json({ 
        success: false, 
        message: 'ID do player é obrigatório' 
      });
    }

    // Buscar o player no banco para verificar o team_id
    const { rows } = await pool.query('SELECT team_id FROM players WHERE id = $1', [playerId]);
    
    if (rows.length === 0) {
      res.status(404).json({ 
        success: false, 
        message: 'Player não encontrado' 
      });
    }

    const playerTeamId = rows[0].team_id;
    
    // Se o player não tem time (é free agent), não permitir operações
    if (!playerTeamId) {
      res.status(403).json({ 
        success: false, 
        message: 'Player é Free Agent e não pode ser modificado desta forma.' 
      });
    }

    // Buscar o time para verificar o owner_id
    const { rows: teamRows } = await pool.query('SELECT owner_id FROM teams WHERE id = $1', [playerTeamId]);
    
    if (teamRows.length === 0) {
      res.status(404).json({ 
        success: false, 
        message: 'Time do player não encontrado' 
      });
    }

    const teamOwnerId = teamRows[0].owner_id;
    const userId = parseInt(user.id);

    // Verificar se o usuário é o dono do time que possui o player
    if (teamOwnerId !== userId) {
      res.status(403).json({ 
        success: false, 
        message: 'Acesso negado. Apenas o dono do time pode realizar esta ação.' 
      });
    }

    console.log(`Usuário ${userId} autorizado para modificar player ${playerId} do time ${playerTeamId}`);
    next();
  } catch (error) {
    console.error('Erro no middleware requirePlayerTeamOwnership:', error);
    res.status(500).json({ 
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

    console.log(`Usuário ${userId} tem ${teamCount} time(s) e está autorizado`);
    next();
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
    const updateData = req.body;
    
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
    const isAdmin = user.role === 'admin';
    const isOwner = teamOwnerId === userId;

    // Se é admin, pode editar qualquer campo
    if (isAdmin) {
      console.log(`Admin ${userId} autorizado para editar time ${teamId}`);
      return next();
    }

    // Se não é admin nem dono, negar acesso
    if (!isOwner) {
      return res.status(403).json({ 
        success: false, 
        message: 'Acesso negado. Apenas o dono do time pode realizar esta ação.' 
      });
    }

    // Se é dono, verificar se está tentando editar apenas player_order
    const allowedFields = ['player_order'];
    const attemptedFields = Object.keys(updateData);
    const hasUnauthorizedFields = attemptedFields.some(field => !allowedFields.includes(field));

    if (hasUnauthorizedFields) {
      return res.status(403).json({ 
        success: false, 
        message: 'Acesso negado. Como dono do time, você só pode alterar a ordem dos players (player_order). Para outras alterações, contate um administrador.' 
      });
    }

    console.log(`Dono ${userId} autorizado para editar player_order do time ${teamId}`);
    next();
  } catch (error) {
    console.error('Erro no middleware requireTeamEditPermission:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Erro interno do servidor' 
    });
  }
};

// Middleware combinado: autenticação + permissões de edição de time
export const authenticateAndRequireTeamEditPermission = (req: Request, res: Response, next: NextFunction) => {
  authenticateToken(req, res, (err) => {
    if (err) return next(err);
    requireTeamEditPermission(req, res, next);
  });
}; 