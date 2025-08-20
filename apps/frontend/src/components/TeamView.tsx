import React, { useState, useMemo, useCallback, useEffect, useRef, useLayoutEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Crown, Loader2, Pencil, Check, X, Copy } from 'lucide-react';
import { usePlayersByTeam, useUpdatePlayer } from '@/hooks/usePlayers';
import { useTeam } from '@/hooks/useTeams';
import { useActiveLeagueCap } from '@/hooks/useLeagueCap';
import { Player } from '@/services/playerService';
import { useParams } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import TeamPicks from './TeamPicks';
import { useTeamFuturePicks } from '@/hooks/usePicks';
import { useExecutedTradesCount } from '@/hooks/useTrades';
import { useActiveSeason } from '@/hooks/useSeasons';

// Suprimir warnings específicos do react-beautiful-dnd
const originalError = console.error;
console.error = (...args) => {
  if (args[0]?.includes?.('defaultProps') || args[0]?.includes?.('Maximum update depth')) {
    return;
  }
  originalError.call(console, ...args);
};

interface ViewTeamProps {
  isAdmin: boolean;
  teamId?: number;
}

// Posições dos titulares em ordem
const STARTER_POSITIONS = ['PG', 'SG', 'SF', 'PF', 'C'];

// Função para formatar nome do time com abreviação
function formatTeamName(name: string) {
  if (!name) return '';
  const words = name.split(' ');
  if (words.length === 1) return name;
  
  const firstWord = words[0];
  const rest = words.slice(1).join(' ');
  return `${firstWord[0]}. ${rest}`;
}

