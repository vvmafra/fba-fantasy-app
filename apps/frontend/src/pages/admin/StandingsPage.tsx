import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import { useTeamStandings } from '@/hooks/useTeamStandings';
import { useSeasons, useActiveSeason } from '@/hooks/useSeasons';
import { useTeams } from '@/hooks/useTeams';
import { useToast } from '@/hooks/use-toast';
import { ChevronUp, ChevronDown, Save, RefreshCw } from 'lucide-react';
import { TeamStandingWithDetails } from '@/services/teamStandingService';

const StandingsPage = () => {
  const { isAdmin } = useAuth();
  
  // Estados
  const [selectedSeason, setSelectedSeason] = useState<number | undefined>(undefined);
  const [sortColumn, setSortColumn] = useState<string>('team_name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [standingsData, setStandingsData] = useState<TeamStandingWithDetails[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [hasInitialized, setHasInitialized] = useState(false);

  // Chave para localStorage
  const getLocalStorageKey = (seasonId: number) => `standings_draft_${seasonId}`;

  // Funções para localStorage
  const saveToLocalStorage = (data: TeamStandingWithDetails[], seasonId: number) => {
    try {
      const key = getLocalStorageKey(seasonId);
      localStorage.setItem(key, JSON.stringify({
        data,
        timestamp: Date.now()
      }));
    } catch (error) {
      console.error('Erro ao salvar no localStorage:', error);
    }
  };

  const loadFromLocalStorage = (seasonId: number): TeamStandingWithDetails[] | null => {
    try {
      const key = getLocalStorageKey(seasonId);
      const saved = localStorage.getItem(key);
      if (saved) {
        const parsed = JSON.parse(saved);
        // Verificar se os dados não são muito antigos (24 horas)
        const isRecent = Date.now() - parsed.timestamp < 24 * 60 * 60 * 1000;
        return isRecent ? parsed.data : null;
      }
      return null;
    } catch (error) {
      console.error('Erro ao carregar do localStorage:', error);
      return null;
    }
  };

  const clearLocalStorage = (seasonId: number) => {
    try {
      const key = getLocalStorageKey(seasonId);
      localStorage.removeItem(key);
    } catch (error) {
      console.error('Erro ao limpar localStorage:', error);
    }
  };

  // Função para limpar cache manualmente
  const handleClearCache = () => {
    if (selectedSeason) {
      clearLocalStorage(selectedSeason);
      setHasChanges(false);
      toast({
        title: 'Cache Limpo',
        description: 'Dados não salvos foram removidos.',
      });
    }
  };

  // Função para limpar dados corrompidos
  const handleClearCorruptedData = () => {
    if (selectedSeason) {
      clearLocalStorage(selectedSeason);
      setHasChanges(false);
      setHasInitialized(false); // Forçar reinicialização
      toast({
        title: 'Dados Corrompidos Removidos',
        description: 'Cache foi limpo e dados serão recarregados do servidor.',
      });
    }
  };

  // Função para forçar recarregamento
  const handleForceReload = () => {
    if (selectedSeason) {
      setHasInitialized(false);
      setStandingsData([]);
      fetchStandingsBySeason(selectedSeason);
      toast({
        title: 'Recarregando',
        description: 'Forçando recarregamento dos dados do servidor.',
      });
    }
  };

  // Hooks
  const { data: seasonsResponse } = useSeasons();
  const { data: teamsResponse } = useTeams();
  const { data: activeSeasonResponse } = useActiveSeason();
  const { 
    standings, 
    loading, 
    error, 
    fetchStandingsBySeason, 
    createStanding, 
    updateStanding,
    upsertManyStandings
  } = useTeamStandings();
  
  const { toast } = useToast();

  const seasons = seasonsResponse?.data || [];
  const teams = teamsResponse?.data?.sort((a, b) => a.name.localeCompare(b.name)) || [];
  const activeSeason = activeSeasonResponse?.data;

  // Definir temporada ativa como padrão
  useEffect(() => {
    if (activeSeason && selectedSeason === undefined) {
      setSelectedSeason(activeSeason.id);
    }
  }, [activeSeason, selectedSeason]);

  // Carregar standings quando a temporada mudar
  useEffect(() => {
    if (selectedSeason) {
      setHasInitialized(false); // Reset para permitir nova inicialização
      fetchStandingsBySeason(selectedSeason);
    }
  }, [selectedSeason, fetchStandingsBySeason]);

  // Inicializar dados quando standings ou teams mudarem
  useEffect(() => {
    if (teams.length > 0 && !loading && selectedSeason) {
      console.log('Inicializando dados:', { 
        teamsLength: teams.length, 
        standingsLength: standings.length, 
        hasInitialized, 
        selectedSeason 
      });
      
      // Tentar carregar dados salvos do localStorage
      const savedData = loadFromLocalStorage(selectedSeason);
      
      if (savedData && savedData.length > 0) {
        // Validar dados salvos antes de usar
        const validData = savedData.filter(standing => 
          standing.final_position >= 0 && standing.final_position <= 30 &&
          standing.seed >= 0 && standing.seed <= 15 &&
          standing.elimination_round >= 0 && standing.elimination_round <= 5
        );
        
        if (validData.length !== savedData.length) {
          console.warn('Dados corrompidos encontrados no localStorage, limpando...');
          clearLocalStorage(selectedSeason);
          toast({
            title: 'Dados Corrompidos',
            description: 'Dados inválidos foram encontrados e removidos do cache.',
            variant: 'destructive',
          });
        } else {
          // Usar dados salvos se disponíveis
          console.log('Usando dados do localStorage:', validData.length, 'standings');
          setStandingsData(validData);
          setHasChanges(true); // Indicar que há mudanças não salvas
          setHasInitialized(true);
          
          toast({
            title: 'Dados Restaurados',
            description: 'Dados não salvos foram restaurados do cache local. Lembre-se de salvar suas alterações!',
            variant: 'default',
          });
          return;
        }
      }
      
      // Criar um mapa dos standings existentes (pode estar vazio)
      const standingsMap = new Map(standings.map(s => [s.team_id, s]));
      console.log('Standings do banco:', standings.length, 'items');
      console.log('Times disponíveis:', teams.length, 'items');
      
      // Criar dados para todos os times, incluindo os que não têm standing
      const allTeamsData = teams.map(team => {
        const existingStanding = standingsMap.get(team.id);
        return {
          id: existingStanding?.id || 0,
          season_id: selectedSeason || 0,
          team_id: team.id,
          final_position: existingStanding?.final_position || 0,
          seed: existingStanding?.seed || 0,
          elimination_round: existingStanding?.elimination_round ?? 0,
          created_at: existingStanding?.created_at || '',
          team: {
            id: team.id,
            name: team.name,
            abbreviation: team.abbreviation,
            conference: team.conference || ''
          },
          season: {
            id: selectedSeason || 0,
            name: seasons.find(s => s.id === selectedSeason)?.season_number?.toString() || ''
          }
        };
      });
      
      console.log('Dados finais criados:', allTeamsData.length, 'standings');
      setStandingsData(allTeamsData);
      setHasChanges(false);
      setHasInitialized(true);
    }
  }, [standings, teams, selectedSeason, seasons, loading, hasInitialized, toast]);

  // Se não for admin, redireciona
  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  const getSortIcon = (column: string) => {
    if (sortColumn !== column) {
      return <ChevronUp className="h-4 w-4 opacity-30" />;
    }
    return sortDirection === 'asc' ? 
      <ChevronUp className="h-4 w-4" /> : 
      <ChevronDown className="h-4 w-4" />;
  };

  const sortedStandings = [...standingsData].sort((a, b) => {
    let aValue: any;
    let bValue: any;

    switch (sortColumn) {
      case 'team_name':
        aValue = a.team.name;
        bValue = b.team.name;
        break;
      case 'conference':
        aValue = a.team.conference;
        bValue = b.team.conference;
        break;
      case 'final_position':
        aValue = a.final_position;
        bValue = b.final_position;
        break;
      case 'seed':
        aValue = a.seed;
        bValue = b.seed;
        break;
      case 'elimination_round':
        aValue = a.elimination_round;
        bValue = b.elimination_round;
        break;
      default:
        return 0;
    }

    if (typeof aValue === 'string' && typeof bValue === 'string') {
      return sortDirection === 'asc' 
        ? aValue.localeCompare(bValue, 'pt-BR')
        : bValue.localeCompare(aValue, 'pt-BR');
    } else {
      return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
    }
  });

  // Verificar se uma posição já está sendo usada
  const isPositionTaken = (position: number, currentTeamId: number, type: 'final_position' | 'seed') => {
    if (position === 0) return false;
    
    return standingsData.some(standing => 
      standing[type] === position && standing.team_id !== currentTeamId
    );
  };

  // Verificar se uma seed já está sendo usada na mesma conferência
  const isSeedTakenInConference = (seed: number, currentTeamId: number, currentConference: string) => {
    if (seed === 0) return false;
    
    return standingsData.some(standing => 
      standing.seed === seed && 
      standing.team_id !== currentTeamId &&
      standing.team.conference === currentConference
    );
  };

  // Atualizar dados de um standing
  const updateStandingData = (teamId: number, field: string, value: any) => {
    setStandingsData(prev => {
      const updated = prev.map(standing => 
        standing.team_id === teamId 
          ? { ...standing, [field]: value }
          : standing
      );
      
      // Salvar no localStorage automaticamente
      if (selectedSeason) {
        saveToLocalStorage(updated, selectedSeason);
      }
      
      return updated;
    });
    setHasChanges(true);
  };

  // Salvar todos os standings
  const handleSaveAll = async () => {
    setIsSaving(true);
    
    try {
      // Preparar dados para envio em lote com validação
      const standingsToSave = standingsData.map(standing => {
        // Validar e corrigir valores antes de enviar
        let final_position = standing.final_position;
        let seed = standing.seed;
        let elimination_round = standing.elimination_round;

        // Garantir que final_position esteja entre 0-30
        if (final_position < 0 || final_position > 30) {
          console.warn(`Corrigindo final_position inválido: ${final_position} -> 0 para time ${standing.team_id}`);
          final_position = 0;
        }

        // Garantir que seed esteja entre 0-15
        if (seed < 0 || seed > 15) {
          console.warn(`Corrigindo seed inválido: ${seed} -> 0 para time ${standing.team_id}`);
          seed = 0;
        }

        // Garantir que elimination_round esteja entre 0-5
        if (elimination_round < 0 || elimination_round > 5) {
          console.warn(`Corrigindo elimination_round inválido: ${elimination_round} -> 0 para time ${standing.team_id}`);
          elimination_round = 0;
        }

        return {
          season_id: standing.season_id,
          team_id: standing.team_id,
          final_position,
          seed,
          elimination_round
        };
      });

      console.log('Dados a serem enviados:', standingsToSave);
      
      // Verificar se há valores inválidos
      const invalidData = standingsToSave.filter(s => 
        s.final_position < 0 || s.final_position > 30 ||
        s.seed < 0 || s.seed > 15 ||
        s.elimination_round < 0 || s.elimination_round > 5
      );
      
      if (invalidData.length > 0) {
        console.error('DADOS INVÁLIDOS ENCONTRADOS:', invalidData);
        toast({
          title: 'Erro de Validação',
          description: 'Há dados inválidos que não puderam ser corrigidos automaticamente',
          variant: 'destructive',
        });
        return;
      }

      // Salvar todos de uma vez usando o endpoint bulk
      await upsertManyStandings(standingsToSave);
      
      toast({
        title: 'Sucesso!',
        description: 'Standings salvos com sucesso.',
      });
      
      setHasChanges(false);
      
      // Limpar localStorage após salvar com sucesso
      if (selectedSeason) {
        clearLocalStorage(selectedSeason);
      }
      
      // Recarregar dados
      if (selectedSeason) {
        fetchStandingsBySeason(selectedSeason);
      }
    } catch (error) {
      toast({
        title: 'Erro!',
        description: 'Erro ao salvar standings.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };


  // Obter opções de posição final (1-30)
  const getFinalPositionOptions = (currentTeamId: number) => {
    const options: Array<{ value: string; label: string; disabled?: boolean }> = [
      { value: '0', label: 'TBD' }
    ];
    
    // Posição final vai de 1 a 30 (todos os times da liga)
    for (let i = 1; i <= 30; i++) {
      const isTaken = isPositionTaken(i, currentTeamId, 'final_position');
      options.push({
        value: i.toString(),
        label: `${i}${isTaken ? ' (Ocupado)' : ''}`,
        disabled: isTaken
      });
    }
    
    return options;
  };

  // Obter opções de seed (1-15 por conferência)
  const getSeedOptions = (currentTeamId: number, currentConference: string) => {
    const options: Array<{ value: string; label: string; disabled?: boolean }> = [
      { value: '0', label: 'TBD' }
    ];
    
    // Seed vai de 1 a 15 (apenas times da mesma conferência)
    for (let i = 1; i <= 15; i++) {
      const isTaken = isSeedTakenInConference(i, currentTeamId, currentConference);
      options.push({
        value: i.toString(),
        label: `${i}${isTaken ? ' (Ocupado)' : ''}`,
        disabled: isTaken
      });
    }
    
    return options;
  };

  // Obter opções de elimination round com validação
  const getEliminationRoundOptions = (currentTeamId: number) => {
    const options: Array<{ value: string; label: string; disabled?: boolean }> = [
      { value: '0', label: 'Sem offs' }
    ];
    
    // Contar quantos times já estão em cada rodada
    const counts = {
      round1: standingsData.filter(s => s.elimination_round === 1 && s.team_id !== currentTeamId).length,
      round2: standingsData.filter(s => s.elimination_round === 2 && s.team_id !== currentTeamId).length,
      finalConf: standingsData.filter(s => s.elimination_round === 3 && s.team_id !== currentTeamId).length,
      vice: standingsData.filter(s => s.elimination_round === 4 && s.team_id !== currentTeamId).length,
      champion: standingsData.filter(s => s.elimination_round === 5 && s.team_id !== currentTeamId).length
    };
    
    // Adicionar opções com validação
    options.push(
      { 
        value: '1', 
        label: '1ª Rodada', 
        disabled: counts.round1 >= 8 
      },
      { 
        value: '2', 
        label: '2ª Rodada', 
        disabled: counts.round2 >= 4 
      },
      { 
        value: '3', 
        label: 'Final de Conferência', 
        disabled: counts.finalConf >= 2 
      },
      { 
        value: '4', 
        label: 'Vice-campeão', 
        disabled: counts.vice >= 1 
      },
      { 
        value: '5', 
        label: 'Campeão', 
        disabled: counts.champion >= 1 
      }
    );
    
    return options;
  };

  // Obter cor da conferência
  const getConferenceColor = (conference: string) => {
    return conference === 'east' ? 'bg-blue-100 text-blue-800' : 'bg-orange-100 text-orange-800';
  };

  return (
    <div className="container mx-auto p-6 flex flex-col min-h-screen mb-12">
      <div className="flex justify-between items-center mb-6">
        <div className="flex flex-col gap-2">
        <h1 className="text-lg font-bold text-nba-dark sm:text-2xl md:text-3xl">Classificação dos Times</h1>
        <div className="flex gap-2">
          {/* <Button 
            variant="outline" 
            onClick={handleRefresh}
            disabled={loading}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Recarregar
          </Button>
          <Button 
            variant="outline"
            onClick={handleInitializeStandings}
            disabled={loading || standingsData.length > 0}
          >
            Inicializar
          </Button> */}
                    <div className="flex gap-2 flex-wrap max-w-xs gap-2">
            <Button 
              variant="outline" 
              onClick={handleForceReload}
              disabled={loading}
              className="text-blue-600 border-blue-600 hover:bg-blue-50"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Recarregar
            </Button>
            
            {/* <Button 
              variant="outline" 
              onClick={handleClearCorruptedData}
              className="text-red-600 border-red-600 hover:bg-red-50"
            >
              Limpar Dados Corrompidos
            </Button> */}
            <Button 
              onClick={handleSaveAll}
              disabled={isSaving || !hasChanges}
            >
              <Save className="w-4 h-4 mr-2" />
              {isSaving ? 'Salvando...' : 'Salvar Tudo'}
            </Button>
            {hasChanges && (
              <Button 
                variant="outline" 
                onClick={handleClearCache}
                className="text-orange-600 border-orange-600 hover:bg-orange-50"
              >
                Limpar Cache
              </Button>
            )}
          </div>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="season">Temporada</Label>
              <SearchableSelect
                value={selectedSeason?.toString() || "all"}
                onValueChange={(value) => setSelectedSeason(value === "all" ? undefined : parseInt(value))}
                placeholder="Selecione uma temporada"
                searchPlaceholder="Buscar temporada..."
                options={[
                  { value: 'all', label: 'Todas as temporadas' },
                  ...seasons.map((season) => ({
                    value: season.id.toString(),
                    label: `Temporada ${season.season_number} (${season.year})`
                  }))
                ]}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabela */}
      <Card className="flex-1">
        <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg ">
          Standings {selectedSeason && `- Temporada ${seasons.find(s => s.id === selectedSeason)?.season_number} (${seasons.find(s => s.id === selectedSeason)?.year})`}
          {hasChanges && (
            <Badge variant="outline" className="text-orange-600 border-orange-600">
              Não Salvo 
            </Badge>
          )}
        </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="rounded-md border overflow-x-auto max-h-[600px] overflow-y-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead 
                    onClick={() => handleSort('team_name')} 
                    className="cursor-pointer hover:bg-gray-50 select-none"
                  >
                    <div className="flex items-center gap-2 min-w-[130px]">
                      Time {getSortIcon('team_name')}
                    </div>
                  </TableHead>
                  <TableHead 
                    onClick={() => handleSort('conference')} 
                    className="cursor-pointer hover:bg-gray-50 select-none"
                  >
                    <div className="flex items-center gap-2">
                      Conferência {getSortIcon('conference')}
                    </div>
                  </TableHead>
                  <TableHead 
                    onClick={() => handleSort('final_position')} 
                    className="cursor-pointer hover:bg-gray-50 select-none "
                  >
                    <div className="flex items-center gap-2 min-w-[130px]">
                      Posição Regular {getSortIcon('final_position')}
                    </div>
                  </TableHead>
                  <TableHead 
                    onClick={() => handleSort('seed')} 
                    className="cursor-pointer hover:bg-gray-50 select-none"
                  >
                    <div className="flex items-center gap-2">
                      Seed {getSortIcon('seed')}
                    </div>
                  </TableHead>
                  <TableHead 
                    onClick={() => handleSort('elimination_round')} 
                    className="cursor-pointer hover:bg-gray-50 select-none"
                  >
                    <div className="flex items-center gap-2">
                      Rodada Eliminada {getSortIcon('elimination_round')}
                    </div>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8">
                      Carregando...
                    </TableCell>
                  </TableRow>
                ) : error ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-red-600">
                      Erro ao carregar dados: {error}
                    </TableCell>
                  </TableRow>
                ) : sortedStandings.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8">
                      Nenhum standing encontrado para esta temporada. Use "Salvar Tudo" para criar standings para todos os times.
                    </TableCell>
                  </TableRow>
                ) : (
                  sortedStandings.map((standing) => (
                    <TableRow key={standing.team_id}>
                      <TableCell className="font-medium">
                        {standing.team.name}
                      </TableCell>
                      <TableCell>
                        <Badge className={getConferenceColor(standing.team.conference)}>
                          {standing.team.conference === 'east' ? 'Leste' : 'Oeste'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Select
                          value={standing.final_position.toString()}
                          onValueChange={(value) => updateStandingData(standing.team_id, 'final_position', parseInt(value))}
                        >
                          <SelectTrigger className="w-24">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {getFinalPositionOptions(standing.team_id).map((option) => (
                              <SelectItem 
                                key={option.value} 
                                value={option.value}
                                disabled={option.disabled}
                              >
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <Select
                          value={standing.seed.toString()}
                          onValueChange={(value) => updateStandingData(standing.team_id, 'seed', parseInt(value))}
                        >
                          <SelectTrigger className="w-24">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {getSeedOptions(standing.team_id, standing.team.conference).map((option) => (
                              <SelectItem 
                                key={option.value} 
                                value={option.value}
                                disabled={option.disabled}
                              >
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell >
                        <Select
                          value={standing.elimination_round.toString()}
                          onValueChange={(value) => updateStandingData(standing.team_id, 'elimination_round', parseInt(value))}
                            
                        >
                          <SelectTrigger className="w-24">
                            <SelectValue />
                          </SelectTrigger>
                                                     <SelectContent
                           className="min-w-[130px]"
                           >
                             {getEliminationRoundOptions(standing.team_id).map((option) => (
                               <SelectItem 
                                 key={option.value} 
                                 value={option.value}
                                 disabled={option.disabled}
                               >
                                 {option.label}
                               </SelectItem>
                             ))}
                           </SelectContent>
                        </Select>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default StandingsPage; 