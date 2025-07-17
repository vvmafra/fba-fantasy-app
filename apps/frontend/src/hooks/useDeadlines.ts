import { useState, useEffect } from 'react';
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
  const [deadline, setDeadline] = useState<Deadline | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTradeDeadline = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Primeiro buscar a temporada ativa usando o seasonService
      const seasonsResponse = await seasonService.getActiveSeason();
      
      if (!seasonsResponse.success || !seasonsResponse.data) {
        setError('Temporada ativa não encontrada');
        return;
      }
      
      const activeSeasonId = seasonsResponse.data.id;
      
      // Buscar o deadline de trade da temporada ativa
      const response = await deadlineService.getDeadlineByTypeAndSeason('trade_deadline', activeSeasonId);
      
      if (response.success) {
        setDeadline(response.data);
      } else {
        setError('Deadline de trade não encontrado');
      }
    } catch (err) {
      setError('Erro ao carregar deadline de trade');
      console.error('Erro ao carregar deadline de trade:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTradeDeadline();
  }, []);

  const refreshDeadline = () => {
    fetchTradeDeadline();
  };

  return {
    deadline,
    loading,
    error,
    refreshDeadline
  };
}; 