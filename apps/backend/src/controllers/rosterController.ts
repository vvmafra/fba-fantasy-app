import { Request, Response } from 'express';
import { RosterService } from '@/services/rosterService';
import { asyncHandler } from '@/middlewares/errorHandler';
import { RosterQueryParams } from '@/types';
import pool from '@/utils/postgresClient';

export class RosterController {
  // GET /api/v1/roster/test - Teste de conexão
  static testConnection = asyncHandler(async (req: Request, res: Response) => {
    try {
      
      if (!pool) {
        return res.status(500).json({
          success: false,
          message: 'Cliente PostgreSQL não inicializado',
          env: {
            hasDatabaseUrl: !!process.env['DATABASE_URL']
          }
        });
      }
      
      const { rows } = await pool.query('SELECT COUNT(*) FROM roster_season');
      
      return res.status(200).json({
        success: true,
        message: 'Conexão com PostgreSQL OK',
        data: { rosterCount: parseInt(rows[0].count) }
      });
    } catch (error) {
      console.error('💥 Erro no teste:', error);
      return res.status(500).json({
        success: false,
        message: 'Erro interno',
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      });
    }
  });

  // GET /api/v1/roster - Listar todos os rosters com filtros
  static getAllRosters = asyncHandler(async (req: Request, res: Response) => {
    const params: RosterQueryParams = {
      page: Number(req.query['page']) || 1,
      limit: Number(req.query['limit']) || 10,
      sortBy: req.query['sortBy'] as string || 'created_at',
      sortOrder: (req.query['sortOrder'] as 'asc' | 'desc') || 'desc',
      ...(req.query['season_id'] && { season_id: Number(req.query['season_id']) }),
      ...(req.query['team_id'] && { team_id: Number(req.query['team_id']) }),
      ...(req.query['rotation_style'] && { rotation_style: req.query['rotation_style'] as 'automatic' | 'manual' }),
      ...(req.query['game_style'] && { game_style: req.query['game_style'] as string }),
      ...(req.query['offense_style'] && { offense_style: req.query['offense_style'] as string }),
      ...(req.query['defense_style'] && { defense_style: req.query['defense_style'] as string })
    };

    const result = await RosterService.getAllRosters(params);
    
    return res.status(200).json(result);
  });

  // GET /api/v1/roster/:id - Buscar roster por ID
  static getRosterById = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ success: false, message: 'ID é obrigatório' });
    }
    const roster = await RosterService.getRosterById(Number(id));
    
    return res.status(200).json({
      success: true,
      data: roster
    });
  });

  // GET /api/v1/roster/season/:season_id - Buscar roster por temporada
  static getRosterBySeason = asyncHandler(async (req: Request, res: Response) => {
    const { season_id } = req.params;

    if (!season_id) {
      return res.status(400).json({ success: false, message: 'ID da temporada é obrigatório' });
    }
    
    try {
      const roster = await RosterService.getRosterBySeason(Number(season_id));
      
      if (!roster) {
        return res.status(404).json({
          success: false,
          message: 'Roster não encontrado para esta temporada'
        });
      }
      
      return res.status(200).json({
        success: true,
        data: roster
      });
    } catch (error) {
      console.error('💥 Erro no controller:', error);
      return res.status(500).json({
        success: false,
        message: 'Erro interno do servidor',
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      });
    }
  });

  // GET /api/v1/roster/active - Buscar roster da temporada ativa
  static getActiveSeasonRoster = asyncHandler(async (req: Request, res: Response) => {
    try {
      const roster = await RosterService.getActiveSeasonRoster();
      
      if (!roster) {
        return res.status(404).json({
          success: false,
          message: 'Nenhum roster encontrado para a temporada ativa'
        });
      }
      
      return res.status(200).json({
        success: true,
        data: roster
      });
    } catch (error) {
      console.error('💥 Erro no controller:', error);
      return res.status(500).json({
        success: false,
        message: 'Erro interno do servidor',
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      });
    }
  });

  // POST /api/v1/roster - Criar novo roster
  static createRoster = asyncHandler(async (req: Request, res: Response) => {
    const adminUser = (req as any).user; // Admin que fez a requisição
    const roster = await RosterService.createRoster(req.body);
    
    res.status(201).json({
      success: true,
      data: roster,
      message: 'Roster criado com sucesso',
      admin: {
        id: adminUser.id,
        email: adminUser.email
      }
    });
  });

  // PUT /api/v1/roster/:id - Atualizar roster
  static updateRoster = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ success: false, message: 'ID é obrigatório' });
    }
    const roster = await RosterService.updateRoster(Number(id), req.body);
    
    return res.status(200).json({
      success: true,
      data: roster,
      message: 'Roster atualizado com sucesso'
    });
  });

  // DELETE /api/v1/roster/:id - Deletar roster
  static deleteRoster = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ success: false, message: 'ID é obrigatório' });
    }
    
    await RosterService.deleteRoster(Number(id));
    
    return res.status(200).json({
      success: true,
      message: 'Roster deletado com sucesso'
    });
  });
}
