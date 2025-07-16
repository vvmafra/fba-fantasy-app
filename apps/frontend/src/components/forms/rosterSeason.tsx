import React, { useState, useEffect, useCallback } from 'react';
import { DndContext, closestCenter, DragEndEvent } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, arrayMove } from '@dnd-kit/sortable';

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { playerService } from '@/services/playerService';
import { rosterService } from '@/services/rosterService';
import { teamService, Team } from '@/services/teamService';
import { useToast } from '@/hooks/use-toast';
import { AlertCircle, Trophy, UserX } from 'lucide-react';

// Componentes locais
import { PlayerList } from './roster/PlayerList';
import { RotationSettings } from './roster/RotationSettings';
import { SummaryCard } from './roster/SummaryCard';
import { RulesCard } from './roster/RulesCard';
import { useRosterValidation } from './roster/useRosterValidation';
import { PlayerWithMinutes, ValidationErrors, RosterFormData } from './roster/types';
import { StrategyOptions } from './roster/StrategyOptions';

interface RosterSeasonFormProps {
  isOpen: boolean;
  onClose: () => void;
  teamId: number;
  seasonId: number;
  isAdmin: boolean;
  onSuccess?: () => void;
  deadline?: Date | null;
  hasExistingRoster?: boolean;
}

export function RosterSeasonForm({ isOpen, onClose, teamId, seasonId, isAdmin, onSuccess, deadline, hasExistingRoster }: RosterSeasonFormProps) {
  const [players, setPlayers] = useState<PlayerWithMinutes[]>([]);
  const [starters, setStarters] = useState<PlayerWithMinutes[]>([]);
  const [bench, setBench] = useState<PlayerWithMinutes[]>([]);
  const [team, setTeam] = useState<Team | null>(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [rotationStyle, setRotationStyle] = useState<'automatic' | 'manual'>('manual');

  // Função para lidar com mudança no estilo de rotação
  const handleRotationStyleChange = (value: 'automatic' | 'manual') => {
    setRotationStyle(value);
    
    // Se mudar para automático, distribuir 240 minutos automaticamente
    if (value === 'automatic') {
      const activePlayers = players.filter(p => !p.isGLeague);
      const totalActivePlayers = activePlayers.length;
      
      if (totalActivePlayers > 0) {
        // Distribuir minutos de forma equilibrada
        const baseMinutes = Math.floor(240 / totalActivePlayers);
        const remainingMinutes = 240 % totalActivePlayers;
        
        const updatedPlayers = players.map(player => {
          if (player.isGLeague) {
            return { ...player, minutes: 0 };
          }
          
          // Dar minutos extras para os primeiros jogadores se houver resto
          const playerIndex = activePlayers.findIndex(p => p.id === player.id);
          const extraMinutes = playerIndex < remainingMinutes ? 1 : 0;
          
          return {
            ...player,
            minutes: baseMinutes + extraMinutes
          };
        });
        
        setPlayers(updatedPlayers);
        setStarters(updatedPlayers.slice(0, 5));
        setBench(updatedPlayers.slice(5));
      }
    }
  };
  const [gameStyle, setGameStyle] = useState('');
  const [offenseStyle, setOffenseStyle] = useState('');
  const [defenseStyle, setDefenseStyle] = useState('');
  const [offensiveTempo, setOffensiveTempo] = useState<'No preference' | 'Patient Offense' | 'Average Tempo' | 'Shoot at Will'>('No preference');
  const [offensiveRebounding, setOffensiveRebounding] = useState<'Limit Transition' | 'No preference' | 'Crash Offensive Glass' | 'Some Crash, Others Get Back'>('No preference');
  const [defensiveAggression, setDefensiveAggression] = useState<'Play Physical Defense' | 'No preference' | 'Conservative Defense' | 'Neutral Defensive Aggression'>('No preference');
  const [defensiveRebounding, setDefensiveRebounding] = useState<'Run in Transition' | 'Crash Defensive Glass' | 'Some Crash, Others Run' | 'No preference'>('No preference');
  const [franchisePlayerId, setFranchisePlayerId] = useState<number | null>(null);
  const [agePreference, setAgePreference] = useState<number | null>(null);
  const [totalPlayersRotation, setTotalPlayersRotation] = useState<number>(8);
  const [gleague1PlayerId, setGLeague1PlayerId] = useState<number | null>(null);
  const [gleague2PlayerId, setGLeague2PlayerId] = useState<number | null>(null);
  const [existingRosterId, setExistingRosterId] = useState<number | null>(null);
  const [selectedPlayerId, setSelectedPlayerId] = useState<number | null>(null);

  // Função para troca por clique
  const handlePlayerClick = (playerId: number) => {
    if (selectedPlayerId === null) {
      setSelectedPlayerId(playerId);
      return;
    }
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
    // Se quiser salvar ordem, chame debouncedSave(newStarters, newBench)
    setSelectedPlayerId(null);
  };
  
  const { toast } = useToast();

  // Carregar jogadores do time e informações do time
  useEffect(() => {
    if (isOpen && teamId) {
      loadTeamData();
    }
  }, [isOpen, teamId]);

  const loadTeamData = async () => {
    setLoading(true);
    try {
      // Verificar se já existe um roster para este time na temporada
      const existingRoster = await rosterService.getRosterByTeamAndSeason(teamId, seasonId);
      if (existingRoster) {
        setExistingRosterId(existingRoster.id);
        
        // Carregar dados do roster existente
        setRotationStyle(existingRoster.rotation_style);
        setGameStyle(existingRoster.game_style || '');
        setOffenseStyle(existingRoster.offense_style || '');
        setDefenseStyle(existingRoster.defense_style || '');
        setOffensiveTempo(existingRoster.offensive_tempo || 'No preference');
        setOffensiveRebounding(existingRoster.offensive_rebounding || 'No preference');
        setDefensiveAggression(existingRoster.defensive_aggression || 'No preference');
        setDefensiveRebounding(existingRoster.defensive_rebounding || 'No preference');
        setFranchisePlayerId(existingRoster.franchise_player_id);
        setAgePreference(existingRoster.age_preference);
        setTotalPlayersRotation(existingRoster.total_players_rotation || 8);
        setGLeague1PlayerId(existingRoster.gleague1_player_id);
        setGLeague2PlayerId(existingRoster.gleague2_player_id);
        
        toast({
          title: "Roster Carregado",
          description: "Roster existente carregado. Você pode fazer alterações e salvar.",
        });
      }

      // Carregar informações do time
      const teamResponse = await teamService.getTeamById(teamId);
      if (teamResponse.success && teamResponse.data) {
        setTeam(teamResponse.data);
      }

      // Carregar jogadores do time
      const playersResponse = await playerService.getPlayersByTeam(teamId);

      if (playersResponse.success && playersResponse.data) {
        // Ordenar por OVR decrescente
        const sortedPlayers = playersResponse.data.sort((a, b) => b.ovr - a.ovr);
        
        // Inicializar com minutos padrão ou carregar do roster existente
        let playersWithMinutes: PlayerWithMinutes[];
        
        if (existingRoster && existingRoster.rotation_style === 'manual') {
          // Carregar minutos do roster existente (agora arrays de pares)
          const minutesStartingArr: [number, number][] = existingRoster.minutes_starting || [];
          const minutesBenchArr: [number, number][] = existingRoster.minutes_bench || [];
          
          const startingPlayerIds = minutesStartingArr.map(([id]) => id);
          const benchPlayerIds = minutesBenchArr.map(([id]) => id);
          const orderedPlayerIds = [...startingPlayerIds, ...benchPlayerIds];
          const savedPlayerIds = new Set(orderedPlayerIds);

          // Jogadores do roster salvo, na ordem
          const playersFromRoster = orderedPlayerIds
            .map(playerId => {
              const player = sortedPlayers.find(p => p.id === playerId);
              if (!player) return null;
              const minStart = minutesStartingArr.find(([pid]) => pid === playerId)?.[1];
              const minBench = minutesBenchArr.find(([pid]) => pid === playerId)?.[1];
              return {
                ...player,
                minutes: minStart ?? minBench ?? 0,
                isGLeague: existingRoster.gleague1_player_id === playerId || existingRoster.gleague2_player_id === playerId,
                isStarter: startingPlayerIds.includes(playerId)
              };
            })
            .filter(Boolean) as PlayerWithMinutes[];

          // Jogadores novos (não estavam no roster salvo)
          const newPlayers = sortedPlayers
            .filter(p => !savedPlayerIds.has(p.id))
            .map(player => ({
              ...player,
              minutes: 0,
              isGLeague: false,
              isStarter: false
            }));

          playersWithMinutes = [...playersFromRoster, ...newPlayers];
        } else {
          // Usar ordem salva do time (player_order) ou padrão
          const savedOrder = teamResponse.data?.player_order;
          if (savedOrder && savedOrder.starters && savedOrder.bench) {
            const currentPlayerIds = sortedPlayers.map(p => p.id);
            
            // Filtrar apenas IDs válidos
            const validStarters = savedOrder.starters.filter((id: number) => currentPlayerIds.includes(id));
            const validBench = savedOrder.bench.filter((id: number) => currentPlayerIds.includes(id));
            
            // Jogadores que não estão na ordem salva (novos jogadores)
            const newPlayerIds = currentPlayerIds.filter(id => 
              !validStarters.includes(id) && !validBench.includes(id)
            );

            // Ordenar jogadores conforme ordem salva
            const orderedStarters = validStarters.map((id: number) => 
              sortedPlayers.find(p => p.id === id)
            ).filter(Boolean) as PlayerWithMinutes[];

            const orderedBench = validBench.map((id: number) => 
              sortedPlayers.find(p => p.id === id)
            ).filter(Boolean) as PlayerWithMinutes[];

            const newPlayers = newPlayerIds.map((id: number) => 
              sortedPlayers.find(p => p.id === id)
            ).filter(Boolean) as PlayerWithMinutes[];

            // Criar jogadores na ordem correta
            playersWithMinutes = [...orderedStarters, ...orderedBench, ...newPlayers].map((player, index) => ({
              ...player,
              minutes: index < 5 ? 35 : index < 10 ? 13 : 0,
              isGLeague: false,
              isStarter: index < 5
            }));
          } else {
            // Ordem padrão: 5 primeiros como titulares, resto como reservas
            playersWithMinutes = sortedPlayers.map((player, index) => ({
              ...player,
              minutes: index < 5 ? 35 : index < 10 ? 13 : 0,
              isGLeague: false,
              isStarter: index < 5
            }));
          }
        }
        
        setPlayers(playersWithMinutes);
        
        // Separar titulares e reservas baseado na ordem atual
        if (existingRoster && existingRoster.rotation_style === 'manual') {
          const minutesStartingArr = existingRoster.minutes_starting || [];
          const minutesBenchArr = existingRoster.minutes_bench || [];

          const startingPlayerIds = minutesStartingArr.map(([id]) => id);
          const benchPlayerIds = minutesBenchArr.map(([id]) => id);

          const starters = playersWithMinutes.filter(p => startingPlayerIds.includes(p.id));
          const bench = playersWithMinutes.filter(p => benchPlayerIds.includes(p.id));

          setStarters(starters);
          setBench(bench);
        } else {
          // Usar ordem atual dos jogadores
          setStarters(playersWithMinutes.slice(0, 5));
          setBench(playersWithMinutes.slice(5));
        }
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao carregar dados do time",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Atualizar minutos de um jogador
  const updatePlayerMinutes = (playerId: number, minutes: number) => {
    setPlayers(prev => prev.map(player => 
      player.id === playerId ? { ...player, minutes } : player
    ));
    setStarters(prev => prev.map(player => 
      player.id === playerId ? { ...player, minutes } : player
    ));
    setBench(prev => prev.map(player => 
      player.id === playerId ? { ...player, minutes } : player
    ));
  };

  // Função para lidar com o drag and drop
  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;

    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    // Se está movendo para a mesma posição, não faz nada
    if (activeId === overId) return;

    // Encontrar em qual lista está o item ativo
    const activePlayer = [...starters, ...bench].find(p => p.id.toString() === activeId);
    if (!activePlayer) return;

    const isActiveInStarters = starters.some(p => p.id.toString() === activeId);
    const isOverInStarters = starters.some(p => p.id.toString() === overId);

    let newStarters = [...starters];
    let newBench = [...bench];

    // Se está movendo dentro da mesma lista
    if (isActiveInStarters === isOverInStarters) {
      if (isActiveInStarters) {
        // Movendo dentro dos titulares
        const oldIndex = starters.findIndex(p => p.id.toString() === activeId);
        const newIndex = starters.findIndex(p => p.id.toString() === overId);
        newStarters = arrayMove(starters, oldIndex, newIndex);
      } else {
        // Movendo dentro das reservas
        const oldIndex = bench.findIndex(p => p.id.toString() === activeId);
        const newIndex = bench.findIndex(p => p.id.toString() === overId);
        newBench = arrayMove(bench, oldIndex, newIndex);
      }
    } else {
      // Movendo entre listas diferentes
      if (isActiveInStarters) {
        // Movendo de titulares para reservas
        const starterIndex = starters.findIndex(p => p.id.toString() === activeId);
        const benchIndex = bench.findIndex(p => p.id.toString() === overId);
        
        const [movedPlayer] = newStarters.splice(starterIndex, 1);
        newBench.splice(benchIndex, 0, movedPlayer);
      } else {
        // Movendo de reservas para titulares
        const benchIndex = bench.findIndex(p => p.id.toString() === activeId);
        const starterIndex = starters.findIndex(p => p.id.toString() === overId);
        
        const [movedPlayer] = newBench.splice(benchIndex, 1);
        newStarters.splice(starterIndex, 0, movedPlayer);
      }
    }

    // Atualizar estado
    setStarters(newStarters);
    setBench(newBench);
    
    // Atualizar lista completa de jogadores mantendo a ordem: titulares + reservas
    setPlayers([...newStarters, ...newBench]);
  }, [starters, bench]);

  // Toggle G-League
  const toggleGLeague = (playerId: number) => {
    setPlayers(prev => prev.map(player => 
      player.id === playerId ? { ...player, isGLeague: !player.isGLeague } : player
    ));
    setStarters(prev => prev.map(player => 
      player.id === playerId ? { ...player, isGLeague: !player.isGLeague } : player
    ));
    setBench(prev => prev.map(player => 
      player.id === playerId ? { ...player, isGLeague: !player.isGLeague } : player
    ));
  };

  // Usar hook de validação
  const validationErrors = useRosterValidation(players, starters, bench, rotationStyle, gameStyle, offenseStyle, defenseStyle);

  // Atualizar erros sempre que a validação mudar
  useEffect(() => {
    setErrors(validationErrors);
  }, [validationErrors]);

  // Enviar formulário
  const handleSubmit = async () => {
    if (Object.keys(validationErrors).length > 0) {
      toast({
        title: "Erro de Validação",
        description: "Corrija os erros antes de enviar",
        variant: "destructive"
      });
      return;
    }

    setSubmitting(true);
    try {
      let rosterData: RosterFormData;

      if (rotationStyle === 'manual') {
        const activePlayers = players.filter(p => !p.isGLeague);
        const gleaguePlayers = players.filter(p => p.isGLeague);

        // Preservar a ordem atual dos jogadores (titulares + reservas)
        const currentOrder = [...starters, ...bench];
        const activePlayersInOrder = currentOrder.filter(p => !p.isGLeague);
        
        // Separar titulares (primeiros 5 ativos) e reservas (resto)
        const startingPlayers = activePlayersInOrder.slice(0, 5);
        const benchPlayers = activePlayersInOrder.slice(5);

        // Criar objetos de minutos preservando a ordem dos jogadores
        const minutesStarting: [number, number][] = startingPlayers.map(player => [player.id, player.minutes]);
        const minutesBench: [number, number][] = benchPlayers.map(player => [player.id, player.minutes]);

        rosterData = {
          season_id: seasonId,
          team_id: teamId,
          rotation_style: rotationStyle,
          minutes_starting: minutesStarting,
          minutes_bench: minutesBench,
          gleague1_player_id: gleaguePlayers[0]?.id || null,
          gleague2_player_id: gleaguePlayers[1]?.id || null,
          total_players_rotation: totalPlayersRotation,
          age_preference: agePreference !== null ? Number(agePreference) : null,
          game_style: gameStyle,
          franchise_player_id: franchisePlayerId,
          offense_style: offenseStyle,
          defense_style: defenseStyle,
          offensive_tempo: offensiveTempo,
          offensive_rebounding: offensiveRebounding,
          defensive_aggression: defensiveAggression,
          defensive_rebounding: defensiveRebounding
        };
      } else {
        // Modo automático - não envia minutos específicos
        rosterData = {
          season_id: seasonId,
          team_id: teamId,
          rotation_style: rotationStyle,
          minutes_starting: [],
          minutes_bench: [],
          gleague1_player_id: gleague1PlayerId,
          gleague2_player_id: gleague2PlayerId,
          total_players_rotation: totalPlayersRotation,
          age_preference: agePreference !== null ? Number(agePreference) : null,
          game_style: gameStyle,
          franchise_player_id: franchisePlayerId,
          offense_style: offenseStyle,
          defense_style: defenseStyle,
          offensive_tempo: offensiveTempo,
          offensive_rebounding: offensiveRebounding,
          defensive_aggression: defensiveAggression,
          defensive_rebounding: defensiveRebounding
        };
      }

      if (existingRosterId) {
        // Atualizar roster existente
        await rosterService.updateRoster(existingRosterId, rosterData);
        
        toast({
          title: "Sucesso",
          description: "Roster da temporada atualizado com sucesso!",
        });
      } else {
        // Criar novo roster
        await rosterService.createRoster(rosterData);
        
        toast({
          title: "Sucesso",
          description: "Roster da temporada criado com sucesso!",
        });
      }

      onSuccess?.();
      onClose();
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao criar roster da temporada",
        variant: "destructive"
      });
    } finally {
      setSubmitting(false);
    }
  };

  const totalMinutes = players.filter(p => !p.isGLeague).reduce((sum, p) => sum + p.minutes, 0);
  const activePlayers = players.filter(p => p.minutes > 0 && !p.isGLeague);
  const gleaguePlayers = players.filter(p => p.isGLeague);

  // Verificar se o prazo já passou (só bloqueia se não enviou)
  if (deadline && !hasExistingRoster) {
    const now = new Date();
    if (now.getTime() > deadline.getTime()) {
      return (
        <Dialog open={isOpen} onOpenChange={onClose}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-lg">
                <AlertCircle className="h-5 w-5 text-red-500" />
                Prazo Expirado
              </DialogTitle>
            </DialogHeader>
            <div className="text-center py-8">
              <AlertCircle className="h-12 w-12 mx-auto text-red-500 mb-4" />
              <p className="text-muted-foreground">
                O prazo para envio do roster já passou. Aguarde a próxima temporada para um novo ciclo.
              </p>
            </div>
            <DialogFooter>
              <Button onClick={onClose} className="w-full">
                Fechar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      );
    }
  }

  // Verificar se o usuário tem acesso (apenas dono do time)
  if (!isAdmin) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg">
              <UserX className="h-5 w-5" />
              Acesso Negado
            </DialogTitle>
          </DialogHeader>
          <div className="text-center py-8">
            <UserX className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">
              Apenas o dono do time pode gerenciar o roster da temporada.
            </p>
          </div>
          <DialogFooter>
            <Button onClick={onClose} className="w-full">
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  if (loading) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-md flex items-center justify-center py-8">
          <img src="/loading.gif" alt="Carregando..." className="h-16 w-16" />
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl w-full max-h-[90vh] overflow-y-auto p-4 md:p-6">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg md:text-xl">
            <Trophy className="h-5 w-5" />
            Formulário Roster Temporada
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 md:space-y-6">
          {/* Configurações de Rotação */}
          <RotationSettings
            rotationStyle={rotationStyle}
            gameStyle={gameStyle}
            offenseStyle={offenseStyle}
            defenseStyle={defenseStyle}
            franchisePlayerId={franchisePlayerId}
            players={players}
            totalPlayersRotation={totalPlayersRotation}
            agePreference={agePreference}
            gleague1PlayerId={gleague1PlayerId}
            gleague2PlayerId={gleague2PlayerId}
            onRotationStyleChange={handleRotationStyleChange}
            onGameStyleChange={setGameStyle}
            onOffenseStyleChange={setOffenseStyle}
            onDefenseStyleChange={setDefenseStyle}
            onFranchisePlayerChange={setFranchisePlayerId}
            onTotalPlayersRotationChange={setTotalPlayersRotation}
            onAgePreferenceChange={setAgePreference}
            onGLeague1PlayerChange={setGLeague1PlayerId}
            onGLeague2PlayerChange={setGLeague2PlayerId}
          />

          {/* Estratégias de Jogo */}
          <StrategyOptions
            offensiveTempo={offensiveTempo}
            setOffensiveTempo={setOffensiveTempo}
            offensiveRebounding={offensiveRebounding}
            setOffensiveRebounding={setOffensiveRebounding}
            defensiveAggression={defensiveAggression}
            setDefensiveAggression={setDefensiveAggression}
            defensiveRebounding={defensiveRebounding}
            setDefensiveRebounding={setDefensiveRebounding}
          />

          {/* Lista de Jogadores com Drag and Drop - apenas no modo manual */}
          {rotationStyle === 'manual' && (
            <DndContext
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              {/* Titulares */}
              <SortableContext items={starters.map(p => p.id.toString())} strategy={verticalListSortingStrategy}>
                <PlayerList
                  title="Quinteto Titular"
                  droppableId="starters"
                  players={starters}
                  isStarter={true}
                  onToggleGLeague={toggleGLeague}
                  onUpdateMinutes={updatePlayerMinutes}
                  gleaguePlayersCount={gleaguePlayers.length}
                  totalPlayersCount={players.length}
                  onPlayerClick={handlePlayerClick}
                  selectedPlayerId={selectedPlayerId}
                />
              </SortableContext>

              {/* Reservas */}
              <SortableContext items={bench.map(p => p.id.toString())} strategy={verticalListSortingStrategy}>
                <PlayerList
                  title="Reservas"
                  droppableId="bench"
                  players={bench}
                  isStarter={false}
                  onToggleGLeague={toggleGLeague}
                  onUpdateMinutes={updatePlayerMinutes}
                  gleaguePlayersCount={gleaguePlayers.length}
                  totalPlayersCount={players.length}
                  onPlayerClick={handlePlayerClick}
                  selectedPlayerId={selectedPlayerId}
                />
              </SortableContext>
            </DndContext>
          )}

          {/* Resumo */}
          <SummaryCard
            totalMinutes={totalMinutes}
            activePlayers={activePlayers.length}
            gleaguePlayers={gleaguePlayers.length}
            totalPlayers={players.length}
          />
        </div>

         {/* Erros de Validação */}
         {Object.keys(errors).length > 0 && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <ul className="list-disc list-inside space-y-1">
                    {Object.values(errors).map((error, index) => (
                      <li key={index}>{error}</li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>
            )}

        <DialogFooter className="flex flex-col md:flex-row gap-2 md:gap-3">
          <Button 
            variant="outline" 
            onClick={onClose} 
            disabled={submitting}
            className="w-full md:w-auto"
          >
            Cancelar
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={submitting || Object.keys(errors).length > 0 || (deadline && new Date().getTime() > deadline.getTime())}
            className="w-full md:w-auto"
          >
            {submitting ? 'Salvando...' : (deadline && new Date().getTime() > deadline.getTime()) ? 'Prazo Expirado' : 'Salvar Roster'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
