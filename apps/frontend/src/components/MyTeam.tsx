import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { UserX, Star, Crown, FileX, Loader2, Pencil, Check, X } from 'lucide-react';
import { usePlayersByTeam, useReleasePlayer, useUpdatePlayer } from '@/hooks/usePlayers';
import { useTeam, useUpdateTeam } from '@/hooks/useTeams';
import { Player } from '@/services/playerService';
import { config } from '@/lib/config';
import { useParams } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';

// Suprimir warnings específicos do react-beautiful-dnd
const originalError = console.error;
console.error = (...args) => {
  if (args[0]?.includes?.('defaultProps') || args[0]?.includes?.('Maximum update depth')) {
    return;
  }
  originalError.call(console, ...args);
};

interface MyTeamProps {
  isAdmin: boolean;
  teamId?: number;
}

// Posições dos titulares em ordem
const STARTER_POSITIONS = ['PG', 'SG', 'SF', 'PF', 'C'];

const MyTeam = ({ isAdmin }: MyTeamProps) => {
  const { teamId } = useParams();
  // Certifique-se de converter para número se precisar
  const numericTeamId = Number(teamId);

  // Hooks para buscar dados da API
  const { data: teamPlayersResponse, isLoading, error } = usePlayersByTeam(numericTeamId);
  const { data: team, isLoading: teamLoading, error: teamError } = useTeam(numericTeamId);
  const updateTeamMutation = useUpdateTeam();
  const releasePlayerMutation = useReleasePlayer(numericTeamId);
  const updatePlayerMutation = useUpdatePlayer(numericTeamId);
  const { toast } = useToast();

  // Extrair dados da resposta da API
  const teamPlayers: Player[] = teamPlayersResponse?.data || [];

  // Estado para gerenciar titulares e reservas
  const [starters, setStarters] = useState<Player[]>([]);
  const [bench, setBench] = useState<Player[]>([]);
  const [playerToRelease, setPlayerToRelease] = useState<Player | null>(null);

  // Estado para edição inline
  const [editingPlayerId, setEditingPlayerId] = useState<number | null>(null);
  const [editValues, setEditValues] = useState<{ ovr: number; age: number }>({ ovr: 0, age: 0 });

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

  // Função para lidar com o drag and drop
  const handleDragEnd = useCallback((result: DropResult) => {
    const { source, destination } = result;

    // Se não há destino válido, não faz nada
    if (!destination) return;

    const sourceList = source.droppableId;
    const destList = destination.droppableId;

    let newStarters = [...starters];
    let newBench = [...bench];

    // Se está movendo dentro da mesma lista
    if (sourceList === destList) {
      const list = sourceList === 'starters' ? newStarters : newBench;
      const [removed] = list.splice(source.index, 1);
      list.splice(destination.index, 0, removed);

      if (sourceList === 'starters') {
        newStarters = list;
      } else {
        newBench = list;
      }
    } else {
      // Se está movendo entre listas diferentes
      const sourceListData = sourceList === 'starters' ? newStarters : newBench;
      const destListData = destList === 'starters' ? newStarters : newBench;

      const newSourceList = Array.from(sourceListData);
      const newDestList = Array.from(destListData);

      const [removed] = newSourceList.splice(source.index, 1);
      newDestList.splice(destination.index, 0, removed);

      if (sourceList === 'starters') {
        newStarters = newSourceList;
        newBench = newDestList;
      } else {
        newBench = newSourceList;
        newStarters = newDestList;
      }
    }

    // Atualizar estado
    setStarters(newStarters);
    setBench(newBench);

    // Salvar ordem com debounce
    debouncedSave(newStarters, newBench);
  }, [starters, bench, debouncedSave]);
  
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

  // Valores de CAP mínimo e máximo (placeholder - será implementado depois)
  const minCap = 620; // Exemplo: CAP mínimo da liga
  const maxCap = 680; // Exemplo: CAP máximo da liga

  // Verificar se está dentro dos limites
  const isCapValid = currentCap >= minCap && currentCap <= maxCap;
  const isBelowMin = currentCap < minCap;
  // const isAboveMax = currentCap > maxCap;

  const handleReleasePlayer = (playerId: number) => {
    releasePlayerMutation.mutate(playerId);
  };
  console.log(team?.data?.player_order)

  const maxStarterOvr = useMemo(() => {
    if (starters.length === 0) return null;
    return Math.max(...starters.map(p => p.ovr));
  }, [starters]);

  const PlayerCard = React.memo(({ player, index, isStarter = false, maxStarterOvr }: { player: Player; index: number; isStarter?: boolean; maxStarterOvr?: number }) => {
    const isEditing = editingPlayerId === player.id;
    return (
      <Draggable draggableId={player.id.toString()} index={index}>
        {(provided, snapshot) => (
          <Card 
            className={`mb-3 transition-all cursor-grab active:cursor-grabbing ${snapshot.isDragging ? 'shadow-lg scale-105' : ''}`}
            ref={provided.innerRef}
            {...provided.draggableProps}
            {...provided.dragHandleProps}
          >
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                {/* Coluna do badge */}
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
                {/* Conteúdo do jogador */}
                <div className="flex items-center"></div>
                <div className="flex-1 ml-3 min-w-0">
                  <div className="flex items-center space-x-2">
                    <h3
                      className="font-semibold text-md truncate"
                      title={player.name}
                    >
                      {player.name}
                    </h3>
                  </div>
                  <div className="flex items-center space-x-4 text-sm text-gray-600">
                    {isEditing ? (
                      <>
                        <input
                          type="number"
                          className="border rounded px-1 w-12 text-center"
                          value={editValues.age}
                          min={10}
                          max={50}
                          onChange={e => setEditValues(v => ({ ...v, age: Number(e.target.value) }))}
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
                    type="number"
                    className="border rounded px-1 w-14 text-center text-2xl font-bold text-gray-800 mr-5"
                    value={editValues.ovr}
                    min={0}
                    max={150}
                    onChange={e => setEditValues(v => ({ ...v, ovr: Number(e.target.value) }))}
                  />
                ) : (
                  <span className="text-2xl font-bold text-gray-800 mr-5">{player.ovr}</span>
                )}
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
                        setEditValues({ ovr: 0, age: 0 });
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
                      setEditValues({ ovr: player.ovr, age: player.age });
                    }}
                  >
                    <Pencil size={16} />
                  </Button>
                )}
                {!isEditing && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-red-600 hover:text-red-700"
                    onClick={() => setPlayerToRelease(player)}
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
            </CardContent>
          </Card>
        )}
      </Draggable>
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

  if (isLoading) {
    return (
      <div className="p-4 pb-20 flex items-center justify-center min-h-[400px]">
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
    <DragDropContext onDragEnd={handleDragEnd}>
      <div className="p-4 pb-20 space-y-6">
        {/* Team Summary */}
        <Card className="bg-gradient-to-r from-nba-dark to-nba-blue text-white">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>{team?.data?.name}</span>
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
                <p className="text-2xl font-bold">{teamPlayers.length}</p>
                <p className="text-sm opacity-80">Jogadores</p>
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
          </h2>
          <Droppable droppableId="starters">
            {(provided, snapshot) => (
              <div
                ref={provided.innerRef}
                {...provided.droppableProps}
                className={`min-h-[200px] ${snapshot.isDraggingOver ? 'bg-blue-50 rounded-lg' : ''}`}
              >
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
                      <p>Arraste jogadores aqui para formar o quinteto titular.</p>
                    </CardContent>
                  </Card>
                )}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </div>

        {/* Bench */}
        <div>
          <h2 className="text-xl font-bold mb-4">Reservas</h2>
          <Droppable droppableId="bench">
            {(provided, snapshot) => (
              <div
                ref={provided.innerRef}
                {...provided.droppableProps}
                className={`min-h-[200px] ${snapshot.isDraggingOver ? 'bg-green-50 rounded-lg' : ''}`}
              >
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
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </div>

        {/* Admin Actions */}
        {isAdmin && (
          <Card className="border-2 border-dashed border-nba-orange">
            <CardContent className="p-4 text-center">
              <h3 className="font-semibold mb-2">Ações de Admin</h3>
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
        )}
      </div>
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
    </DragDropContext>
  );
};

export default MyTeam;
