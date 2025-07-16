import { Request, Response, NextFunction } from 'express';
import pool from '../utils/postgresClient.js';

// Middleware para verificar se o usuário pode criar trades para um time
export const requireTradeCreationPermission = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = (req as any).user;
    const created_by_team = req.body.created_by_team || req.query['created_by_team'];
    
    if (!user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Usuário não autenticado' 
      });
    }

    if (!created_by_team) {
      return res.status(400).json({ 
        success: false, 
        message: 'Time criador é obrigatório' 
      });
    }

    // Verificar se o usuário é admin ou owner do time
    if (user.role === 'admin') {
      return next();
    }

    // Buscar o time para verificar o owner_id
    const { rows } = await pool.query('SELECT owner_id FROM teams WHERE id = $1', [created_by_team]);
    
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
        message: 'Acesso negado. Apenas o dono do time pode criar trades.' 
      });
    }

    next();
  } catch (error) {
    console.error('Erro no middleware requireTradeCreationPermission:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Erro interno do servidor' 
    });
  }
};

// Middleware para verificar se o usuário pode responder a uma trade
export const requireTradeResponsePermission = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = (req as any).user;
    const participantId = parseInt(req.params['id'] || '0');
    
    if (!user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Usuário não autenticado' 
      });
    }

    if (!participantId || participantId === 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'ID do participante é obrigatório' 
      });
    }

    // Verificar se o usuário é admin
    if (user.role === 'admin') {
      return next();
    }

    // Buscar o participante e o time associado
    const { rows } = await pool.query(`
      SELECT tp.team_id, t.owner_id 
      FROM trade_participants tp
      JOIN teams t ON tp.team_id = t.id
      WHERE tp.id = $1
    `, [participantId]);
    
    if (rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Participante da trade não encontrado' 
      });
    }

    const teamOwnerId = rows[0].owner_id;
    const userId = parseInt(user.id);

    // Verificar se o usuário é o dono do time participante
    if (teamOwnerId !== userId) {
      return res.status(403).json({ 
        success: false, 
        message: 'Acesso negado. Apenas o dono do time pode responder à trade.' 
      });
    }

    next();
  } catch (error) {
    console.error('Erro no middleware requireTradeResponsePermission:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Erro interno do servidor' 
    });
  }
};

// Middleware para verificar se o usuário pode visualizar trades de um time
export const requireTradeViewPermission = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = (req as any).user;
    const teamId = parseInt(req.params['teamId'] || '0');
    
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

    // Verificar se o usuário é admin
    if (user.role === 'admin') {
      return next();
    }

    // Buscar o time para verificar o owner_id
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
        message: 'Acesso negado. Apenas o dono do time pode visualizar suas trades.' 
      });
    }

    next();
  } catch (error) {
    console.error('Erro no middleware requireTradeViewPermission:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Erro interno do servidor' 
    });
  }
}; 