import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { UserX, Star, Crown, FileX, Loader2, Pencil, Check, X, ChevronUp, ChevronDown, Copy } from 'lucide-react';
import { usePlayersByTeam, useReleasePlayer, useUpdatePlayer } from '@/hooks/usePlayers';
import { useTeam, useUpdateTeam } from '@/hooks/useTeams';
import { useActiveLeagueCap } from '@/hooks/useLeagueCap';
import { Player } from '@/services/playerService';
import { config } from '@/lib/config';
import { useParams } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import ModalAddPlayer from './ModalAddPlayer';
import TeamPicks from './TeamPicks';
import { useTeamFuturePicks } from '@/hooks/usePicks';
import { useExecutedTradesCount } from '@/hooks/useTrades';
import { useActiveSeason } from '@/hooks/useSeasons';

interface MyTeamProps {
  isAdmin: boolean;
  teamId?: number;
}

// Posições dos titulares em ordem
const STARTER_POSITIONS = ['PG', 'SG', 'SF', 'PF', 'C'];

function formatPlayerName(name: string, maxLength = 12) {
  if (!name) return '';
  if (name.length <= maxLength) return name;

  const parts = name.split(' ');
  if (parts.length === 1) return name.slice(0, maxLength) + '...';

  const firstName = parts[0];
  const lastName = parts[parts.length - 1];
  const shortName = `${firstName[0]}. ${lastName}`;

  // Se ainda ficou grande, trunca com ...
  if (shortName.length > maxLength) {
    return shortName.slice(0, maxLength - 3) + '...';
  }
  return shortName;
}

function useIsMobile(breakpoint = 640) {
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < breakpoint);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < breakpoint);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [breakpoint]);

  return isMobile;
}

