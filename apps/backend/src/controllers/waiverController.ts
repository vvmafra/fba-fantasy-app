import { Request, Response } from 'express';
import { WaiverService } from '../services/WaiverService.js';
import { CreateWaiverRequest, UpdateWaiverRequest } from '../types/index.js';

export class WaiverController {
  private waiverService: WaiverService;

  constructor() {
    this.waiverService = new WaiverService();
  }

  // Adicionar jogador dispensado aos waivers
  addReleasedPlayer = async (req: Request<{}, {}, CreateWaiverRequest>, res: Response) => {
    try {
      const { playerId, teamId, seasonId } = req.body;
      
      const waiver = await this.waiverService.addReleasedPlayer(
        playerId, 
        teamId, 
        seasonId
      );

      return res.status(201).json({
        success: true,
        data: waiver,
        message: 'Jogador adicionado aos waivers com sucesso'
      });
    } catch (error) {
      return res.status(500).json({ 
        error: 'Erro interno do servidor ao adicionar jogador aos waivers' 
      });
    }
  };

  // Obter todos os waivers
  getAllWaivers = async (req: Request, res: Response) => {
    try {
      const waivers = await this.waiverService.getAllWaivers();
      return res.json({
        success: true,
        data: waivers,
        message: 'Waivers obtidos com sucesso'
      });
    } catch (error) {
      return res.status(500).json({ 
        error: 'Erro interno do servidor ao obter waivers' 
      });
    }
  };

  // Obter waivers por temporada
  getWaiversBySeason = async (req: Request, res: Response) => {
    try {
      const { seasonId } = req.params;
      if (!seasonId) {
        return res.status(400).json({ error: 'seasonId é obrigatório' });
      }
      const waivers = await this.waiverService.getWaiversBySeason(parseInt(seasonId, 10));
      return res.json({
        success: true,
        data: waivers,
        message: 'Waivers da temporada obtidos com sucesso'
      });
    } catch (error) {
      return res.status(500).json({ 
        error: 'Erro interno do servidor ao obter waivers por temporada' 
      });
    }
  };

  // Obter waivers por time
  getWaiversByTeam = async (req: Request, res: Response) => {
    try {
      const { teamId } = req.params;
      if (!teamId) {
        return res.status(400).json({ error: 'teamId é obrigatório' });
      }
      const waivers = await this.waiverService.getWaiversByTeam(parseInt(teamId));
      return res.json({
        success: true,
        data: waivers,
        message: 'Waivers do time obtidos com sucesso'
      });
    } catch (error) {
      return res.status(500).json({ 
        error: 'Erro interno do servidor ao obter waivers por time' 
      });
    }
  };

  // Obter waiver específico
  getWaiverById = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      if (!id) {
        return res.status(400).json({ error: 'id é obrigatório' });
      }
      
      const waiver = await this.waiverService.getWaiverById(parseInt(id, 10));
      
      if (!waiver) {
        return res.status(404).json({ error: 'Waiver não encontrado' });
      }

      return res.json({
        success: true,
        data: waiver,
        message: 'Waiver obtido com sucesso'
      });
    } catch (error) {
      return res.status(500).json({ 
        error: 'Erro interno do servidor ao obter waiver' 
      });
    }
  };

  // Contar waivers por time e temporada
  countWaiversByTeamAndSeason = async (req: Request, res: Response) => {
    try {
      const { teamId, seasonId } = req.params;
      if (!teamId || !seasonId) {
        return res.status(400).json({ error: 'teamId e seasonId são obrigatórios' });
      }
      
      const count = await this.waiverService.countWaiversByTeamAndSeason(
        parseInt(teamId, 10), 
        parseInt(seasonId, 10)
      );

      return res.json({
        success: true,
        data: { count },
        message: 'Contagem de waivers obtida com sucesso'
      });
    } catch (error) {
      return res.status(500).json({ 
        error: 'Erro interno do servidor ao contar waivers' 
      });
    }
  };

  // Atualizar waiver
  updateWaiver = async (req: Request<{ id: string }, {}, UpdateWaiverRequest>, res: Response) => {
    try {
      const { id } = req.params;
      const updateData = req.body;
      
      const waiver = await this.waiverService.updateWaiver(parseInt(id), updateData);
      
      if (!waiver) {
        return res.status(404).json({ error: 'Waiver não encontrado' });
      }

      return res.json({
        success: true,
        data: waiver,
        message: 'Waiver atualizado com sucesso'
      });
    } catch (error) {
      return res.status(500).json({ 
        error: 'Erro interno do servidor ao atualizar waiver' 
      });
    }
  };

  // Deletar waiver
  deleteWaiver = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      if (!id) {
        return res.status(400).json({ error: 'id é obrigatório' });
      }

      const success = await this.waiverService.deleteWaiver(parseInt(id));
      
      if (!success) {
        return res.status(404).json({ error: 'Waiver não encontrado' });
      }

      return res.json({ 
        success: true,
        message: 'Waiver deletado com sucesso' 
      });
    } catch (error) {
      return res.status(500).json({ 
        error: 'Erro interno do servidor ao deletar waiver' 
      });
    }
  };
}
