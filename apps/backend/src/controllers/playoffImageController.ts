import { Request, Response } from 'express';
import asyncHandler from 'express-async-handler';
import { PlayoffImageService } from '../services/playoffImageService.js';
import type { CreatePlayoffImageRequest, UpdatePlayoffImageRequest } from '../services/playoffImageService.js';

export class PlayoffImageController {
  // GET /api/v1/playoff-images - Listar todas as imagens de playoffs
  static getAllPlayoffImages = asyncHandler(async (req: Request, res: Response) => {
    const images = await PlayoffImageService.getAllPlayoffImages();
    res.status(200).json({ success: true, data: images });
  });

  // GET /api/v1/playoff-images/season/:seasonId - Buscar imagem de playoffs por temporada
  static getPlayoffImageBySeason = asyncHandler(async (req: Request, res: Response) => {
    const { seasonId } = req.params;
    if (!seasonId) {
      res.status(400).json({ success: false, message: 'ID da temporada é obrigatório' });
      return;
    }
    const image = await PlayoffImageService.getPlayoffImageBySeason(Number(seasonId));
    res.status(200).json({ success: true, data: image });
  });

  // GET /api/v1/playoff-images/:id - Buscar imagem de playoffs por ID
  static getPlayoffImageById = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    if (!id) {
      res.status(400).json({ success: false, message: 'ID é obrigatório' });
      return;
    }
    const image = await PlayoffImageService.getPlayoffImageById(Number(id));
    if (!image) {
      res.status(404).json({ success: false, message: 'Imagem de playoffs não encontrada' });
      return;
    }
    res.status(200).json({ success: true, data: image });
  });

  // POST /api/v1/playoff-images - Criar nova imagem de playoffs
  static createPlayoffImage = asyncHandler(async (req: Request, res: Response) => {
    const { season_id, image_url, title, description } = req.body;
    const uploaded_by = (req as any).user?.id;

    if (!uploaded_by) {
      res.status(401).json({ success: false, message: 'Usuário não autenticado' });
      return;
    }

    const imageData: CreatePlayoffImageRequest = {
      season_id,
      image_url,
      title,
      description,
      uploaded_by
    };

    const image = await PlayoffImageService.createPlayoffImage(imageData);
    res.status(201).json({ 
      success: true, 
      data: image, 
      message: 'Imagem de playoffs criada com sucesso' 
    });
  });

  // PUT /api/v1/playoff-images/:id - Atualizar imagem de playoffs
  static updatePlayoffImage = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { image_url, title, description } = req.body;

    if (!id) {
      res.status(400).json({ success: false, message: 'ID é obrigatório' });
      return;
    }

    const updateData: UpdatePlayoffImageRequest = {
      image_url,
      title,
      description
    };

    const image = await PlayoffImageService.updatePlayoffImage(Number(id), updateData);
    res.status(200).json({ 
      success: true, 
      data: image, 
      message: 'Imagem de playoffs atualizada com sucesso' 
    });
  });

  // DELETE /api/v1/playoff-images/:id - Deletar imagem de playoffs
  static deletePlayoffImage = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    if (!id) {
      res.status(400).json({ success: false, message: 'ID é obrigatório' });
      return;
    }

    await PlayoffImageService.deletePlayoffImage(Number(id));
    res.status(200).json({ 
      success: true, 
      message: 'Imagem de playoffs deletada com sucesso' 
    });
  });

  // DELETE /api/v1/playoff-images/cleanup/invalid - Limpar imagens com URLs inválidas
  static cleanupInvalidImages = asyncHandler(async (req: Request, res: Response) => {
    const deletedCount = await PlayoffImageService.cleanupInvalidImages();
    res.status(200).json({ 
      success: true, 
      message: `${deletedCount} imagens inválidas foram removidas`,
      deletedCount
    });
  });
} 