import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { seasonService, Season, UpdateSeasonData } from '@/services/seasonService';
import { useToast } from '@/hooks/use-toast';

// Hook para buscar todas as temporadas
export const useSeasons = () => {
  return useQuery({
    queryKey: ['seasons'],
    queryFn: seasonService.getAllSeasons,
  });
};

// Hook para buscar todas as temporadas a partir da ativa
export const useSeasonsFromActive = () => {
  return useQuery({
    queryKey: ['seasons-from-active'],
    queryFn: seasonService.getSeasonsFromActive,
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

// Hook para avançar para próxima temporada
export const useAdvanceToNextSeason = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: () => seasonService.advanceToNextSeason(),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['seasons'] });
      queryClient.invalidateQueries({ queryKey: ['active-season'] });
      toast({
        title: 'Sucesso!',
        description: `Avançou para Temporada ${data.data?.season_number} (${data.data?.year})`,
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Erro!',
        description: error?.message || 'Erro ao avançar temporada.',
        variant: 'destructive',
      });
    },
  });
};

// Hook para voltar para temporada anterior
export const useGoBackToPreviousSeason = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: () => seasonService.goBackToPreviousSeason(),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['seasons'] });
      queryClient.invalidateQueries({ queryKey: ['active-season'] });
      toast({
        title: 'Sucesso!',
        description: `Voltou para Temporada ${data.data?.season_number} (${data.data?.year})`,
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Erro!',
        description: error?.message || 'Erro ao voltar temporada.',
        variant: 'destructive',
      });
    },
  });
};

// Hook para alterar temporada ativa
export const useChangeActiveSeason = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (seasonId: number) => seasonService.changeActiveSeason(seasonId),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['seasons'] });
      queryClient.invalidateQueries({ queryKey: ['active-season'] });
      toast({
        title: 'Sucesso!',
        description: `Temporada ${data.data?.season_number} (${data.data?.year}) agora está ativa`,
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Erro!',
        description: error?.message || 'Erro ao alterar temporada ativa.',
        variant: 'destructive',
      });
    },
  });
}; 