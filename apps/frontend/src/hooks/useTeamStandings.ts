import { useState, useEffect, useCallback } from 'react';
import { teamStandingService, TeamStandingWithDetails } from '@/services/teamStandingService';
import { useToast } from '@/hooks/use-toast';

export const useTeamStandings = () => {
  const [standings, setStandings] = useState<TeamStandingWithDetails[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchAllStandings = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await teamStandingService.getAllStandings();
      setStandings(response.data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao carregar standings';
      setError(errorMessage);
      toast({
        title: 'Erro',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchStandingsBySeason = useCallback(async (seasonId: number) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await teamStandingService.getStandingsBySeason(seasonId);
      const standingsData = response.data || [];
      setStandings(standingsData);
    } catch (err) {
      console.error('Erro ao carregar standings:', err);
      const errorMessage = err instanceof Error ? err.message : 'Erro ao carregar standings da temporada';
      setError(errorMessage);
      toast({
        title: 'Erro',
        description: errorMessage,
        variant: 'destructive',
      });
      setStandings([]); // Garantir que standings seja um array vazio em caso de erro
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const fetchStandingsByTeam = async (teamId: number) => {
    setLoading(true);
    setError(null);
    try {
      const response = await teamStandingService.getStandingsByTeam(teamId);
      setStandings(response.data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao carregar standings do time';
      setError(errorMessage);
      toast({
        title: 'Erro',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const createStanding = async (data: {
    season_id: number;
    team_id: number;
    final_position: number;
    seed: number;
    elimination_round: number;
  }) => {
    try {
      const response = await teamStandingService.createStanding(data);
      toast({
        title: 'Sucesso',
        description: 'Standing criado com sucesso',
      });
      return response.data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao criar standing';
      toast({
        title: 'Erro',
        description: errorMessage,
        variant: 'destructive',
      });
      throw err;
    }
  };

  const updateStanding = async (data: {
    id: number;
    season_id?: number;
    team_id?: number;
    final_position?: number;
    seed?: number;
    elimination_round?: number;
  }) => {
    try {
      const response = await teamStandingService.updateStanding(data);
      toast({
        title: 'Sucesso',
        description: 'Standing atualizado com sucesso',
      });
      return response.data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao atualizar standing';
      toast({
        title: 'Erro',
        description: errorMessage,
        variant: 'destructive',
      });
      throw err;
    }
  };

  const deleteStanding = async (id: number) => {
    try {
      await teamStandingService.deleteStanding(id);
      toast({
        title: 'Sucesso',
        description: 'Standing deletado com sucesso',
      });
      // Recarregar a lista
      await fetchAllStandings();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao deletar standing';
      toast({
        title: 'Erro',
        description: errorMessage,
        variant: 'destructive',
      });
      throw err;
    }
  };

  const upsertManyStandings = async (standings: any[]) => {
    try {
      const response = await teamStandingService.upsertManyStandings(standings);
      toast({
        title: 'Sucesso',
        description: `${standings.length} standings processados com sucesso`,
      });
      return response.data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao processar standings';
      toast({
        title: 'Erro',
        description: errorMessage,
        variant: 'destructive',
      });
      throw err;
    }
  };

  return {
    standings,
    loading,
    error,
    fetchAllStandings,
    fetchStandingsBySeason,
    fetchStandingsByTeam,
    createStanding,
    updateStanding,
    deleteStanding,
    upsertManyStandings,
  };
}; 