const MyTeam = ({ isAdmin }: MyTeamProps) => {
  const { teamId } = useParams();
  // Certifique-se de converter para número se precisar
  const numericTeamId = Number(teamId);

  // Hooks para buscar dados da API
  const { data: teamPlayersResponse, isLoading, error } = usePlayersByTeam(numericTeamId);
  const { data: team, isLoading: teamLoading, error: teamError } = useTeam(numericTeamId);
  const { data: activeLeagueCapResponse, isLoading: leagueCapLoading } = useActiveLeagueCap();
  const { data: activeSeasonData } = useActiveSeason();
  const { data: futurePicksData } = useTeamFuturePicks(numericTeamId);
  const updateTeamMutation = useUpdateTeam();
  const releasePlayerMutation = useReleasePlayer(numericTeamId);
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

  // Valores de CAP mínimo e máximo vindos da API
  const minCap = activeLeagueCap?.min_cap || 620; // Fallback para valores padrão
  const maxCap = activeLeagueCap?.max_cap || 680; // Fallback para valores padrão

  // Estado para gerenciar titulares e reservas
  const [starters, setStarters] = useState<Player[]>([]);
  const [bench, setBench] = useState<Player[]>([]);
  const [playerToRelease, setPlayerToRelease] = useState<Player | null>(null);

  // Estado para edição inline
  const [editingPlayerId, setEditingPlayerId] = useState<number | null>(null);
  const [editValues, setEditValues] = useState<{ ovr: number; age: number }>({ ovr: 0, age: 0 });
  const [focusedInput, setFocusedInput] = useState<'ovr' | 'age' | null>(null);
  const focusTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const ovrInputRef = useRef<HTMLInputElement>(null);
  const ageInputRef = useRef<HTMLInputElement>(null);

  // Estado para controlar o modal de adicionar jogador
  const [isAddPlayerModalOpen, setIsAddPlayerModalOpen] = useState(false);

  // Estado para controlar a minimização das seções
  const [showStarters, setShowStarters] = useState(true);
  const [showBench, setShowBench] = useState(true);

  // Estado para seleção por clique
  const [selectedPlayerId, setSelectedPlayerId] = useState<number | null>(null);
  const [selectedEmptyPosition, setSelectedEmptyPosition] = useState<number | null>(null);

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

  // Função para salvar ordem (com debounce)
  const savePlayerOrder = useCallback((newStarters: Player[], newBench: Player[]) => {
    const playerOrder = {
      starters: newStarters.map(p => p.id),
      bench: newBench.map(p => p.id),
      last_updated: new Date().toISOString()
    };

    updateTeamMutation.mutate({
      id: numericTeamId,
      data: { player_order: playerOrder }
    });
  }, [numericTeamId, updateTeamMutation]);

  // Debounced save function
  const debouncedSave = useMemo(() => {
    let timeoutId: NodeJS.Timeout;
    return (newStarters: Player[], newBench: Player[]) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        savePlayerOrder(newStarters, newBench);
      }, 1000); // 1 segundo de delay
    };
  }, [savePlayerOrder]);
  
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

  // Verificar se está dentro dos limites
  const isCapValid = currentCap >= minCap && currentCap <= maxCap;
  const isBelowMin = currentCap < minCap;
  // const isAboveMax = currentCap > maxCap;

  const handleReleasePlayer = (playerId: number) => {
    releasePlayerMutation.mutate(playerId);
  };

  const maxStarterOvr = useMemo(() => {
    if (starters.length === 0) return null;
    return Math.max(...starters.map(p => p.ovr));
  }, [starters]);

  // Handlers otimizados para focus/blur
  const handleFocus = useCallback((inputType: 'ovr' | 'age') => {
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

  // Função para troca por clique
  const handlePlayerClick = (playerId: number) => {
    // Se uma posição vazia está selecionada, mover o jogador para ela
    if (selectedEmptyPosition !== null) {
      const player = [...starters, ...bench].find(p => p.id === playerId);
      if (!player) return;

      let newStarters = [...starters];
      let newBench = [...bench];

      // Remover jogador de onde ele está
      const starterIndex = newStarters.findIndex(p => p.id === playerId);
      const benchIndex = newBench.findIndex(p => p.id === playerId);

      if (starterIndex !== -1) {
        newStarters.splice(starterIndex, 1);
      } else if (benchIndex !== -1) {
        newBench.splice(benchIndex, 1);
      }

      // Adicionar jogador na posição vazia
      newStarters.splice(selectedEmptyPosition, 0, player);

      setStarters(newStarters);
      setBench(newBench);
      debouncedSave(newStarters, newBench);
      setSelectedEmptyPosition(null);
      setSelectedPlayerId(null);
      return;
    }

    // Se um jogador já está selecionado, fazer a troca
    if (selectedPlayerId !== null) {
      if (selectedPlayerId === playerId) {
        setSelectedPlayerId(null);
        return;
      }
      
      // Encontrar ambos jogadores e seus grupos
      let startersIdx = starters.findIndex(p => p.id === selectedPlayerId);
      let benchIdx = bench.findIndex(p => p.id === selectedPlayerId);
      let otherStartersIdx = starters.findIndex(p => p.id === playerId);
      let otherBenchIdx = bench.findIndex(p => p.id === playerId);

      let newStarters = [...starters];
      let newBench = [...bench];

      if (startersIdx !== -1 && otherStartersIdx !== -1) {
        // Troca dentro dos titulares
        [newStarters[startersIdx], newStarters[otherStartersIdx]] = [newStarters[otherStartersIdx], newStarters[startersIdx]];
      } else if (benchIdx !== -1 && otherBenchIdx !== -1) {
        // Troca dentro das reservas
        [newBench[benchIdx], newBench[otherBenchIdx]] = [newBench[otherBenchIdx], newBench[benchIdx]];
      } else if (startersIdx !== -1 && otherBenchIdx !== -1) {
        // Troca entre titular e reserva
        const temp = newStarters[startersIdx];
        newStarters[startersIdx] = newBench[otherBenchIdx];
        newBench[otherBenchIdx] = temp;
      } else if (benchIdx !== -1 && otherStartersIdx !== -1) {
        // Troca entre reserva e titular
        const temp = newBench[benchIdx];
        newBench[benchIdx] = newStarters[otherStartersIdx];
        newStarters[otherStartersIdx] = temp;
      }
      setStarters(newStarters);
      setBench(newBench);
      debouncedSave(newStarters, newBench);
      setSelectedPlayerId(null);
      return;
    }

    // Selecionar o primeiro jogador
    setSelectedPlayerId(playerId);
  };

  // Função para selecionar uma posição vazia
  const handleEmptyPositionClick = (positionIndex: number) => {
    if (selectedEmptyPosition === positionIndex) {
      setSelectedEmptyPosition(null);
    } else {
      setSelectedEmptyPosition(positionIndex);
      setSelectedPlayerId(null); // Limpar seleção de jogador
    }
  };

  const handleCopyTeam = () => {
    if (!team?.data) return;
    
    // Informações básicas do time
    const startersList = starters.map((p, idx) => `${STARTER_POSITIONS[idx]}: ${p.name} - ${p.ovr} | ${p.age}y`).join('\n');
    const benchList = bench.slice(0, 5).map(p => `${p.position}: ${p.name} - ${p.ovr} | ${p.age}y`).join('\n');
    const othersList = bench.slice(5).map(p => `${p.position}: ${p.name} - ${p.ovr} | ${p.age}y`).join('\n');
    
 // Processar picks futuras
 let picksText = '';
 if (futurePicksData) {
   const allPicks = [
     ...(futurePicksData.my_own_picks || []),
     ...(futurePicksData.received_picks || [])
   ];
   
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
       const teamNames = yearPicks.map(pick => pick.original_team_name).join(', ');
       return `-${year} (${teamNames})`;
     }).join('\n');
     
     return `\n_Picks ${round}º round_:\n${roundText}`;
      }).join('\n');
    }
    
    const text = `*${team.data.name}*\nDono: ${team.data.owner_name || 'Sem dono'}\n\n_Starters_\n${startersList}\n\n_Bench_\n${benchList || '-'}\n\n_Others_\n${othersList || '-'}\n\n_G-League_\n-\n${picksText}\n\n${capLine}\n${tradesLine}`;
    navigator.clipboard.writeText(text);
    toast({ title: 'Time copiado!', description: 'Informações do time copiadas para a área de transferência.' });
    };

    const capLine = `_CAP_: ${minCap} / *${currentCap}* / ${maxCap}`;
    // Informações de trades
    const tradesUsed = tradeLimitData?.data?.trades_used || 0;
    const tradesLimit = 10; // Limite fixo de 10 trades a cada 2 temporadas
    const tradesLine = `_Trades_: ${tradesUsed} / ${tradesLimit}`;
    
   

  // Componente PlayerCard simplificado
  const PlayerCard = React.memo(({ player, index, isStarter = false, maxStarterOvr, onClick, selected }: { player: Player; index: number; isStarter?: boolean; maxStarterOvr?: number; onClick?: () => void; selected?: boolean }) => {
    const isEditing = editingPlayerId === player.id;
    const isMobile = useIsMobile();

    // Valores otimizados para os inputs
    const ageValue = useMemo(() => editValues.age || '', [editValues.age]);
    const ovrValue = useMemo(() => editValues.ovr || '', [editValues.ovr]);

    const handleCardClick = () => {
      // Não executar onClick se um input estiver em foco
      if (focusedInput) return;
      onClick?.();
    };

    // Restaurar foco quando necessário
    useEffect(() => {
      if (focusedInput && isEditing) {
        const inputRef = focusedInput === 'ovr' ? ovrInputRef.current : ageInputRef.current;
        if (inputRef) {
          // Pequeno delay para garantir que o DOM foi atualizado
          setTimeout(() => {
            inputRef.focus();
          }, 0);
        }
      }
    }, [focusedInput, isEditing]);

    return (
      <Card 
        className={`mb-3 transition-all relative ${
          selected ? 'ring-2 ring-blue-600' : ''
        }`}
        onClick={handleCardClick}
      >
        <CardContent className="p-4 relative">
          <div className="flex items-center justify-between">
            {/* O resto do card */}
            <div className="flex items-center w-full min-w-0">
              {/* Badge */}
              <div className="flex flex-col items-center justify-center col-span-1">
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
              </div>
              {/* Nome, idade e OVR */}
              <div className="flex-1 flex items-center min-w-0 ml-2 sm:ml-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2">
                    <h3
                      className="font-semibold text-sm sm:text-md truncate"
                      title={player.name}
                    >
                      {player.name}
                    </h3>
                  </div>
                  {isEditing ? (
                    <input
                      ref={ageInputRef}
                      type="number"
                      className="border rounded px-1 w-10 text-center text-xs text-gray-500 mt-1 sm:w-12"
                      value={ageValue}
                      min={16}
                      max={50}
                      onChange={handleAgeChange}
                      onFocus={() => handleFocus('age')}
                      onBlur={handleBlur}
                      onClick={(e) => e.stopPropagation()}
                      onMouseDown={(e) => e.stopPropagation()}
                      onTouchStart={(e) => e.stopPropagation()}
                      onTouchEnd={(e) => e.stopPropagation()}
                    />
                  ) : (
                    <div className="text-xs text-gray-500 mt-1">{player.age}y</div>
                  )}
                </div>
                {isEditing ? (
                  <input
                    ref={ovrInputRef}
                    type="number"
                    className="border rounded px-1 w-10 text-center text-lg font-bold text-gray-800 ml-2 sm:w-14 sm:text-2xl"
                    value={ovrValue}
                    min={0}
                    max={150}
                    onChange={handleOvrChange}
                    onFocus={() => handleFocus('ovr')}
                    onBlur={handleBlur}
                    onClick={(e) => e.stopPropagation()}
                    onMouseDown={(e) => e.stopPropagation()}
                    onTouchStart={(e) => e.stopPropagation()}
                    onTouchEnd={(e) => e.stopPropagation()}
                  />
                ) : (
                  <span className="font-bold text-gray-800 ml-2 text-lg sm:text-2xl">{player.ovr}</span>
                )}
              </div>
              {/* Botões */}
              <div className="flex gap-1 ml-2">
                {isEditing ? (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-green-600 hover:text-green-700"
                      onClick={async (e) => {
                        e.stopPropagation();
                        // Modal de confirmação
                        if (window.confirm('Tem certeza que deseja editar o jogador?')) {
                          updatePlayerMutation.mutate(
                            { id: player.id, data: { ovr: editValues.ovr, age: editValues.age } },
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
                      onMouseDown={(e) => e.stopPropagation()}
                      onTouchStart={(e) => e.stopPropagation()}
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
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingPlayerId(null);
                        setEditValues({ ovr: 0, age: 0 });
                      }}
                      onMouseDown={(e) => e.stopPropagation()}
                      onTouchStart={(e) => e.stopPropagation()}
                    >
                      <X size={16} />
                    </Button>
                  </>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-blue-600 hover:text-blue-700"
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditingPlayerId(player.id);
                      setEditValues({ ovr: player.ovr, age: player.age });
                    }}
                    onMouseDown={(e) => e.stopPropagation()}
                    onTouchStart={(e) => e.stopPropagation()}
                  >
                    <Pencil size={16} />
                  </Button>
                )}
                {!isEditing && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-red-600 hover:text-red-700"
                    onClick={(e) => {
                      e.stopPropagation();
                      setPlayerToRelease(player);
                    }}
                    onMouseDown={(e) => e.stopPropagation()}
                    onTouchStart={(e) => e.stopPropagation()}
                    disabled={releasePlayerMutation.isPending}
                  >
                    {releasePlayerMutation.isPending ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      <FileX size={16} />
                    )}
                  </Button>
                )}
              </div>
            </div>
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
    <div className="p-4 pb-20 space-y-6">
      {/* Team Summary */}
      <Card className="bg-gradient-to-r from-nba-dark to-nba-blue text-white">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="font-bold text-md sm:text-lg">{team?.data?.name}  -  {team?.data?.owner_name || 'Sem dono'}</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold">{avgOverall}</p>
              <p className="text-sm opacity-80">OVR Médio</p>
            </div>

            <div>
              <p className="text-2xl font-bold">{avgAge}</p>
              <p className="text-sm opacity-80">Idade Média</p>
            </div>

            <div>
              <p className={`text-2xl font-bold ${teamPlayers.length < 13 || teamPlayers.length > 15 ? 'text-red-600' : ''}`}>{teamPlayers.length}</p>
              <p className={`text-sm opacity-80 ${teamPlayers.length < 13 || teamPlayers.length > 15 ? 'text-red-600' : ''}`}>Jogadores</p>
              {teamPlayers.length < 13 && (
                <span className="text-xs text-red-600 font-medium block mt-1">Abaixo do mínimo</span>
              )}
              {teamPlayers.length > 15 && (
                <span className="text-xs text-red-600 font-medium block mt-1">Acima do máximo</span>
              )}
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
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold flex items-center">
            <Crown className="mr-2 text-nba-orange" />
            Quinteto Titular
            <button onClick={handleCopyTeam} className="ml-2 p-1 rounded hover:bg-gray-200" title="Copiar informações do time">
              <Copy size={18} />
            </button>
          </h2>
          <Button variant="ghost" size="icon" onClick={() => setShowStarters(v => !v)}>
            {showStarters ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
          </Button>
        </div>
        {showStarters && (
          <div className="min-h-[200px]">
            {STARTER_POSITIONS.map((position, index) => {
              const player = starters[index];
              return (
                <div key={position} className="mb-3">
                  {player ? (
                    <PlayerCard
                      player={player}
                      index={index}
                      isStarter={true}
                      maxStarterOvr={maxStarterOvr}
                      onClick={() => handlePlayerClick(player.id)}
                      selected={selectedPlayerId === player.id}
                    />
                  ) : (
                    <Card 
                      className={`mb-3 border-2 border-dashed border-gray-300ition-all relative ${
                        selectedEmptyPosition === index ? 'ring-2g-blue-600 bg-blue-50' : ''
                      }`}
                      onClick={() => handleEmptyPositionClick(index)}
                    >
                      <CardContent className="p-4 relative">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center w-full min-w-0">
                            {/* Badge da posição vazia */}
                            <div className="flex flex-col items-center justify-center col-span-1">
                              <Badge 
                                className={`text-white w-[40px] flex items-center justify-center
                                  ${
                                    position === 'PG' ? 'bg-blue-600' :
                                    position === 'SG' ? 'bg-blue-600' :
                                    position === 'SF' ? 'bg-blue-700' :
                                    position === 'PF' ? 'bg-blue-700' :
                                    'bg-blue-800' // C
                                  }`}
                              >
                                {position}
                              </Badge>
                            </div>
                          
                          {/* Nome, idade e OVR */}
                          <div className="flex-1 flex items-center min-w-0 ">
                            <div className="flex-1 min-w-0 ">
                              <h3 className="font-semibold text-[15px] sm:text-md text-gray-500 italic">
                                Vaga disponível
                              </h3>
                              <div className="text-xs text-gray-400 mt-1">
                                {selectedEmptyPosition === index 
                                  ? 'Agora clique em um jogador do banco para preencher esta posição'
                                  : 'Clique aqui para selecionar esta posição, depois clique em um jogador do banco'
                                }
                              </div>
                            </div>
                          </div>
                        </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Bench */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold">Reservas</h2>
          <Button variant="ghost" size="icon" onClick={() => setShowBench(v => !v)}>
            {showBench ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
          </Button>
        </div>
        {showBench && (
          <div className="min-h-[200px]">
            {bench.length > 0 ? (
              bench.map((player, index) => (
                <PlayerCard key={player.id} player={player} index={index} onClick={() => handlePlayerClick(player.id)} selected={selectedPlayerId === player.id} />
              ))
            ) : (
              <Card>
                <CardContent className="p-8 text-center text-gray-500">
                  <p>Nenhum reserva no elenco.</p>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>

      {/* Componente de Picks */}
      <TeamPicks teamId={numericTeamId} />

      {/* Modal para adicionar jogador */}
      <ModalAddPlayer
        isOpen={isAddPlayerModalOpen}
        onClose={() => setIsAddPlayerModalOpen(false)}
        teamId={numericTeamId}
      />

      {playerToRelease && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50">
          <div className="bg-white rounded-lg p-6 shadow-lg max-w-sm w-full">
            <h2 className="text-lg font-bold mb-2">Confirmar dispensa</h2>
            <p className="mb-4">
              Tem certeza que deseja dispensar <span className="font-semibold">{playerToRelease.name}</span>?<br />
              Ele irá para a free agency.
            </p>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setPlayerToRelease(null)}
              >
                Cancelar
              </Button>
              <Button
                variant="destructive"
                onClick={() => {
                  handleReleasePlayer(playerToRelease.id);
                  setPlayerToRelease(null);
                }}
              >
                Dispensar
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyTeam;
