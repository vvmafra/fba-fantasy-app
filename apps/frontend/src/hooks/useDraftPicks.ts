import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { draftPickService, DraftPick, CreateDraftPickData, UpdateDraftPickData, AddPlayerToDraftPickData, DraftPickQueryParams } from '@/services/draftPickService';
import { useToast } from '@/hooks/use-toast';

// Hook para buscar todos os draft picks
export const useDraftPicks = (params?: DraftPickQueryParams) => {
  return useQuery({
    queryKey: ['draft-picks', params],
    queryFn: () => draftPickService.getAllDraftPicks(params),
  });
};

// Hook para buscar draft pick por ID
export const useDraftPick = (id: number) => {
  return useQuery({
    queryKey: ['draft-pick', id],
    queryFn: () => draftPickService.getDraftPickById(id),
    enabled: !!id,
  });
};

// Hook para buscar draft picks por temporada
export const useDraftPicksBySeason = (seasonId: number) => {
  return useQuery({
    queryKey: ['draft-picks-season', seasonId],
    queryFn: () => draftPickService.getDraftPicksBySeason(seasonId),
    enabled: !!seasonId,
  });
};

// Hook para criar draft pick
export const useCreateDraftPick = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (data: CreateDraftPickData) => draftPickService.createDraftPick(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['draft-picks'] });
      toast({
        title: 'Sucesso!',
        description: 'Draft pick criado com sucesso.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Erro!',
        description: error?.response?.data?.message || 'Erro ao criar draft pick.',
        variant: 'destructive',
      });
    },
  });
};

// Hook para atualizar draft pick
export const useUpdateDraftPick = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateDraftPickData }) =>
      draftPickService.updateDraftPick(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['draft-picks'] });
      toast({
        title: 'Sucesso!',
        description: 'Draft pick atualizado com sucesso.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Erro!',
        description: error?.response?.data?.message || 'Erro ao atualizar draft pick.',
        variant: 'destructive',
      });
    },
  });
};

// Hook para deletar draft pick
export const useDeleteDraftPick = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (id: number) => draftPickService.deleteDraftPick(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['draft-picks'] });
      toast({
        title: 'Sucesso!',
        description: 'Draft pick deletado com sucesso.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Erro!',
        description: error?.response?.data?.message || 'Erro ao deletar draft pick.',
        variant: 'destructive',
      });
    },
  });
};



// Hook para alternar status is_added_to_2k
export const useToggleAddedTo2k = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (id: number) => draftPickService.toggleAddedTo2k(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['draft-picks'] });
      toast({
        title: 'Sucesso!',
        description: 'Status do 2K atualizado com sucesso.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Erro!',
        description: error?.response?.data?.message || 'Erro ao atualizar status do 2K.',
        variant: 'destructive',
      });
    },
  });
};

// Hook para adicionar jogador ao draft pick
export const useAddPlayerToDraftPick = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: AddPlayerToDraftPickData }) =>
      draftPickService.addPlayerToDraftPick(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['draft-picks'] });
      toast({
        title: 'Sucesso!',
        description: 'Jogador adicionado com sucesso.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Erro!',
        description: error?.response?.data?.message || 'Erro ao adicionar jogador.',
        variant: 'destructive',
      });
    },
  });
};

// Hook para buscar próximo número de pick
export const useNextPickNumber = (seasonId: number) => {
  return useQuery({
    queryKey: ['next-pick-number', seasonId],
    queryFn: () => draftPickService.getNextPickNumber(seasonId),
    enabled: !!seasonId,
  });
};

 