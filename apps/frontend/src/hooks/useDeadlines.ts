import { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { deadlineService, Deadline } from '@/services/deadlineService';
import { seasonService } from '@/services/seasonService';

export const useDeadlines = (seasonId?: number) => {
  const [deadlines, setDeadlines] = useState<Deadline[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDeadlines = async () => {
    try {
      setLoading(true);
      setError(null);
      
      let response;
      if (seasonId) {
        response = await deadlineService.getDeadlinesBySeason(seasonId);
      } else {
        response = await deadlineService.getUpcomingDeadlines();
      }
      
      if (response.success) {
        setDeadlines(response.data);
      } else {
        setError('Erro ao carregar deadlines');
      }
    } catch (err) {
      setError('Erro ao carregar deadlines');
      console.error('Erro ao carregar deadlines:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDeadlines();
  }, [seasonId]);

  const refreshDeadlines = () => {
    fetchDeadlines();
  };

  return {
    deadlines,
    loading,
    error,
    refreshDeadlines
  };
};

export const useAllDeadlines = () => {
  const [deadlines, setDeadlines] = useState<Deadline[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAllDeadlines = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await deadlineService.getAllDeadlines();
      
      if (response.success) {
        setDeadlines(response.data);
      } else {
        setError('Erro ao carregar deadlines');
      }
    } catch (err) {
      setError('Erro ao carregar deadlines');
      console.error('Erro ao carregar deadlines:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllDeadlines();
  }, []);

  const refreshDeadlines = () => {
    fetchAllDeadlines();
  };

  return {
    deadlines,
    loading,
    error,
    refreshDeadlines
  };
};

// Hook para buscar deadline de trade da temporada ativa
export const useTradeDeadline = () => {
  return useQuery({
    queryKey: ['trade-deadline'],
    queryFn: async () => {
      // Primeiro buscar a temporada ativa usando o seasonService
      const seasonsResponse = await seasonService.getActiveSeason();
      
      if (!seasonsResponse.success || !seasonsResponse.data) {
        throw new Error('Temporada ativa não encontrada');
      }
      
      const activeSeasonId = seasonsResponse.data.id;
      
      // Buscar o deadline de trade da temporada ativa
      const response = await deadlineService.getDeadlineByTypeAndSeason('trade_deadline', activeSeasonId);
      
      if (!response.success) {
        throw new Error('Deadline de trade não encontrado');
      }
      
      return response.data;
    },
    staleTime: 1 * 60 * 1000, // 1 minuto - dados ficam "frescos" por 1 min
    gcTime: 5 * 60 * 1000, // 5 minutos - dados ficam em cache por 5 min
    refetchInterval: 2 * 60 * 1000, // Refetch a cada 2 minutos
    refetchOnWindowFocus: true, // Refetch quando a janela ganha foco
    refetchOnMount: true, // Sempre refetch ao montar o componente
  });
}; 

// Hook para invalidar cache do deadline (útil para admin)
export const useInvalidateDeadlineCache = () => {
  const queryClient = useQueryClient();
  
  const invalidateCache = () => {
    queryClient.invalidateQueries({ queryKey: ['trade-deadline'] });
  };
  
  return { invalidateCache };
}; 