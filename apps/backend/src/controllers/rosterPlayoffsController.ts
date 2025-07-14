import { Request, Response } from 'express';
import { RosterPlayoffsService } from '@/services/rosterPlayoffsService.js';
import { asyncHandler } from '@/middlewares/errorHandler.js';
import { RosterPlayoffsQueryParams } from '@/types';
import pool from '@/utils/postgresClient.js';

export class RosterPlayoffsController {
  // GET /api/v1/roster-playoffs/test - Teste de conexão
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
      
      const { rows } = await pool.query('SELECT COUNT(*) FROM roster_playoffs');
      
      return res.status(200).json({
        success: true,
        message: 'Conexão com PostgreSQL OK',
        data: { rosterPlayoffsCount: parseInt(rows[0].count) }
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

  // GET /api/v1/roster-playoffs - Listar todos os rosters playoffs com filtros
  static getAllRosters = asyncHandler(async (req: Request, res: Response) => {
    const params: RosterPlayoffsQueryParams = {
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

    const result = await RosterPlayoffsService.getAllRosters(params);
    
    return res.status(200).json(result);
  });

  // GET /api/v1/roster-playoffs/:id - Buscar roster playoffs por ID
  static getRosterById = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ success: false, message: 'ID é obrigatório' });
    }
    const roster = await RosterPlayoffsService.getRosterById(Number(id));
    
    return res.status(200).json({
      success: true,
      data: roster
    });
  });

  // GET /api/v1/roster-playoffs/season/:season_id - Buscar roster playoffs por temporada
  static getRosterBySeason = asyncHandler(async (req: Request, res: Response) => {
    const { season_id } = req.params;

    if (!season_id) {
      return res.status(400).json({ success: false, message: 'ID da temporada é obrigatório' });
    }
    
    try {
      const roster = await RosterPlayoffsService.getRosterBySeason(Number(season_id));
      
      if (!roster) {
        return res.status(404).json({
          success: false,
          message: 'Roster playoffs não encontrado para esta temporada'
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

  // GET /api/v1/roster-playoffs/active - Buscar roster playoffs da temporada ativa
  static getActiveSeasonRoster = asyncHandler(async (req: Request, res: Response) => {
    try {
      const roster = await RosterPlayoffsService.getActiveSeasonRoster();
      
      if (!roster) {
        return res.status(404).json({
          success: false,
          message: 'Nenhum roster playoffs encontrado para a temporada ativa'
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

  // POST /api/v1/roster-playoffs - Criar novo roster playoffs
  static createRoster = asyncHandler(async (req: Request, res: Response) => {
    const adminUser = (req as any).user; // Admin que fez a requisição
    const roster = await RosterPlayoffsService.createRoster(req.body);
    
    res.status(201).json({
      success: true,
      data: roster,
      message: 'Roster playoffs criado com sucesso',
      admin: {
        id: adminUser.id,
        email: adminUser.email
      }
    });
  });

  // PUT /api/v1/roster-playoffs/:id - Atualizar roster playoffs
  static updateRoster = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ success: false, message: 'ID é obrigatório' });
    }
    const roster = await RosterPlayoffsService.updateRoster(Number(id), req.body);
    
    return res.status(200).json({
      success: true,
      data: roster,
      message: 'Roster playoffs atualizado com sucesso'
    });
  });

  // DELETE /api/v1/roster-playoffs/:id - Deletar roster playoffs
  static deleteRoster = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ success: false, message: 'ID é obrigatório' });
    }
    
    await RosterPlayoffsService.deleteRoster(Number(id));
    
    return res.status(200).json({
      success: true,
      message: 'Roster playoffs deletado com sucesso'
    });
  });
}
