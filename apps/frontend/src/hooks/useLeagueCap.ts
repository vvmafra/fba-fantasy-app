import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { leagueCapService, LeagueCap, CreateLeagueCapData, UpdateLeagueCapData } from '@/services/leagueCapService';
import { useToast } from '@/hooks/use-toast';

// Hook para buscar todos os league caps
export const useLeagueCaps = () => {
  return useQuery({
    queryKey: ['league-caps'],
    queryFn: leagueCapService.getAllLeagueCaps,
  });
};

// Hook para buscar league cap ativo
export const useActiveLeagueCap = () => {
  return useQuery({
    queryKey: ['active-league-cap'],
    queryFn: leagueCapService.getActiveLeagueCap,
  });
};

// Hook para buscar CAP médio atual da liga
export const useCurrentLeagueAverageCap = () => {
  return useQuery({
    queryKey: ['current-league-average-cap'],
    queryFn: leagueCapService.getCurrentLeagueAverageCap,
  });
};

// Hook para buscar league cap por ID
export const useLeagueCap = (id: number) => {
  return useQuery({
    queryKey: ['league-cap', id],
    queryFn: () => leagueCapService.getLeagueCapById(id),
    enabled: !!id,
  });
};

// Hook para criar league cap
export const useCreateLeagueCap = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (data: CreateLeagueCapData) => leagueCapService.createLeagueCap(data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['league-caps'] });
      queryClient.invalidateQueries({ queryKey: ['active-league-cap'] });
      toast({
        title: 'Sucesso!',
        description: `League cap criado com sucesso (Min: ${data.data?.min_cap}, Max: ${data.data?.max_cap})`,
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Erro!',
        description: error?.message || 'Erro ao criar league cap.',
        variant: 'destructive',
      });
    },
  });
};

// Hook para atualizar league cap
export const useUpdateLeagueCap = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateLeagueCapData }) =>
      leagueCapService.updateLeagueCap(id, data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['league-caps'] });
      queryClient.invalidateQueries({ queryKey: ['active-league-cap'] });
      queryClient.invalidateQueries({ queryKey: ['league-cap', data.data?.id] });
      toast({
        title: 'Sucesso!',
        description: 'League cap atualizado com sucesso',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Erro!',
        description: error?.message || 'Erro ao atualizar league cap.',
        variant: 'destructive',
      });
    },
  });
};

// Hook para deletar league cap
export const useDeleteLeagueCap = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (id: number) => leagueCapService.deleteLeagueCap(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['league-caps'] });
      queryClient.invalidateQueries({ queryKey: ['active-league-cap'] });
      toast({
        title: 'Sucesso!',
        description: 'League cap deletado com sucesso',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Erro!',
        description: error?.message || 'Erro ao deletar league cap.',
        variant: 'destructive',
      });
    },
  });
};

// Hook para buscar último CAP (para calcular sugestão)
export const useLastLeagueCap = () => {
  return useQuery({
    queryKey: ['last-league-cap'],
    queryFn: leagueCapService.getLastLeagueCap,
  });
}; 