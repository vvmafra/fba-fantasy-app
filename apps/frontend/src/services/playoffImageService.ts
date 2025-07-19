import { apiRequest } from '@/lib/api';

export interface PlayoffImage {
  id: number;
  season_id: number;
  image_url: string;
  title: string;
  description?: string;
  uploaded_by: number;
  created_at: string;
  updated_at: string;
  season_number?: number;
  year?: string;
  uploader_name?: string;
}

export interface CreatePlayoffImageData {
  season_id: number;
  image_url: string;
  title: string;
  description?: string;
}

export interface UpdatePlayoffImageData {
  image_url?: string;
  title?: string;
  description?: string;
}

// Serviço de Playoff Images
export const playoffImageService = {
  // Buscar todas as imagens de playoffs
  getAllPlayoffImages: () =>
    apiRequest.get<PlayoffImage[]>('/playoff-images'),

  // Buscar imagem de playoffs por temporada
  getPlayoffImageBySeason: (seasonId: number) =>
    apiRequest.get<PlayoffImage>(`/playoff-images/season/${seasonId}`),

  // Buscar imagem de playoffs por ID
  getPlayoffImageById: (id: number) =>
    apiRequest.get<PlayoffImage>(`/playoff-images/${id}`),

  // Criar nova imagem de playoffs
  createPlayoffImage: (data: CreatePlayoffImageData) =>
    apiRequest.post<PlayoffImage>('/playoff-images', data),

  // Atualizar imagem de playoffs
  updatePlayoffImage: (id: number, data: UpdatePlayoffImageData) =>
    apiRequest.put<PlayoffImage>(`/playoff-images/${id}`, data),

  // Deletar imagem de playoffs
  deletePlayoffImage: (id: number) =>
    apiRequest.delete<void>(`/playoff-images/${id}`),

  // Limpar imagens inválidas
  cleanupInvalidImages: () =>
    apiRequest.delete<{ deletedCount: number }>('/playoff-images/cleanup/invalid'),
}; 