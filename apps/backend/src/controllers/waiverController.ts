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

      res.status(201).json({
        success: true,
        data: waiver,
        message: 'Jogador adicionado aos waivers com sucesso'
      });
    } catch (error) {
      console.error('Erro ao adicionar jogador aos waivers:', error);
      res.status(500).json({ 
        error: 'Erro interno do servidor ao adicionar jogador aos waivers' 
      });
    }
  };

  // Obter todos os waivers
  getAllWaivers = async (req: Request, res: Response) => {
    try {
      const waivers = await this.waiverService.getAllWaivers();
      res.json({
        success: true,
        data: waivers,
        message: 'Waivers obtidos com sucesso'
      });
    } catch (error) {
      console.error('Erro ao obter waivers:', error);
      res.status(500).json({ 
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
      res.json({
        success: true,
        data: waivers,
        message: 'Waivers da temporada obtidos com sucesso'
      });
    } catch (error) {
      console.error('Erro ao obter waivers por temporada:', error);
      res.status(500).json({ 
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
      res.json({
        success: true,
        data: waivers,
        message: 'Waivers do time obtidos com sucesso'
      });
    } catch (error) {
      console.error('Erro ao obter waivers por time:', error);
      res.status(500).json({ 
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
      const waiver = await this.waiverService.getWaiverById(parseInt(id));
      
      if (!waiver) {
        return res.status(404).json({ error: 'Waiver não encontrado' });
      }

      res.json({
        success: true,
        data: waiver,
        message: 'Waiver obtido com sucesso'
      });
    } catch (error) {
      console.error('Erro ao obter waiver:', error);
      res.status(500).json({ 
        error: 'Erro interno do servidor ao obter waiver' 
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

      res.json({
        success: true,
        data: waiver,
        message: 'Waiver atualizado com sucesso'
      });
    } catch (error) {
      console.error('Erro ao atualizar waiver:', error);
      res.status(500).json({ 
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

      res.json({ 
        success: true,
        message: 'Waiver deletado com sucesso' 
      });
    } catch (error) {
      console.error('Erro ao deletar waiver:', error);
      res.status(500).json({ 
        error: 'Erro interno do servidor ao deletar waiver' 
      });
    }
  };
}