const ViewTeam = ({ isAdmin }: ViewTeamProps) => {
  const { otherTeamId } = useParams();
  // Certifique-se de converter para número se precisar
  const numericTeamId = Number(otherTeamId);

  // Hooks para buscar dados da API
  const { data: teamPlayersResponse, isLoading, error } = usePlayersByTeam(numericTeamId);
  const { data: team, isLoading: teamLoading, error: teamError } = useTeam(numericTeamId);
  const { data: activeLeagueCapResponse, isLoading: leagueCapLoading } = useActiveLeagueCap();
  const { data: futurePicksData } = useTeamFuturePicks(numericTeamId);
  const { data: activeSeasonData } = useActiveSeason();
  const updatePlayerMutation = useUpdatePlayer(numericTeamId);
  const { toast } = useToast();

  // Calcular período atual para limite de trades (a cada 2 temporadas)
  const currentSeason = activeSeasonData?.data?.season_number || 1;
  const seasonStart = Math.floor((currentSeason - 1) / 2) * 2 + 1;
  const seasonEnd = seasonStart + 1;
  
  // Hook para contar trades executadas no período atual
  const { data: tradeLimitData } = useExecutedTradesCount(
    numericTeamId, 
    seasonStart, 
    seasonEnd
  );

  // Extrair dados da resposta da API
  const teamPlayers: Player[] = teamPlayersResponse?.data || [];
  const activeLeagueCap = activeLeagueCapResponse?.data;

  // Estado para gerenciar titulares e reservas
  const [starters, setStarters] = useState<Player[]>([]);
  const [bench, setBench] = useState<Player[]>([]);
  const [playerToRelease, setPlayerToRelease] = useState<Player | null>(null);

  // Estado para edição inline (apenas para admins)
  const [editingPlayerId, setEditingPlayerId] = useState<number | null>(null);
  const [editValues, setEditValues] = useState<{ ovr: number; age: number; position: string }>({ ovr: 0, age: 0, position: '' });
  const [focusedInput, setFocusedInput] = useState<'ovr' | 'age' | 'position' | null>(null);
  const focusTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const ovrInputRef = useRef<HTMLInputElement>(null);
  const ageInputRef = useRef<HTMLInputElement>(null);
  const positionInputRef = useRef<HTMLInputElement>(null);

  // Função para ordenar jogadores baseado na ordem salva
  const orderPlayersBySavedOrder = useCallback((players: Player[], savedOrder: any) => {
    if (!savedOrder || !savedOrder.starters || !savedOrder.bench) {
      return { starters: players.slice(0, 5), bench: players.slice(5) };
    }

    const currentPlayerIds = players.map(p => p.id);
    
    // Filtrar apenas IDs válidos
    const validStarters = savedOrder.starters.filter((id: number) => currentPlayerIds.includes(id));
    const validBench = savedOrder.bench.filter((id: number) => currentPlayerIds.includes(id));
    
    // Jogadores que não estão na ordem salva (novos jogadores)
    const newPlayers = players.filter(p => 
      !validStarters.includes(p.id) && !validBench.includes(p.id)
    );

    // Ordenar jogadores conforme ordem salva
    const orderedStarters = validStarters.map((id: number) => 
      players.find(p => p.id === id)
    ).filter(Boolean) as Player[];

    const orderedBench = validBench.map((id: number) => 
      players.find(p => p.id === id)
    ).filter(Boolean) as Player[];

    // Adicionar novos jogadores no final do bench
    return {
      starters: orderedStarters,
      bench: [...orderedBench, ...newPlayers]
    };
  }, []);

  // Carregar ordem salva quando os dados chegarem
  useEffect(() => {
    if (teamPlayers.length > 0 && team?.data) {
      const savedOrder = team.data.player_order;
      const { starters: orderedStarters, bench: orderedBench } = orderPlayersBySavedOrder(teamPlayers, savedOrder);
      
      setStarters(orderedStarters);
      setBench(orderedBench);
    }
  }, [teamPlayers, team?.data, orderPlayersBySavedOrder]);

  const avgOverall = useMemo(() => {
    return teamPlayers.length > 0 
      ? (teamPlayers.reduce((sum, p) => sum + p.ovr, 0) / teamPlayers.length).toFixed(1)
      : '0.0';
  }, [teamPlayers]);

  const avgAge = useMemo(() => {
    return teamPlayers.length > 0 
      ? (teamPlayers.reduce((sum, p) => sum + p.age, 0) / teamPlayers.length).toFixed(1)
      : '0.0';
  }, [teamPlayers]);

  // Calcular CAP (soma dos 8 maiores OVRs)
  const currentCap = useMemo(() => {
    if (teamPlayers.length === 0) return 0;
    const sortedPlayers = [...teamPlayers].sort((a, b) => b.ovr - a.ovr);
    const top8Players = sortedPlayers.slice(0, 8);
    return top8Players.reduce((sum, player) => sum + player.ovr, 0);
  }, [teamPlayers]);

  // Valores de CAP mínimo e máximo vindos da API
  const minCap = activeLeagueCap?.min_cap || 620; // Fallback para valores padrão
  const maxCap = activeLeagueCap?.max_cap || 680; // Fallback para valores padrão

  // Verificar se está dentro dos limites
  const isCapValid = currentCap >= minCap && currentCap <= maxCap;
  const isBelowMin = currentCap < minCap;
  // const isAboveMax = currentCap > maxCap;


  const maxStarterOvr = useMemo(() => {
    if (starters.length === 0) return null;
    return Math.max(...starters.map(p => p.ovr));
  }, [starters]);

  // Handlers otimizados para focus/blur
  const handleFocus = useCallback((inputType: 'ovr' | 'age' | 'position') => {
    // Limpar timeout anterior se existir
    if (focusTimeoutRef.current) {
      clearTimeout(focusTimeoutRef.current);
    }
    setFocusedInput(inputType);
  }, []);

  const handleBlur = useCallback(() => {
    // Limpar timeout anterior se existir
    if (focusTimeoutRef.current) {
      clearTimeout(focusTimeoutRef.current);
    }
    
    // Pequeno delay para permitir que o usuário clique nos botões de salvar/cancelar
    focusTimeoutRef.current = setTimeout(() => {
      setFocusedInput(null);
    }, 150);
  }, []);

  // Handlers otimizados para onChange
  const handleAgeChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const numValue = value === '' ? 0 : parseInt(value, 10);
    if (!isNaN(numValue)) {
      setEditValues(v => ({ ...v, age: numValue }));
    }
  }, []);

  const handleOvrChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const numValue = value === '' ? 0 : parseInt(value, 10);
    if (!isNaN(numValue)) {
      setEditValues(v => ({ ...v, ovr: numValue }));
    }
  }, []);

  // Cleanup do timeout ao desmontar
  useEffect(() => {
    return () => {
      if (focusTimeoutRef.current) {
        clearTimeout(focusTimeoutRef.current);
      }
    };
  }, []);

  const handleCopyTeam = () => {
    if (!team?.data) return;
    const startersList = starters.map((p, idx) => `${STARTER_POSITIONS[idx]}: ${p.name} - ${p.ovr} | ${p.age}y`).join('\n');
    const benchList = bench.slice(0, 5).map(p => `${p.position}: ${p.name} - ${p.ovr} | ${p.age}y`).join('\n');
    const othersList = bench.slice(5).map(p => `${p.position}: ${p.name} - ${p.ovr} | ${p.age}y`).join('\n');
    
    // Processar picks futuras (subsequentes à temporada ativa)
    let picksText = '';
    if (futurePicksData && activeSeasonData?.data?.id) {
      const currentSeasonId = activeSeasonData.data.id;
      
      // Filtrar apenas picks futuras (season_id > currentSeasonId)
      const allPicks = [
        ...(futurePicksData.my_own_picks || []),
        ...(futurePicksData.received_picks || [])
      ].filter(pick => {
        // Como o backend já filtra por season_id > activeSeason.id, 
        // todas as picks retornadas são futuras
        return true;
      });
      
      // Agrupar picks por round
      const picksByRound = allPicks.reduce((acc, pick) => {
        const round = pick.round;
        if (!acc[round]) acc[round] = [];
        acc[round].push(pick);
        return acc;
      }, {} as Record<number, any[]>);
      
      // Ordenar rounds (1º antes do 2º)
      const sortedRounds = Object.keys(picksByRound).sort((a, b) => parseInt(a) - parseInt(b));
      
      picksText = sortedRounds.map(round => {
        const roundPicks = picksByRound[parseInt(round)];
        // Agrupar picks por ano
        const picksByYear = roundPicks.reduce((acc, pick) => {
          const year = pick.season_year;
          if (!acc[year]) acc[year] = [];
          acc[year].push(pick);
          return acc;
        }, {} as Record<string, any[]>);
        
        // Ordenar anos
        const sortedYears = Object.keys(picksByYear).sort((a, b) => parseInt(a) - parseInt(b));
        
        const roundText = sortedYears.map(year => {
          const yearPicks = picksByYear[year];
          const teamNames = yearPicks.map(pick => formatTeamName(pick.original_team_name)).join(', ');
          return `-${year} (${teamNames})`;
        }).join('\n');
        
        return `\n_Picks ${round}º round_:\n${roundText}`;
      }).join('\n');
    }
    
    const capLine = `CAP: ${minCap} / *${currentCap}* / ${maxCap}`;
    const tradesLine = `_Trades_: ${tradeLimitData?.data?.trades_used || 0} / ${tradeLimitData?.data?.trades_limit || 0}`;
    const text = `*${team.data.name}*\nDono: ${team.data.owner_name || 'Sem dono'}\n\n_Starters_\n${startersList}\n\n_Bench_\n${benchList || '-'}\n\n_Others_\n${othersList || '-'}\n\n_G-League_\n-\n${picksText}\n\n${capLine}\n${tradesLine}`;
    navigator.clipboard.writeText(text);
    toast({ title: 'Time copiado!', description: 'Informações do time copiadas para a área de transferência.' });
  };

  const handleCopyPicks = () => {
    if (!futurePicksData) return;
    
    // Processar picks futuras (subsequentes à temporada ativa)
    let picksText = '';
    if (futurePicksData && activeSeasonData?.data?.id) {
      const currentSeasonId = activeSeasonData.data.id;
      
      // Filtrar apenas picks futuras (season_id > currentSeasonId)
      const allPicks = [
        ...(futurePicksData.my_own_picks || []),
        ...(futurePicksData.received_picks || [])
      ].filter(pick => {
        // Como o backend já filtra por season_id > activeSeason.id, 
        // todas as picks retornadas são futuras
        return true;
      });
      
      // Agrupar picks por round
      const picksByRound = allPicks.reduce((acc, pick) => {
        const round = pick.round;
        if (!acc[round]) acc[round] = [];
        acc[round].push(pick);
        return acc;
      }, {} as Record<number, any[]>);
      
      // Ordenar rounds (1º antes do 2º)
      const sortedRounds = Object.keys(picksByRound).sort((a, b) => parseInt(a) - parseInt(b));
      
      picksText = sortedRounds.map(round => {
        const roundPicks = picksByRound[parseInt(round)];
        // Agrupar picks por ano
        const picksByYear = roundPicks.reduce((acc, pick) => {
          const year = pick.season_year;
          if (!acc[year]) acc[year] = [];
          acc[year].push(pick);
          return acc;
        }, {} as Record<string, any[]>);
        
        // Ordenar anos
        const sortedYears = Object.keys(picksByYear).sort((a, b) => parseInt(a) - parseInt(b));
        
        const roundText = sortedYears.map(year => {
          const yearPicks = picksByYear[year];
          const teamNames = yearPicks.map(pick => formatTeamName(pick.original_team_name)).join(', ');
          return `-${year} (${teamNames})`;
        }).join('\n');
        
        return `\n_Picks ${round}º round_:\n${roundText}`;
      }).join('\n');
    }
    
    const text = `*${formatTeamName(team?.data?.name || '')}* - Picks Futuros\n${picksText}`;
    navigator.clipboard.writeText(text);
    toast({ title: 'Picks copiados!', description: 'Picks do time copiados para a área de transferência.' });
  };

  // PlayerCard com funcionalidade de edição para admins
  const PlayerCard = React.memo(({ player, index, isStarter = false, maxStarterOvr }: { player: Player; index: number; isStarter?: boolean; maxStarterOvr?: number }) => {
    const isEditing = editingPlayerId === player.id;
    
    // Estado local para os valores dos inputs (evita re-renderizações do componente pai)
    const [localAgeValue, setLocalAgeValue] = useState(editValues.age || '');
    const [localOvrValue, setLocalOvrValue] = useState(editValues.ovr || '');
    const [localPositionValue, setLocalPositionValue] = useState(editValues.position || '');
    
    // Refs para os inputs
    const ageInputRef = useRef<HTMLInputElement>(null);
    const ovrInputRef = useRef<HTMLInputElement>(null);
    const positionInputRef = useRef<HTMLInputElement>(null);

    // Sincronizar valores locais quando editValues mudar
    useEffect(() => {
      if (isEditing) {
        setLocalAgeValue(editValues.age || '');
        setLocalOvrValue(editValues.ovr || '');
        setLocalPositionValue(editValues.position || '');
      }
    }, [editValues.age, editValues.ovr, editValues.position, isEditing]);

    // Handlers locais para onChange
    const handleLocalAgeChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      setLocalAgeValue(value);
      
      // Atualizar o estado global apenas se o valor for válido
      const numValue = value === '' ? 0 : parseInt(value, 10);
      if (!isNaN(numValue)) {
        setEditValues(v => ({ ...v, age: numValue }));
      }
    }, []);

    const handleLocalOvrChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      setLocalOvrValue(value);
      
      // Atualizar o estado global apenas se o valor for válido
      const numValue = value === '' ? 0 : parseInt(value, 10);
      if (!isNaN(numValue)) {
        setEditValues(v => ({ ...v, ovr: numValue }));
      }
    }, []);

    const handleLocalPositionChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      setLocalPositionValue(value);
      
      // Atualizar o estado global
      setEditValues(v => ({ ...v, position: value }));
    }, []);

    // Handlers para focus/blur
    const handleAgeFocus = useCallback(() => {
      setFocusedInput('age');
    }, []);

    const handleOvrFocus = useCallback(() => {
      setFocusedInput('ovr');
    }, []);

    const handlePositionFocus = useCallback(() => {
      setFocusedInput('position');
    }, []);

    const handleInputBlur = useCallback(() => {
      // Pequeno delay para permitir cliques nos botões
      setTimeout(() => {
        setFocusedInput(null);
      }, 100);
    }, []);
    
    const handleCardClick = () => {
      // Não executar ações do card se um input estiver em foco
      if (focusedInput) return;
    };

    // Restaurar foco quando necessário
    useLayoutEffect(() => {
      if (focusedInput && isEditing) {
        const inputRef = focusedInput === 'ovr' ? ovrInputRef.current : 
                        focusedInput === 'age' ? ageInputRef.current :
                        focusedInput === 'position' ? positionInputRef.current : null;
        if (inputRef) {
          inputRef.focus();
        }
      }
    }, [focusedInput, isEditing]);

    // Manter foco durante re-renderizações
    useLayoutEffect(() => {
      if (isEditing && focusedInput) {
        const inputRef = focusedInput === 'ovr' ? ovrInputRef.current : 
                        focusedInput === 'age' ? ageInputRef.current :
                        focusedInput === 'position' ? positionInputRef.current : null;
        if (inputRef && document.activeElement !== inputRef) {
          // Restaurar foco se foi perdido durante re-renderização
          inputRef.focus();
        }
      }
    });

    return (
      <Card className={`mb-3 transition-all`} onClick={handleCardClick}>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            {/* Coluna do badge */}
            <div className="flex flex-col items-center justify-center col-span-1">
              {isEditing ? (
                <input
                  ref={positionInputRef}
                  type="text"
                  className="border rounded px-1 w-[50px] text-center text-xs text-white bg-blue-600 font-medium"
                  value={localPositionValue}
                  maxLength={5}
                  onChange={handleLocalPositionChange}
                  onFocus={handlePositionFocus}
                  onBlur={handleInputBlur}
                  onClick={(e) => e.stopPropagation()}
                  onMouseDown={(e) => e.stopPropagation()}
                  onTouchStart={(e) => e.stopPropagation()}
                  onTouchEnd={(e) => e.stopPropagation()}
                  placeholder="PG/SG"
                />
              ) : (
                <Badge 
                  className={`text-white w-[40px] flex items-center justify-center 
                    ${
                      STARTER_POSITIONS[index] === 'PG' ? 'bg-blue-600' :
                      STARTER_POSITIONS[index] === 'SG' ? 'bg-blue-600' :
                      STARTER_POSITIONS[index] === 'SF' ? 'bg-blue-700' :
                      STARTER_POSITIONS[index] === 'PF' ? 'bg-blue-700' :
                      'bg-blue-800' // C
                    }`}
                >
                  {isStarter ? STARTER_POSITIONS[index] : player.position}
                </Badge>
              )}
            </div>
            {/* Conteúdo do jogador */}
            <div className="flex items-center"></div>
            <div className="flex-1 ml-3 min-w-0">
              <div className="flex items-center space-x-2">
                <h3
                  className="font-semibold text-sm sm:text-md truncate"
                  title={player.name}
                >
                  {player.name}
                </h3>
              </div>
              <div className="flex items-center space-x-4 text-sm text-gray-600">
                {isEditing ? (
                  <>
                    <input
                      ref={ageInputRef}
                      type="number"
                      className="border rounded px-1 w-12 text-center"
                      value={localAgeValue}
                      min={10}
                      max={50}
                      onChange={handleLocalAgeChange}
                      onFocus={handleAgeFocus}
                      onBlur={handleInputBlur}
                      onClick={(e) => e.stopPropagation()}
                      onMouseDown={(e) => e.stopPropagation()}
                      onTouchStart={(e) => e.stopPropagation()}
                      onTouchEnd={(e) => e.stopPropagation()}
                    />
                    <span>y</span>
                  </>
                ) : (
                  <span>{player.age}y</span>
                )}
              </div>
            </div>
            {isEditing ? (
              <input
                ref={ovrInputRef}
                type="number"
                className="border rounded px-1 w-14 text-center text-2xl font-bold text-gray-800 mr-5"
                value={localOvrValue}
                min={0}
                max={150}
                onChange={handleLocalOvrChange}
                onFocus={handleOvrFocus}
                onBlur={handleInputBlur}
                onClick={(e) => e.stopPropagation()}
                onMouseDown={(e) => e.stopPropagation()}
                onTouchStart={(e) => e.stopPropagation()}
                onTouchEnd={(e) => e.stopPropagation()}
              />
            ) : (
              <span className="text-2xl font-bold text-gray-800 mr-5">{player.ovr}</span>
            )}
            
            {/* Botões de ação - apenas para admins */}
            {isAdmin && (
              <>
                {isEditing ? (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-green-600 hover:text-green-700"
                      onClick={async () => {
                        // Modal de confirmação
                        if (window.confirm('Tem certeza que deseja editar o jogador?')) {
                          updatePlayerMutation.mutate(
                            { id: player.id, data: { ovr: editValues.ovr, age: editValues.age, position: editValues.position } },
                            {
                              onSuccess: () => {
                                toast({
                                  title: 'Jogador atualizado!',
                                  description: `${player.name} foi atualizado com sucesso.`,
                                });
                                setEditingPlayerId(null);
                              },
                              onError: () => {
                                toast({
                                  title: 'Erro ao atualizar',
                                  description: 'Não foi possível atualizar o jogador.',
                                });
                              },
                            }
                          );
                        }
                      }}
                      disabled={updatePlayerMutation.isPending}
                    >
                      {updatePlayerMutation.isPending ? (
                        <Loader2 size={16} className="animate-spin" />
                      ) : (
                        <Check size={16} />
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-red-600 hover:text-red-700"
                      onClick={() => {
                        setEditingPlayerId(null);
                        setEditValues({ ovr: 0, age: 0, position: '' });
                      }}
                    >
                      <X size={16} />
                    </Button>
                  </>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-blue-600 hover:text-blue-700"
                    onClick={() => {
                      setEditingPlayerId(player.id);
                      setEditValues({ ovr: player.ovr, age: player.age, position: player.position });
                    }}
                  >
                    <Pencil size={16} />
                  </Button>
                )}
              </>
            )}
          </div>
        </CardContent>
      </Card>
    );
  });

  useEffect(() => {
    if (playerToRelease) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    // Limpeza ao desmontar
    return () => { document.body.style.overflow = ''; };
  }, [playerToRelease]);

  if (isLoading || leagueCapLoading) {
    return (
      <div className="p-4 flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="flex items-center justify-center">
            <img src="/loading.gif" alt="Loading" className="w-20 h-20" />
          </div>
          <p className="text-gray-600">Carregando elenco...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 pb-20">
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-8 text-center">
            <p className="text-red-600 font-medium">Erro ao carregar elenco</p>
            <p className="text-red-500 text-sm mt-2">
              {error.message || 'Tente novamente mais tarde'}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div>
      <div className="p-4 pb-20 space-y-6">
        {/* Team Summary */}
        <Card className="bg-gradient-to-r from-nba-dark to-nba-blue text-white">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="font-bold">{team?.data?.name}  -  {team?.data?.owner_name || 'Sem dono'}</span>
            </CardTitle>
            
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold">{teamPlayers.length}</p>
                <p className="text-sm opacity-80">Jogadores</p>
                {teamPlayers.length < 13 && (
                  <span className="text-xs text-red-600 font-medium block mt-1">Abaixo do mínimo</span>
                )}
                {teamPlayers.length > 15 && (
                  <span className="text-xs text-red-600 font-medium block mt-1">Acima do máximo</span>
                )}
              </div>

              <div>
                <p className="text-2xl font-bold">{tradeLimitData?.data?.trades_used || 0}/10</p>
                <p className="text-sm opacity-80">Trades</p>
                <span className="text-xs text-gray-500 font-medium block mt-1">
                  {tradeLimitData?.data?.trades_used || 0} usadas no período atual
                </span>
              </div>

              <div>
                <p className="text-2xl font-bold">-</p>
                <p className="text-sm opacity-80">Waivers</p>
                <span className="text-xs text-gray-500 font-medium block mt-1">Modo visualização</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* CAP Information */}
        <div className="grid grid-cols-3 gap-2 md:gap-4">
          {/* CAP Mínimo */}
          <Card className={`border-2 border-blue-200 bg-blue-50`}>
            <CardContent className="p-2 md:p-4 text-center">
              <div className="flex items-center justify-center mb-1 md:mb-2">
                <div className={`w-2 h-2 md:w-3 md:h-3 rounded-full mr-1 md:mr-2 bg-blue-500`}></div>
                <h3 className="font-semibold text-xs md:text-sm">CAP Mín.</h3>
              </div>
              <p className="text-lg md:text-2xl font-bold text-gray-800">{minCap}</p>
            </CardContent>
          </Card>

          {/* CAP Atual */}
          <Card className={`border-2 ${!isCapValid ? 'border-red-500 bg-red-50' : 'border-green-200 bg-green-50'}`}>
            <CardContent className="p-2 md:p-4 text-center">
              <div className="flex items-center justify-center mb-1 md:mb-2">
                <div className={`w-2 h-2 md:w-3 md:h-3 rounded-full mr-1 md:mr-2 ${!isCapValid ? 'bg-red-500' : 'bg-green-500'}`}></div>
                <h3 className="font-semibold text-xs md:text-sm">CAP Atual</h3>
              </div>
              <p className={`text-lg md:text-2xl font-bold ${!isCapValid ? 'text-red-500' : 'text-green-500'}`}>{currentCap}</p>
              {!isCapValid && (
                <p className="text-xs text-red-600 mt-1 font-medium">
                  {isBelowMin ? 'Abaixo do CAP!' : 'Acima do CAP!'}
                </p>
              )}
            </CardContent>
          </Card>

          {/* CAP Máximo */}
          <Card className={`border-2 border-blue-200 bg-blue-50`}>
            <CardContent className="p-2 md:p-4 text-center">
              <div className="flex items-center justify-center mb-1 md:mb-2">
                <div className={`w-2 h-2 md:w-3 md:h-3 rounded-full mr-1 md:mr-2 bg-blue-500`}></div>
                <h3 className="font-semibold text-xs md:text-sm">CAP Máx.</h3>
              </div>
              <p className="text-lg md:text-2xl font-bold text-gray-800">{maxCap}</p>
            </CardContent>
          </Card>
        </div>

        {/* Starters */}
        <div>
          <h2 className="text-xl font-bold mb-4 flex items-center">
            <Crown className="mr-2 text-nba-orange" />
            Quinteto Titular
            <button onClick={handleCopyTeam} className="ml-2 p-1 rounded hover:bg-gray-200" title="Copiar informações do time">
              <Copy size={18} />
            </button>
            {!isAdmin && (
              <Badge variant="outline" className="ml-2 text-xs">
                Modo Visualização
              </Badge>
            )}
          </h2>
                {starters.length > 0 ? (
                  starters.map((player, index) => (
                    <PlayerCard
                      key={player.id}
                      player={player}
                      index={index}
                      isStarter={true}
                      maxStarterOvr={maxStarterOvr}
                    />
                  ))
                ) : (
                  <Card>
                    <CardContent className="p-8 text-center text-gray-500">
                      <p>Sem jogadores titulares.</p>
                    </CardContent>
                  </Card>
                )}
        </div>

        {/* Bench */}
        <div>
          <h2 className="text-xl font-bold mb-4 flex items-center">
            Reservas
            {!isAdmin && (
              <Badge variant="outline" className="ml-2 text-xs">
                Modo Visualização
              </Badge>
            )}
          </h2>
          <div className="min-h-[200px]">
            {bench.length > 0 ? (
              bench.map((player, index) => (
                <PlayerCard key={player.id} player={player} index={index} />
              ))
            ) : (
              <Card>
                <CardContent className="p-8 text-center text-gray-500">
                  <p>Nenhum reserva no elenco.</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Admin Actions */}
        {/* {isAdmin && (
          <Card className="border-2 border-dashed border-nba-orange">
            <CardContent className="p-4 text-center">
              <h3 className="font-semibold mb-2">Ações de Admin</h3>
              <p className="text-sm text-gray-600 mb-3">
                Como administrador, você pode editar e dispensar jogadores de qualquer time.
              </p>
              <div className="flex space-x-2">
                <Button className="flex-1 bg-nba-orange hover:bg-nba-orange/90">
                  Adicionar Jogador
                </Button>
                <Button variant="outline" className="flex-1">
                  Editar Elenco
                </Button>
              </div>
            </CardContent>
          </Card>
        )} */}
        {/* Componente de Picks */}
        <TeamPicks teamId={numericTeamId} />
      </div>
    </div>
  );
};

export default ViewTeam;
