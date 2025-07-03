import { useQuery } from '@tanstack/react-query';
import { seasonService, Season } from '@/services/seasonService';

// Hook para buscar todas as temporadas
export const useSeasons = () => {
  return useQuery({
    queryKey: ['seasons'],
    queryFn: seasonService.getAllSeasons,
  });
};

// Hook para buscar temporada por ID
export const useSeason = (id: number) => {
  return useQuery({
    queryKey: ['season', id],
    queryFn: () => seasonService.getSeasonById(id),
    enabled: !!id,
  });
};

// Hook para buscar temporada ativa
export const useActiveSeason = () => {
  return useQuery({
    queryKey: ['active-season'],
    queryFn: seasonService.getActiveSeason,
  });
}; 