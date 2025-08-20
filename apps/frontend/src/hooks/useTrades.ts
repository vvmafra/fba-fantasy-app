import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  tradeService, 
  Trade, 
  TradeWithDetails,
  CreateTradeRequest, 
  UpdateTradeParticipantRequest,
  TradeQueryParams,
  TradeCounts,
  TradeLimitInfo
} from '@/services/tradeService';
import { useToast } from '@/hooks/use-toast';

// Chaves para cache do React Query
export const tradeKeys = {
  all: ['trades'] as const,
  lists: () => [...tradeKeys.all, 'list'] as const,
  list: (filters: TradeQueryParams) => [...tradeKeys.lists(), filters] as const,
  details: () => [...tradeKeys.all, 'detail'] as const,
  detail: (id: number) => [...tradeKeys.details(), id] as const,
  team: (teamId: number, seasonId?: number) => [...tradeKeys.all, 'team', teamId, seasonId] as const,
  counts: (seasonId?: number) => [...tradeKeys.all, 'counts', seasonId] as const,
  executedCount: (teamId: number, seasonStart: number, seasonEnd: number) => 
    [...tradeKeys.all, 'executed-count', teamId, seasonStart, seasonEnd] as const,
  allBySeason: (seasonId?: number) => [...tradeKeys.all, 'season', seasonId] as const,
};

// Hook para buscar todas as trades
export const useTrades = (params?: TradeQueryParams) => {
  return useQuery({
    queryKey: [...tradeKeys.list(params || {}), params?.season_id],
    queryFn: () => tradeService.getAllTrades(params),
    enabled: !params?.season_id || (!!params.season_id && params.season_id > 0),
    staleTime: 2 * 60 * 1000, // 2 minutos
  });
};

// Hook para buscar trade específica
export const useTrade = (id: number) => {
  return useQuery({
    queryKey: tradeKeys.detail(id),
    queryFn: () => tradeService.getTradeById(id),
    enabled: !!id,
  });
};

// Hook para buscar trades de um time
export const useTradesByTeam = (teamId: number, seasonId?: number) => {
  return useQuery({
    queryKey: tradeKeys.team(teamId, seasonId),
    queryFn: () => tradeService.getTradesByTeam(teamId, seasonId),
    enabled: !!teamId && !!seasonId,
    staleTime: 2 * 60 * 1000, // 2 minutos
  });
};

// Hook para buscar contadores de trades
export const useTradeCounts = (seasonId?: number) => {
  return useQuery({
    queryKey: tradeKeys.counts(seasonId),
    queryFn: () => tradeService.getTradeCounts(seasonId),
    enabled: !!seasonId,
    staleTime: 5 * 60 * 1000, // 5 minutos
  });
};

// Hook para contar trades executadas de um time em um período
export const useExecutedTradesCount = (teamId: number, seasonStart: number, seasonEnd: number) => {
  return useQuery({
    queryKey: tradeKeys.executedCount(teamId, seasonStart, seasonEnd),
    queryFn: () => tradeService.countExecutedTradesByTeam(teamId, seasonStart, seasonEnd),
    enabled: !!teamId && !!seasonStart && !!seasonEnd,
    staleTime: 2 * 60 * 1000, // 2 minutos
  });
};

// Hook para verificar limites de trades de uma trade específica
export const useTradeLimits = (tradeId: number | null) => {
  return useQuery({
    queryKey: ['trades', 'limits', tradeId],
    queryFn: () => tradeService.checkTradeLimits(tradeId!),
    enabled: !!tradeId,
    staleTime: 1 * 60 * 1000, // 1 minuto
  });
};

// Hook para criar trade
export const useCreateTrade = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (data: CreateTradeRequest) => tradeService.createTrade(data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: tradeKeys.lists() });
      queryClient.invalidateQueries({ queryKey: tradeKeys.counts() });
      toast({
        title: "Sucesso!",
        description: "Trade proposta com sucesso.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro!",
        description: error.response?.data?.message || "Erro ao criar trade.",
        variant: "destructive",
      });
    },
  });
};

// Hook para responder à trade
export const useUpdateTradeResponse = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ participantId, data }: { participantId: number; data: UpdateTradeParticipantRequest }) =>
      tradeService.updateParticipantResponse(participantId, data),
    onSuccess: (data, variables) => {
      // Invalidar todas as queries relacionadas a trades
      queryClient.invalidateQueries({ queryKey: tradeKeys.lists() });
      queryClient.invalidateQueries({ queryKey: tradeKeys.counts() });
      queryClient.invalidateQueries({ queryKey: tradeKeys.detail(data.data?.trade_id || 0) });
      
      // Invalidar trades de todos os times (para garantir que todas as listas sejam atualizadas)
      queryClient.invalidateQueries({ queryKey: tradeKeys.all });
      
      const message = variables.data.response_status === 'accepted' 
        ? 'Trade aceita com sucesso!' 
        : 'Trade rejeitada com sucesso!';
      
      toast({
        title: "Sucesso!",
        description: message,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro!",
        description: error.response?.data?.message || "Erro ao responder à trade.",
        variant: "destructive",
      });
    },
  });
};

// Hook para executar trade (admin)
export const useExecuteTrade = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (tradeId: number) => tradeService.executeTrade(tradeId),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: tradeKeys.lists() });
      queryClient.invalidateQueries({ queryKey: tradeKeys.counts() });
      queryClient.invalidateQueries({ queryKey: tradeKeys.detail(data.data?.id || 0) });
      toast({
        title: "Sucesso!",
        description: "Trade executada com sucesso.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro!",
        description: error.response?.data?.message || "Erro ao executar trade.",
        variant: "destructive",
      });
    },
  });
};

// Hook para reverter trade (admin)
export const useRevertTrade = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ tradeId, revertedByUser }: { tradeId: number; revertedByUser: number }) =>
      tradeService.revertTrade(tradeId, revertedByUser),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: tradeKeys.lists() });
      queryClient.invalidateQueries({ queryKey: tradeKeys.counts() });
      queryClient.invalidateQueries({ queryKey: tradeKeys.detail(data.data?.id || 0) });
      toast({
        title: "Sucesso!",
        description: "Trade revertida com sucesso.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro!",
        description: error.response?.data?.message || "Erro ao reverter trade.",
        variant: "destructive",
      });
    },
  });
};

// Hook para atualizar campo made de uma trade (admin)
export const useUpdateTradeMade = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ tradeId, made }: { tradeId: number; made: boolean }) =>
      tradeService.updateTradeMade(tradeId, made),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: tradeKeys.lists() });
      queryClient.invalidateQueries({ queryKey: tradeKeys.detail(data.data?.id || 0) });
      toast({
        title: "Sucesso!",
        description: `Trade ${data.data?.made ? 'marcada' : 'desmarcada'} como feita com sucesso.`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro!",
        description: error.response?.data?.message || "Erro ao atualizar status da trade.",
        variant: "destructive",
      });
    },
  });
}; 