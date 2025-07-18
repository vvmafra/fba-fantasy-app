import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { seasonAwardsService, CreateSeasonAwardsData } from '@/services/seasonAwardsService';

// Hook para buscar todas as premiações
export const useSeasonAwards = () => {
  return useQuery({
    queryKey: ['season-awards'],
    queryFn: () => seasonAwardsService.getAllSeasonAwards(),
  });
};

// Hook para buscar premiação por temporada
export const useSeasonAwardsBySeason = (seasonId: number) => {
  return useQuery({
    queryKey: ['season-awards', 'season', seasonId],
    queryFn: () => seasonAwardsService.getSeasonAwardsBySeason(seasonId),
    enabled: !!seasonId,
  });
};

// Hook para buscar premiação por ID
export const useSeasonAwardsById = (id: number) => {
  return useQuery({
    queryKey: ['season-awards', id],
    queryFn: () => seasonAwardsService.getSeasonAwardsById(id),
    enabled: !!id,
  });
};

// Hook para criar premiação
export const useCreateSeasonAwards = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: CreateSeasonAwardsData) => seasonAwardsService.createSeasonAwards(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['season-awards'] });
    },
  });
};

// Hook para atualizar premiação
export const useUpdateSeasonAwards = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<CreateSeasonAwardsData> }) =>
      seasonAwardsService.updateSeasonAwards(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['season-awards'] });
      queryClient.invalidateQueries({ queryKey: ['season-awards', id] });
    },
  });
};

// Hook para deletar premiação
export const useDeleteSeasonAwards = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: number) => seasonAwardsService.deleteSeasonAwards(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['season-awards'] });
    },
  });
}; 