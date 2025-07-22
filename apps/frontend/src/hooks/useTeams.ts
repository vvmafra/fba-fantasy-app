import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { teamService, Team, CreateTeamData, UpdateTeamData, TeamQueryParams } from '@/services/teamService';
import { useToast } from '@/hooks/use-toast';

// Chaves para cache do React Query
export const teamKeys = {
  all: ['teams'] as const,
  lists: () => [...teamKeys.all, 'list'] as const,
  list: (filters: TeamQueryParams) => [...teamKeys.lists(), filters] as const,
  details: () => [...teamKeys.all, 'detail'] as const,
  detail: (id: number) => [...teamKeys.details(), id] as const,
  myTeams: () => [...teamKeys.all, 'my-teams'] as const,
};

// Hook para buscar todos os times
export const useTeams = (params?: TeamQueryParams) => 
  
  {
  return useQuery({
    queryKey: teamKeys.list(params || {limit: 1000}),
    queryFn: () => teamService.getAllTeams(params),
    staleTime: 5 * 60 * 1000, // 5 minutos
  });
};

// Hook para buscar time específico
export const useTeam = (id: number) => {
  return useQuery({
    queryKey: teamKeys.detail(id),
    queryFn: () => teamService.getTeamById(id),
    enabled: !!id,
  });
};

// Hook para buscar times do usuário autenticado
export const useMyTeams = () => {
  return useQuery({
    queryKey: ['my-teams'],
    queryFn: async () => {
      try {
        const result = await teamService.getMyTeams();
        return result;
      } catch (error) {
        console.error("Erro na query useMyTeams:", error);
        throw error;
      }
    },
    staleTime: 1 * 60 * 1000, // 1 minuto
    retry: 1,
  });
};

// Hook para criar time
export const useCreateTeam = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (data: CreateTeamData) => teamService.createTeam(data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: teamKeys.lists() });
      toast({
        title: "Sucesso!",
        description: `Time ${data.data?.name} criado com sucesso.`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro!",
        description: error.response?.data?.message || "Erro ao criar time.",
        variant: "destructive",
      });
    },
  });
};

// Hook para atualizar time
export const useUpdateTeam = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateTeamData }) =>
      teamService.updateTeam(id, data),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: teamKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: teamKeys.lists() });
      toast({
        title: "Sucesso!",
        description: `Time ${data.data?.name} atualizado com sucesso.`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro!",
        description: error.response?.data?.message || "Erro ao atualizar time.",
        variant: "destructive",
      });
    },
  });
};

// Hook para deletar time
export const useDeleteTeam = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (id: number) => teamService.deleteTeam(id),
    onSuccess: (data, id) => {
      queryClient.invalidateQueries({ queryKey: teamKeys.lists() });
      queryClient.removeQueries({ queryKey: teamKeys.detail(id) });
      toast({
        title: "Time deletado!",
        description: `Time removido com sucesso.`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro!",
        description: error.response?.data?.message || "Erro ao deletar time.",
        variant: "destructive",
      });
    },
  });
};
