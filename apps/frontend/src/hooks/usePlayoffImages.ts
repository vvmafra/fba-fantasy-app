import { useQuery } from '@tanstack/react-query';
import { playoffImageService, PlayoffImage } from '@/services/playoffImageService';

// Hook para buscar todas as imagens de playoffs
export const usePlayoffImages = () => {
  return useQuery({
    queryKey: ['playoff-images'],
    queryFn: () => playoffImageService.getAllPlayoffImages(),
  });
};

// Hook para buscar imagem de playoffs por temporada
export const usePlayoffImageBySeason = (seasonId: number) => {
  return useQuery({
    queryKey: ['playoff-images', 'season', seasonId],
    queryFn: () => playoffImageService.getPlayoffImageBySeason(seasonId),
    enabled: !!seasonId,
  });
};

// Hook para buscar imagem de playoffs por ID
export const usePlayoffImageById = (id: number) => {
  return useQuery({
    queryKey: ['playoff-images', id],
    queryFn: () => playoffImageService.getPlayoffImageById(id),
    enabled: !!id,
  });
}; 