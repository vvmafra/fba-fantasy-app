import { Request, Response } from 'express';
import asyncHandler from 'express-async-handler';
import { TeamStandingService } from '../services/teamStandingService.js';
import type { CreateTeamStandingRequest, UpdateTeamStandingRequest } from '../types/index.js';

export class TeamStandingController {
  // GET /api/v1/team-standings - Listar todos os standings
  static getAllStandings = asyncHandler(async (req: Request, res: Response) => {
    const standings = await TeamStandingService.getAllStandings();
    res.status(200).json({ success: true, data: standings });
  });

  // GET /api/v1/team-standings/season/:seasonId - Listar standings por temporada
  static getStandingsBySeason = asyncHandler(async (req: Request, res: Response) => {
    const { seasonId } = req.params;
    if (!seasonId) {
      res.status(400).json({ success: false, message: 'ID da temporada é obrigatório' });
      return;
    }
    const standings = await TeamStandingService.getStandingsBySeason(Number(seasonId));
    res.status(200).json({ success: true, data: standings });
  });

  // GET /api/v1/team-standings/team/:teamId - Listar standings por time
  static getStandingsByTeam = asyncHandler(async (req: Request, res: Response) => {
    const { teamId } = req.params;
    if (!teamId) {
      res.status(400).json({ success: false, message: 'ID do time é obrigatório' });
      return;
    }
    const standings = await TeamStandingService.getStandingsByTeam(Number(teamId));
    res.status(200).json({ success: true, data: standings });
  });

  // GET /api/v1/team-standings/:id - Buscar standing específico
  static getStandingById = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    if (!id) {
      res.status(400).json({ success: false, message: 'ID é obrigatório' });
      return;
    }
    const standing = await TeamStandingService.getStandingById(Number(id));
    if (!standing) {
      res.status(404).json({ success: false, message: 'Standing não encontrado' });
      return;
    }
    res.status(200).json({ success: true, data: standing });
  });

  // GET /api/v1/team-standings/season/:seasonId/champions - Buscar campeões por temporada
  static getChampionsBySeason = asyncHandler(async (req: Request, res: Response) => {
    const { seasonId } = req.params;
    if (!seasonId) {
      res.status(400).json({ success: false, message: 'ID da temporada é obrigatório' });
      return;
    }
    const champions = await TeamStandingService.getChampionsBySeason(Number(seasonId));
    res.status(200).json({ success: true, data: champions });
  });

  // GET /api/v1/team-standings/season/:seasonId/playoffs - Buscar times dos playoffs por temporada
  static getPlayoffTeamsBySeason = asyncHandler(async (req: Request, res: Response) => {
    const { seasonId } = req.params;
    if (!seasonId) {
      res.status(400).json({ success: false, message: 'ID da temporada é obrigatório' });
      return;
    }
    const playoffTeams = await TeamStandingService.getPlayoffTeamsBySeason(Number(seasonId));
    res.status(200).json({ success: true, data: playoffTeams });
  });

  // POST /api/v1/team-standings - Criar novo standing
  static createStanding = asyncHandler(async (req: Request, res: Response) => {
    const standingData: CreateTeamStandingRequest = req.body;
    
    // Validações básicas
    if (!standingData.season_id || !standingData.team_id || 
        !standingData.final_position || !standingData.seed || 
        standingData.elimination_round === undefined) {
      res.status(400).json({ 
        success: false, 
        message: 'Todos os campos são obrigatórios: season_id, team_id, final_position, seed, elimination_round' 
      });
      return;
    }

    // Validações de valores
    if (standingData.final_position < 1 || standingData.final_position > 30) {
      res.status(400).json({ 
        success: false, 
        message: 'final_position deve estar entre 1 e 30' 
      });
      return;
    }

    if (standingData.seed < 1 || standingData.seed > 15) {
      res.status(400).json({ 
        success: false, 
        message: 'seed deve estar entre 1 e 15' 
      });
      return;
    }

    if (standingData.elimination_round < 0 || standingData.elimination_round > 5) {
      res.status(400).json({ 
        success: false, 
        message: 'elimination_round deve estar entre 0 e 5' 
      });
      return;
    }

    const standing = await TeamStandingService.createStanding(standingData);
    res.status(201).json({ success: true, data: standing, message: 'Standing criado com sucesso' });
  });

  // PUT /api/v1/team-standings/:id - Atualizar standing
  static updateStanding = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    if (!id) {
      res.status(400).json({ success: false, message: 'ID é obrigatório' });
      return;
    }

    const standingData: UpdateTeamStandingRequest = { ...req.body, id: Number(id) };
    
    // Validações de valores (se fornecidos)
    if (standingData.final_position !== undefined && 
        (standingData.final_position < 1 || standingData.final_position > 30)) {
      res.status(400).json({ 
        success: false, 
        message: 'final_position deve estar entre 1 e 30' 
      });
      return;
    }

    if (standingData.seed !== undefined && 
        (standingData.seed < 1 || standingData.seed > 15)) {
      res.status(400).json({ 
        success: false, 
        message: 'seed deve estar entre 1 e 15' 
      });
      return;
    }

    if (standingData.elimination_round !== undefined && 
        (standingData.elimination_round < 0 || standingData.elimination_round > 5)) {
      res.status(400).json({ 
        success: false, 
        message: 'elimination_round deve estar entre 0 e 5' 
      });
      return;
    }

    const standing = await TeamStandingService.updateStanding(Number(id), standingData);
    res.status(200).json({ success: true, data: standing, message: 'Standing atualizado com sucesso' });
  });

  // DELETE /api/v1/team-standings/:id - Deletar standing
  static deleteStanding = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    if (!id) {
      res.status(400).json({ success: false, message: 'ID é obrigatório' });
      return;
    }
    
    await TeamStandingService.deleteStanding(Number(id));
    res.status(200).json({ success: true, message: 'Standing deletado com sucesso' });
  });

  // POST /api/v1/team-standings/bulk - Criar ou atualizar múltiplos standings
  static upsertManyStandings = asyncHandler(async (req: Request, res: Response) => {
    const { standings } = req.body;
    
    if (!Array.isArray(standings) || standings.length === 0) {
      res.status(400).json({ 
        success: false, 
        message: 'standings deve ser um array não vazio' 
      });
      return;
    }

    // Validações básicas
    for (const standing of standings) {
      if (!standing.season_id || !standing.team_id || 
          standing.final_position === undefined || standing.seed === undefined || 
          standing.elimination_round === undefined) {
        res.status(400).json({ 
          success: false, 
          message: 'Todos os campos são obrigatórios: season_id, team_id, final_position, seed, elimination_round' 
        });
        return;
      }

      if (standing.final_position < 0 || standing.final_position > 30) {
        res.status(400).json({ 
          success: false, 
          message: `final_position deve estar entre 0 e 30, recebido: ${standing.final_position} para time ${standing.team_id}` 
        });
        return;
      }

      if (standing.seed < 0 || standing.seed > 15) {
        res.status(400).json({ 
          success: false, 
          message: `seed deve estar entre 0 e 15, recebido: ${standing.seed} para time ${standing.team_id}` 
        });
        return;
      }

      if (standing.elimination_round < 0 || standing.elimination_round > 5) {
        res.status(400).json({ 
          success: false, 
          message: 'elimination_round deve estar entre 0 e 5' 
        });
        return;
      }
    }

    const result = await TeamStandingService.upsertManyStandings(standings);
    res.status(200).json({ 
      success: true, 
      data: result, 
      message: `${result.length} standings processados com sucesso` 
    });
  });
} 