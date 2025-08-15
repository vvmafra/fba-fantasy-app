import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  getAllPickSwaps, 
  getPickSwapById, 
  createPickSwap, 
  deletePickSwap, 
  getTeamPickSwaps,
  type CreatePickSwapRequest,
  type PickSwapWithDetails 
} from '@/services/pickSwapService';
import { useToast } from '@/hooks/use-toast';

// Hook para buscar todos os pick swaps
export function usePickSwaps() {
  return useQuery({
    queryKey: ['pick-swaps'],
    queryFn: () => getAllPickSwaps().then(res => res.data),
    staleTime: 5 * 60 * 1000, // 5 minutos
  });
}

// Hook para buscar pick swap por ID
export function usePickSwap(id: number) {
  return useQuery({
    queryKey: ['pick-swaps', id],
    queryFn: () => getPickSwapById(id).then(res => res.data),
    enabled: !!id,
    staleTime: 5 * 60 * 1000, // 5 minutos
  });
}

// Hook para buscar swaps de um time
export function useTeamPickSwaps(teamId: number) {
  return useQuery({
    queryKey: ['pick-swaps', 'team', teamId],
    queryFn: () => getTeamPickSwaps(teamId).then(res => res.data),
    enabled: !!teamId,
    staleTime: 5 * 60 * 1000, // 5 minutos
  });
}

// Hook para criar pick swap
export function useCreatePickSwap() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (data: CreatePickSwapRequest) => createPickSwap(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pick-swaps'] });
      queryClient.invalidateQueries({ queryKey: ['picks'] });
      toast({
        title: 'Sucesso!',
        description: 'Pick swap criado com sucesso.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Erro!',
        description: error.response?.data?.message || 'Erro ao criar pick swap.',
        variant: 'destructive',
      });
    },
  });
}

// Hook para deletar pick swap
export function useDeletePickSwap() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (id: number) => deletePickSwap(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pick-swaps'] });
      queryClient.invalidateQueries({ queryKey: ['picks'] });
      toast({
        title: 'Sucesso!',
        description: 'Pick swap deletado com sucesso.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Erro!',
        description: error.response?.data?.message || 'Erro ao deletar pick swap.',
        variant: 'destructive',
      });
    },
  });
} 