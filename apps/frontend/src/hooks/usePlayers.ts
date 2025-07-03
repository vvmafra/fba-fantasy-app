import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { playerService, Player, CreatePlayerData, UpdatePlayerData, PlayerQueryParams, TransferPlayerData, BatchUpdateData } from '@/services/playerService';
import { useToast } from '@/hooks/use-toast';

// Chaves para cache do React Query
export const playerKeys = {
  all: ['players'] as const,
  lists: () => [...playerKeys.all, 'list'] as const,
  list: (filters: PlayerQueryParams) => [...playerKeys.lists(), filters] as const,
  details: () => [...playerKeys.all, 'detail'] as const,
  detail: (id: number) => [...playerKeys.details(), id] as const,
  freeAgents: () => [...playerKeys.all, 'free-agents'] as const,
  byTeam: (teamId: number) => [...playerKeys.all, 'team', teamId] as const,
  byPosition: (position: string) => [...playerKeys.all, 'position', position] as const,
};

// Hook para buscar todos os players
export const usePlayers = (params?: PlayerQueryParams) => {
  return useQuery({
    queryKey: playerKeys.list(params || {}),
    queryFn: () => playerService.getAllPlayers(params),
    staleTime: 5 * 60 * 1000, // 5 minutos
  });
};

// Hook para buscar player específico
export const usePlayer = (id: number) => {
  return useQuery({
    queryKey: playerKeys.detail(id),
    queryFn: () => playerService.getPlayerById(id),
    enabled: !!id,
  });
};

// Hook para buscar free agents
// export const useFreeAgents = () => {
//   return useQuery({
//     queryKey: playerKeys.freeAgents(),
//     queryFn: () => playerService.getFreeAgents(),
//     staleTime: 1 * 60 * 1000, // 1 minuto
//   });
// };

// Hook para buscar players por time
export const usePlayersByTeam = (teamId: number) => {
  return useQuery({
    queryKey: playerKeys.byTeam(teamId),
    queryFn: () => playerService.getPlayersByTeam(teamId),
    enabled: !!teamId,
    staleTime: 3 * 60 * 1000, // 3 minutos
  });
};

// Hook para buscar players por posição
// export const usePlayersByPosition = (position: string) => {
//   return useQuery({
//     queryKey: playerKeys.byPosition(position),
//     queryFn: () => playerService.getPlayersByPosition(position),
//     enabled: !!position,
//   });
// };

// Hook para criar player
export const useCreatePlayer = (teamId?: number) => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (data: CreatePlayerData) => playerService.createPlayer(data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: playerKeys.lists() });
      // queryClient.invalidateQueries({ queryKey: playerKeys.freeAgents() });
      
      // Se temos um teamId, invalida o cache da lista do time
      if (teamId) {
        queryClient.invalidateQueries({ queryKey: playerKeys.byTeam(teamId) });
      }
      
      toast({
        title: "Sucesso!",
        description: `Jogador ${data.data?.name} criado com sucesso.`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro!",
        description: error.response?.data?.message || "Erro ao criar jogador.",
        variant: "destructive",
      });
    },
  });
};

// Hook para atualizar player
export const useUpdatePlayer = (teamId?: number) => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdatePlayerData }) =>
      playerService.updatePlayer(id, data),
    onSuccess: (data, variables) => {
      // Atualiza o cache imediatamente para melhor UX
      queryClient.setQueryData(playerKeys.detail(variables.id), data);
      
      // Se temos um teamId, atualiza o cache da lista do time
      if (teamId && data.data) {
        queryClient.setQueryData(playerKeys.byTeam(teamId), (oldData: any) => {
          if (!oldData?.data) return oldData;
          
          return {
            ...oldData,
            data: oldData.data.map((player: Player) => 
              player.id === variables.id ? { ...player, ...data.data } : player
            )
          };
        });
      }
      
      // Invalida queries para garantir sincronização
      queryClient.invalidateQueries({ queryKey: playerKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: playerKeys.lists() });
      queryClient.invalidateQueries({ queryKey: playerKeys.all });
      
      if (teamId) {
        queryClient.invalidateQueries({ queryKey: playerKeys.byTeam(teamId) });
      }
      
      toast({
        title: "Sucesso!",
        description: `Player ${data.data?.name} atualizado com sucesso.`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro!",
        description: error.response?.data?.message || "Erro ao atualizar player.",
        variant: "destructive",
      });
    },
  });
};

// Hook para transferir player
// export const useTransferPlayer = () => {
//   const queryClient = useQueryClient();
//   const { toast } = useToast();

//   return useMutation({
//     mutationFn: ({ id, data }: { id: number; data: TransferPlayerData }) =>
//       playerService.transferPlayer(id, data),
//     onSuccess: (data, variables) => {
//       queryClient.invalidateQueries({ queryKey: playerKeys.detail(variables.id) });
//       queryClient.invalidateQueries({ queryKey: playerKeys.lists() });
//       queryClient.invalidateQueries({ queryKey: playerKeys.freeAgents() });
//       toast({
//         title: "Transferência realizada!",
//         description: `Player transferido com sucesso.`,
//       });
//     },
//     onError: (error: any) => {
//       toast({
//         title: "Erro!",
//         description: error.response?.data?.message || "Erro ao transferir player.",
//         variant: "destructive",
//       });
//     },
//   });
// };

// Hook para liberar player
export const useReleasePlayer = (teamId: number) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (playerId: number) => playerService.releasePlayer(playerId),
    onSuccess: () => {
      // Invalida a lista de jogadores do time
      queryClient.invalidateQueries({ queryKey: playerKeys.byTeam(teamId) });
      queryClient.invalidateQueries({ queryKey: ['team', teamId] });
    },
  });
};

// Hook para deletar player
export const useDeletePlayer = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (id: number) => playerService.deletePlayer(id),
    onSuccess: (data, id) => {
      queryClient.invalidateQueries({ queryKey: playerKeys.lists() });
      // queryClient.invalidateQueries({ queryKey: playerKeys.freeAgents() });
      queryClient.removeQueries({ queryKey: playerKeys.detail(id) });
      toast({
        title: "Player deletado!",
        description: `Player removido com sucesso.`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro!",
        description: error.response?.data?.message || "Erro ao deletar player.",
        variant: "destructive",
      });
    },
  });
};

// Hook para atualização em lote
// export const useBatchUpdatePlayers = () => {
//   const queryClient = useQueryClient();
//   const { toast } = useToast();

//   return useMutation({
//     mutationFn: (data: BatchUpdateData) => playerService.batchUpdatePlayers(data),
//     onSuccess: (data) => {
//       queryClient.invalidateQueries({ queryKey: playerKeys.lists() });
//       toast({
//         title: "Atualização em lote!",
//         description: `${data.data?.length || 0} players atualizados com sucesso.`,
//       });
//     },
//     onError: (error: any) => {
//       toast({
//         title: "Erro!",
//         description: error.response?.data?.message || "Erro na atualização em lote.",
//         variant: "destructive",
//       });
//     },
//   });
// };