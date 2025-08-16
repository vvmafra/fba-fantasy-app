import { useState, useCallback } from 'react';
import { waiverService, Waiver } from '../services/waiverService';
import { useToast } from './use-toast';

export const useWaivers = () => {
  const [waivers, setWaivers] = useState<Waiver[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  
  // Garantir que waivers seja sempre um array
  const safeWaivers = waivers || [];

  // Adicionar jogador dispensado aos waivers
  const addReleasedPlayer = useCallback(async (
    playerId: number, 
    teamId: number, 
    seasonId: number
  ) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await waiverService.addReleasedPlayer({ playerId, teamId, seasonId });
      const newWaiver = response.data;
      
      setWaivers(prev => [newWaiver, ...prev]);
      
      toast({
        title: "Jogador adicionado aos waivers",
        description: "O jogador foi colocado na lista de waivers com sucesso.",
      });
      
      return newWaiver;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao adicionar jogador aos waivers';
      setError(errorMessage);
      
      toast({
        title: "Erro",
        description: errorMessage,
        variant: "destructive",
      });
      
      throw err;
    } finally {
      setLoading(false);
    }
  }, [toast]);

  // Obter todos os waivers
  const fetchAllWaivers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await waiverService.getAllWaivers();
      const data = response.data || [];
      setWaivers(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao buscar waivers';
      setError(errorMessage);
      
      toast({
        title: "Erro",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  // Obter waivers por temporada
  const fetchWaiversBySeason = useCallback(async (seasonId: number) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await waiverService.getWaiversBySeason(seasonId);
      const data = response.data || [];
      setWaivers(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao buscar waivers da temporada';
      setError(errorMessage);
      
      toast({
        title: "Erro",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  // Obter waivers por time
  const fetchWaiversByTeam = useCallback(async (teamId: number) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await waiverService.getWaiversByTeam(teamId);
      const data = response.data || [];
      setWaivers(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao buscar waivers do time';
      setError(errorMessage);
      
      toast({
        title: "Erro",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  // Atualizar waiver
  const updateWaiver = useCallback(async (id: number, updateData: Partial<Waiver>) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await waiverService.updateWaiver(id, updateData);
      const updatedWaiver = response.data;
      
      setWaivers(prev => prev.map(waiver => 
        waiver.id === id ? updatedWaiver : waiver
      ));
      
      toast({
        title: "Waiver atualizado",
        description: "O waiver foi atualizado com sucesso.",
      });
      
      return updatedWaiver;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao atualizar waiver';
      setError(errorMessage);
      
      toast({
        title: "Erro",
        description: errorMessage,
        variant: "destructive",
      });
      
      throw err;
    } finally {
      setLoading(false);
    }
  }, [toast]);

  // Deletar waiver
  const deleteWaiver = useCallback(async (id: number) => {
    try {
      setLoading(true);
      setError(null);
      
      await waiverService.deleteWaiver(id);
      
      setWaivers(prev => prev.filter(waiver => waiver.id !== id));
      
      toast({
        title: "Waiver deletado",
        description: "O waiver foi deletado com sucesso.",
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao deletar waiver';
      setError(errorMessage);
      
      toast({
        title: "Erro",
        description: errorMessage,
        variant: "destructive",
      });
      
      throw err;
    } finally {
      setLoading(false);
    }
  }, [toast]);

  // Limpar erro
  const clearError = useCallback(() => {
    setError(null);
  }, []);


  
  return {
    waivers: safeWaivers,
    loading,
    error,
    addReleasedPlayer,
    fetchAllWaivers,
    fetchWaiversBySeason,
    fetchWaiversByTeam,
    updateWaiver,
    deleteWaiver,
    clearError,
  };
};
