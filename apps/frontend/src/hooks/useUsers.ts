import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { userService, User, CreateUserData, UpdateUserData, UserQueryParams } from '@/services/userService';
import { useToast } from '@/hooks/use-toast';

// Chaves para cache do React Query
export const userKeys = {
  all: ['users'] as const,
  lists: () => [...userKeys.all, 'list'] as const,
  list: (filters: UserQueryParams) => [...userKeys.lists(), filters] as const,
  details: () => [...userKeys.all, 'detail'] as const,
  detail: (id: number) => [...userKeys.details(), id] as const,
};

// Hook para buscar todos os usuários
export const useUsers = (params?: UserQueryParams) => {
  return useQuery({
    queryKey: userKeys.list(params || {}),
    queryFn: () => userService.getAllUsers(params),
    staleTime: 5 * 60 * 1000, // 5 minutos
  });
};

// Hook para buscar usuário por ID
export const useUser = (id: number) => {
  return useQuery({
    queryKey: userKeys.detail(id),
    queryFn: () => userService.getUserById(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000, // 5 minutos
  });
};

// Hook para criar usuário
export const useCreateUser = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (data: CreateUserData) => userService.createUser(data),
    onSuccess: (response) => {
      toast({
        title: 'Sucesso!',
        description: 'Usuário criado com sucesso.',
      });
      // Invalidar cache de usuários
      queryClient.invalidateQueries({ queryKey: userKeys.lists() });
    },
    onError: (error: any) => {
      toast({
        title: 'Erro!',
        description: error?.message || 'Erro ao criar usuário.',
        variant: 'destructive',
      });
    },
  });
};

// Hook para atualizar usuário
export const useUpdateUser = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateUserData }) =>
      userService.updateUser(id, data),
    onSuccess: (response, { id }) => {
      toast({
        title: 'Sucesso!',
        description: 'Usuário atualizado com sucesso.',
      });
      // Invalidar cache específico e lista
      queryClient.invalidateQueries({ queryKey: userKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: userKeys.lists() });
    },
    onError: (error: any) => {
      toast({
        title: 'Erro!',
        description: error?.message || 'Erro ao atualizar usuário.',
        variant: 'destructive',
      });
    },
  });
};

// Hook para deletar usuário
export const useDeleteUser = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (id: number) => userService.deleteUser(id),
    onSuccess: () => {
      toast({
        title: 'Sucesso!',
        description: 'Usuário deletado com sucesso.',
      });
      // Invalidar cache de usuários
      queryClient.invalidateQueries({ queryKey: userKeys.lists() });
    },
    onError: (error: any) => {
      toast({
        title: 'Erro!',
        description: error?.message || 'Erro ao deletar usuário.',
        variant: 'destructive',
      });
    },
  });
}; 