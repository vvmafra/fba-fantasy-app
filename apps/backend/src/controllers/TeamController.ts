import { Request, Response } from 'express';
import asyncHandler from 'express-async-handler';
import { TeamService } from '../services/TeamService.js';
import type { CreateTeamRequest, UpdateTeamRequest } from '../types';

export class TeamController {
  // GET /api/v1/teams - Listar todos os times
  static getAllTeams = asyncHandler(async (req: Request, res: Response) => {
    const teams = await TeamService.getAllTeams();
    res.status(200).json({ success: true, data: teams });
  });

  // GET /api/v1/teams/ranking - Listar times com Power Ranking (CAP)
  static getTeamsWithCAP = asyncHandler(async (req: Request, res: Response) => {
    const teams = await TeamService.getAllTeamsWithCAP();
    res.status(200).json({ success: true, data: teams });
  });

  // GET /api/v1/teams/:id - Buscar time por ID
  static getTeamById = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    if (!id) {
      res.status(400).json({ success: false, message: 'ID é obrigatório' });
      return;
    }
    const team = await TeamService.getTeamById(Number(id));
    res.status(200).json({ success: true, data: team });
  });

  // GET /api/v1/teams/my-teams - Buscar times do usuário autenticado
  static getMyTeams = asyncHandler(async (req: Request, res: Response) => {
    const user = (req as any).user;
    if (!user) {
      res.status(401).json({ success: false, message: 'Usuário não autenticado' });
      return;
    }
    
    const ownerId = Number(user.id);
    const teams = await TeamService.getTeamsByOwnerId(ownerId);
    res.status(200).json({ success: true, data: teams });
  });

  // POST /api/v1/teams - Criar novo time
  static createTeam = asyncHandler(async (req: Request, res: Response) => {
    const teamData: CreateTeamRequest = req.body;
    const team = await TeamService.createTeam(teamData);
    res.status(201).json({ success: true, data: team, message: 'Time criado com sucesso' });
  });

  // PUT /api/v1/teams/:id - Atualizar time
  static updateTeam = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const user = (req as any).user;
    
    if (!id) {
      res.status(400).json({ success: false, message: 'ID é obrigatório' });
      return;
    }
    
    const teamData: UpdateTeamRequest = req.body;
    const isAdmin = user.role === 'admin';
    
    const team = await TeamService.updateTeam(Number(id), teamData);
    
    const message = isAdmin 
      ? 'Time atualizado com sucesso por administrador'
      : 'Ordem dos players atualizada com sucesso';
    
    res.status(200).json({ 
      success: true, 
      data: team, 
      message,
      updatedBy: {
        id: user.id,
        email: user.email,
        role: user.role
      }
    });
  });

  // DELETE /api/v1/teams/:id - Deletar time
  static deleteTeam = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    if (!id) {
      res.status(400).json({ success: false, message: 'ID é obrigatório' });
      return;
    }
    await TeamService.deleteTeam(Number(id));
    res.status(200).json({ success: true, message: 'Time deletado com sucesso' });
  });
} 