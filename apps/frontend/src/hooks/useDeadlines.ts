import { useState, useEffect } from 'react';
import { deadlineService, Deadline } from '@/services/deadlineService';

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