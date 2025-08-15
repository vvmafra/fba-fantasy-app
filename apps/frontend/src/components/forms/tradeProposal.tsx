import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, X, ArrowRight, User, Calendar, Shuffle } from 'lucide-react';
import { useTeams } from '@/hooks/useTeams';
import { usePlayers, usePlayersByTeam } from '@/hooks/usePlayers';
import { useTeamFuturePicks, usePicks } from '@/hooks/usePicks';
import { useTeamPickSwaps } from '@/hooks/usePickSwaps';
import { useSeasons, useActiveSeason } from '@/hooks/useSeasons';
import { useCreateTrade } from '@/hooks/useTrades';
import { CreateTradeRequest } from '@/services/tradeService';

interface TradeProposalProps {
  teamId?: number;
  isAdmin?: boolean;
  onTradeCreated?: () => void;
  canProposeTrade?: boolean;
  tradesRemaining?: number;
}

interface Participant {
  team_id: number;
  is_initiator: boolean;
  assets: Array<{
    asset_type: 'player' | 'pick' | 'swap';
    player_id?: number;
    pick_id?: number;
    swap_id?: number;
    // Para swaps: picks que serão envolvidas no swap
    swap_pick_a_id?: number; // Pick do time A
    swap_pick_b_id?: number; // Pick do time B
    swap_type?: 'best' | 'worst'; // Tipo do swap
    // Para 3+ times: quem recebe cada ativo do swap
    swap_best_to_team_id?: number; // Time que recebe a melhor pick
    swap_worst_to_team_id?: number; // Time que recebe a pior pick
    to_participant_id?: number; // novo campo
  }>;
}

const TradeProposal = ({ teamId, onTradeCreated, canProposeTrade = true, tradesRemaining = 10 }: TradeProposalProps) => {
  const [open, setOpen] = useState(false);
  const [seasonId, setSeasonId] = useState<number>(1);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [selectedTeam, setSelectedTeam] = useState<number | null>(null);

  // Hooks
  const { data: teams } = useTeams();
  const { data: players } = usePlayers({ getAll: true }); // Busca todos os jogadores
  const { data: seasons } = useSeasons();
  const { data: activeSeason } = useActiveSeason();
  // Buscar todas as picks
  const { data: allPicks } = usePicks({ getAll: true });
  // Buscar pick swaps do time
  const { data: teamSwaps } = useTeamPickSwaps(teamId || 0);
  const createTradeMutation = useCreateTrade();
  
  // Inicializar com o time do usuário se disponível
  useEffect(() => {
    if (teamId && teams?.data) {
      setParticipants([{
        team_id: teamId,
        is_initiator: true,
        assets: []
      }]);
    }
  }, [teamId, teams?.data]);

  const handleAddParticipant = () => {
    if (selectedTeam && !participants.find(p => p.team_id === selectedTeam)) {
      setParticipants([...participants, {
        team_id: selectedTeam,
        is_initiator: false,
        assets: []
      }]);
      setSelectedTeam(null);
    }
  };

  const handleRemoveParticipant = (index: number) => {
    setParticipants(participants.filter((_, i) => i !== index));
  };

  const handleAddAsset = (participantIndex: number, assetType: 'player' | 'pick' | 'swap') => {
    const updatedParticipants = [...participants];
    let to_participant_id: number | undefined = undefined;
    if (participants.length === 2) {
      // O destino é sempre o outro participante
      to_participant_id = participantIndex === 0 ? 1 : 0;
    }
    updatedParticipants[participantIndex].assets.push({
      asset_type: assetType,
      player_id: undefined,
      pick_id: undefined,
      swap_id: undefined,
      swap_pick_a_id: undefined,
      swap_pick_b_id: undefined,
      swap_type: undefined,
      swap_best_to_team_id: undefined,
      swap_worst_to_team_id: undefined,
      to_participant_id
    });
    setParticipants(updatedParticipants);
  };

  const handleRemoveAsset = (participantIndex: number, assetIndex: number) => {
    const updatedParticipants = [...participants];
    updatedParticipants[participantIndex].assets.splice(assetIndex, 1);
    setParticipants(updatedParticipants);
  };

  const handleAssetChange = (
    participantIndex: number, 
    assetIndex: number, 
    field: 'player_id' | 'pick_id' | 'swap_id' | 'swap_pick_a_id' | 'swap_pick_b_id' | 'swap_type' | 'swap_best_to_team_id' | 'swap_worst_to_team_id' | 'to_participant_id', 
    value: number | string
  ) => {
    const updatedParticipants = [...participants];
    const currentAsset = updatedParticipants[participantIndex].assets[assetIndex];
    
    // Se está mudando a pick A, resetar a pick B para forçar nova seleção
    if (field === 'swap_pick_a_id') {
      updatedParticipants[participantIndex].assets[assetIndex] = {
        ...currentAsset,
        [field]: value,
        swap_pick_b_id: undefined // Reset pick B
      } as any;
    } else {
      updatedParticipants[participantIndex].assets[assetIndex] = {
        ...currentAsset,
        [field]: value
      } as any;
    }
    
    setParticipants(updatedParticipants);
  };

  const handleSubmit = async () => {
    if (participants.length < 2) {
      alert('É necessário pelo menos 2 times para uma trade');
      return;
    }

    if (!activeSeason?.data) {
      alert('Não foi possível identificar a temporada ativa.');
      return;
    }

    // Validar se há assets inválidos (enviando para si mesmo)
    const hasInvalidAssets = participants.some((participant, index) => 
      participant.assets.some(asset => 
        asset.to_participant_id === index
      )
    );

    if (hasInvalidAssets) {
      alert('Há assets sendo enviados para o próprio time. Verifique as configurações.');
      return;
    }

    // Validar swaps: picks devem ser do mesmo ano e rodada
    const hasInvalidSwaps = participants.some(participant => 
      participant.assets.some(asset => {
        if (asset.asset_type !== 'swap') return false;
        
        if (!asset.swap_pick_a_id || !asset.swap_pick_b_id) return false;
        
        const pickA = allPicks?.find(p => p.id === asset.swap_pick_a_id);
        const pickB = allPicks?.find(p => p.id === asset.swap_pick_b_id);
        
        if (!pickA || !pickB) return false;
        
        return pickA.season_year !== pickB.season_year || pickA.round !== pickB.round;
      })
    );

    if (hasInvalidSwaps) {
      alert('As picks do swap devem ser do mesmo ano e rodada. Verifique as configurações.');
      return;
    }

    // Validar swaps: times que recebem best/worst devem ser diferentes
    const hasInvalidSwapTeams = participants.some(participant => 
      participant.assets.some(asset => {
        if (asset.asset_type !== 'swap') return false;
        
        if (!asset.swap_best_to_team_id || !asset.swap_worst_to_team_id) return false;
        
        return asset.swap_best_to_team_id === asset.swap_worst_to_team_id;
      })
    );

    if (hasInvalidSwapTeams) {
      alert('Os times que recebem a melhor e pior pick devem ser diferentes. Verifique as configurações.');
      return;
    }

    const tradeData: CreateTradeRequest = {
      season_id: activeSeason.data.id, // sempre usa a season ativa
      created_by_team: participants[0].team_id,
      participants
    };

    try {
      await createTradeMutation.mutateAsync(tradeData);
      setOpen(false);
      // Reset form
      setParticipants([{
        team_id: teamId || 1,
        is_initiator: true,
        assets: []
      }]);
      if (onTradeCreated) onTradeCreated();
    } catch (error) {
      console.error('Erro ao criar trade:', error);
    }
  };

  const getTeamName = (teamId: number) => {
    return teams?.data?.find(team => team.id === teamId)?.name || `Time ${teamId}`;
  };

  const getPlayerName = (playerId: number) => {
    return players?.data?.find(player => player.id === playerId)?.name || `Player ${playerId}`;
  };

  const getPickDescription = (pickId: number) => {
    const pick = allPicks?.find(p => p.id === pickId);
    if (!pick) return `Pick ${pickId}`;
    
    return `${pick.season_year} - ${pick.original_team_name} (${pick.round}ª rodada)`;
  };

  const getSwapDescription = (asset: any) => {
    if (asset.swap_id) {
      // Swap já existente
      const swap = teamSwaps?.find(s => s.id === asset.swap_id);
      if (!swap) return `Swap ${asset.swap_id}`;
      
      return `Pick Swap (${swap.swap_type === 'best' ? 'Melhor' : 'Pior'}) - ${swap.pick_a.round}ª rodada ${swap.pick_a.year} vs ${swap.pick_b.round}ª rodada ${swap.pick_b.year}`;
    } else {
      // Swap potencial
      const pickA = allPicks?.find(p => p.id === asset.swap_pick_a_id);
      const pickB = allPicks?.find(p => p.id === asset.swap_pick_b_id);
      
      if (!pickA || !pickB || !asset.swap_type) return 'Swap incompleto';
      
      return `Pick Swap (${asset.swap_type === 'best' ? 'Melhor' : 'Pior'}) - ${pickA.season_year} ${pickA.original_team_name} (${pickA.round}ª) vs ${pickB.season_year} ${pickB.original_team_name} (${pickB.round}ª)`;
    }
  };

  const getTeamPlayers = (teamId: number) => {
    if (!players?.data) return [];

    const filteredPlayers = players.data.filter(player => player.team_id === teamId);
    // Ordenar por OVR (maior para menor)
    return filteredPlayers.sort((a, b) => b.ovr - a.ovr);
  };

  const getTeamPicks = (teamId: number) => {
    if (!allPicks) return [];
    
    // Filtrar picks que pertencem ao time (current_team_id = teamId)
    const teamPicks = allPicks.filter(pick => pick.current_team_id === teamId);
    
    // Ordenar por ano (mais recente primeiro)
    return teamPicks.sort((a, b) => parseInt(b.season_year) - parseInt(a.season_year));
  };

  const getTeamSwaps = (teamId: number) => {
    if (!teamSwaps) return [];
    
    // Filtrar swaps que pertencem ao time
    const teamSwapsList = teamSwaps.filter(swap => swap.owned_by_team_id === teamId);
    
    return teamSwapsList;
  };

  // Função para obter picks de um time específico
  const getPicksByTeam = (teamId: number) => {
    if (!allPicks) return [];
    
    // Filtrar picks que pertencem ao time (current_team_id = teamId)
    const teamPicks = allPicks.filter(pick => pick.current_team_id === teamId);
    
    // Ordenar por ano (mais recente primeiro) e rodada
    return teamPicks.sort((a, b) => {
      const yearDiff = parseInt(b.season_year) - parseInt(a.season_year);
      if (yearDiff !== 0) return yearDiff;
      return a.round - b.round;
    });
  };

  // Função para obter picks compatíveis para swap (mesmo ano e rodada)
  const getCompatiblePicksForSwap = (teamId: number, selectedPickId?: number) => {
    if (!allPicks || !selectedPickId) return getPicksByTeam(teamId);
    
    const selectedPick = allPicks.find(pick => pick.id === selectedPickId);
    if (!selectedPick) return getPicksByTeam(teamId);
    
    // Filtrar picks do mesmo ano e rodada
    const compatiblePicks = allPicks.filter(pick => 
      pick.current_team_id === teamId &&
      pick.season_year === selectedPick.season_year &&
      pick.round === selectedPick.round
    );
    
    return compatiblePicks.sort((a, b) => {
      const yearDiff = parseInt(b.season_year) - parseInt(a.season_year);
      if (yearDiff !== 0) return yearDiff;
      return a.round - b.round;
    });
  };

  // Função para obter todos os times participantes (exceto o atual)
  const getOtherTeams = (currentTeamId: number) => {
    if (!teams?.data) return [];
    
    return teams.data.filter(team => team.id !== currentTeamId);
  };

  // Função para obter os times participantes do swap (baseado nas picks selecionadas)
  const getSwapParticipantTeams = (asset: any) => {
    if (!allPicks || !asset.swap_pick_a_id || !asset.swap_pick_b_id) return [];
    
    const pickA = allPicks.find(p => p.id === asset.swap_pick_a_id);
    const pickB = allPicks.find(p => p.id === asset.swap_pick_b_id);
    
    if (!pickA || !pickB) return [];
    
    // Retornar os times das duas picks (pode ser o mesmo time se as duas picks são do mesmo time)
    const teamIds = [];
    if (pickA.current_team_id) teamIds.push(pickA.current_team_id);
    if (pickB.current_team_id) teamIds.push(pickB.current_team_id);
    
    // Remover duplicatas
    const uniqueTeamIds = [...new Set(teamIds)];
    
    return uniqueTeamIds.map(teamId => teams?.data?.find(team => team.id === teamId)).filter(Boolean);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button 
          className={`w-full ${canProposeTrade ? 'bg-nba-blue hover:bg-nba-blue/90' : 'bg-gray-400 cursor-not-allowed'}`}
          disabled={!canProposeTrade}
        >
          <Plus size={16} className="mr-2" />
          {canProposeTrade 
            ? `Propor Nova Trade (${tradesRemaining} restantes)`
            : 'Limite de Trades Atingido'
          }
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Propor Nova Trade</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Season Selection */}
          {/* Remova este bloco! */}
          {/* <div className="space-y-2">
            <Label htmlFor="season">Temporada</Label>
            <Select value={seasonId.toString()} onValueChange={(value) => setSeasonId(Number(value))}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione a temporada" />
              </SelectTrigger>
                             <SelectContent>
                 {seasons?.data?.map((season) => (
                   <SelectItem key={season.id} value={season.id.toString()}>
                     Temporada {season.season_number} ({season.year})
                   </SelectItem>
                 ))}
               </SelectContent>
            </Select>
          </div> */}

          {/* Participants */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Participantes</h3>
              </div>
              <div>
              <div className="flex items-center space-x-2">
                <Select value={selectedTeam?.toString() || ''} onValueChange={(value) => setSelectedTeam(Number(value))}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Adicionar time" />
                  </SelectTrigger>
                  <SelectContent>
                    {teams?.data?.sort((a, b) => a.name.localeCompare(b.name)).map((team) => (
                      <SelectItem key={team.id} value={team.id.toString()}>
                        {team.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button onClick={handleAddParticipant} disabled={!selectedTeam}>
                  <Plus size={16} />
                </Button>
              </div>
            </div>

            {participants.map((participant, participantIndex) => (
              <Card key={participantIndex}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base flex items-center">
                      <Badge variant={participant.is_initiator ? "default" : "secondary"} className="mr-2">
                        {participant.is_initiator ? "Iniciador" : "Participante"}
                      </Badge>
                      {getTeamName(participant.team_id)}
                    </CardTitle>
                    {participantIndex > 0 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveParticipant(participantIndex)}
                      >
                        <X size={16} />
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Assets */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium">Assets</h4>
                      <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2 w-full">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleAddAsset(participantIndex, 'player')}
                          className="w-full sm:w-auto"
                        >
                          <User size={14} className="mr-1" />
                          Adicionar Jogador
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleAddAsset(participantIndex, 'pick')}
                          className="w-full sm:w-auto"
                        >
                          <Calendar size={14} className="mr-1" />
                          Adicionar Pick
                        </Button>
                        {participants.length >= 2 && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleAddAsset(participantIndex, 'swap')}
                            className="w-full sm:w-auto"
                          >
                            <Shuffle size={14} className="mr-1" />
                            Adicionar Swap
                          </Button>
                        )}
                      </div>
                    </div>

                    {participant.assets.map((asset, assetIndex) => (
                      <div key={assetIndex} className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-2 p-3 border rounded-lg">
                        <Select
                          value={asset.asset_type}
                          onValueChange={(value: 'player' | 'pick') => {
                            const updatedParticipants = [...participants];
                            let to_participant_id: number | undefined = asset.to_participant_id;
                            if (participants.length === 2) {
                              to_participant_id = participantIndex === 0 ? 1 : 0;
                            }
                            updatedParticipants[participantIndex].assets[assetIndex] = {
                              asset_type: value,
                              player_id: undefined,
                              pick_id: undefined,
                              swap_id: undefined,
                              swap_pick_a_id: undefined,
                              swap_pick_b_id: undefined,
                              swap_type: undefined,
                              swap_best_to_team_id: undefined,
                              swap_worst_to_team_id: undefined,
                              to_participant_id
                            };
                            setParticipants(updatedParticipants);
                          }}
                        >
                          <SelectTrigger className="w-24">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="player">Jogador</SelectItem>
                            <SelectItem value="pick">Pick</SelectItem>
                            <SelectItem value="swap">Pick Swap</SelectItem>
                          </SelectContent>
                        </Select>

                        {asset.asset_type === 'player' ? (
                          <Select
                            value={asset.player_id?.toString() || ''}
                            onValueChange={(value) => handleAssetChange(participantIndex, assetIndex, 'player_id', Number(value))}
                          >
                            <SelectTrigger className="flex-1">
                              <SelectValue placeholder="Selecionar jogador" />
                            </SelectTrigger>
                            <SelectContent>
                              {getTeamPlayers(participant.team_id).map(player => (
                                <SelectItem key={player.id} value={player.id.toString()}>
                                  {player.position}: {player.name} - {player.ovr} | {player.age}y
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : asset.asset_type === 'pick' ? (
                          <Select
                            value={asset.pick_id?.toString() || ''}
                            onValueChange={(value) => handleAssetChange(participantIndex, assetIndex, 'pick_id', Number(value))}
                          >
                            <SelectTrigger className="flex-1">
                              <SelectValue placeholder="Selecionar pick" />
                            </SelectTrigger>
                            <SelectContent>
                              {getTeamPicks(participant.team_id).map((pick) => (
                                <SelectItem key={pick.id} value={pick.id.toString()}>
                                  {pick.season_year} - {pick.original_team_name} ({pick.round}ª rodada)
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : (
                          <div className="flex-1 space-y-2">
                            {/* Seleção da primeira pick */}
                            <Select
                              value={asset.swap_pick_a_id?.toString() || ''}
                              onValueChange={(value) => handleAssetChange(participantIndex, assetIndex, 'swap_pick_a_id', Number(value))}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Selecionar pick A" />
                              </SelectTrigger>
                              <SelectContent>
                                {getPicksByTeam(participant.team_id).map((pick) => (
                                  <SelectItem key={pick.id} value={pick.id.toString()}>
                                    {pick.season_year} - {pick.original_team_name} ({pick.round}ª rodada)
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            
                            {/* Seleção da segunda pick */}
                            <Select
                              value={asset.swap_pick_b_id?.toString() || ''}
                              onValueChange={(value) => handleAssetChange(participantIndex, assetIndex, 'swap_pick_b_id', Number(value))}
                              disabled={!asset.swap_pick_a_id}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder={!asset.swap_pick_a_id ? "Primeiro selecione a pick A" : "Selecionar pick B"} />
                              </SelectTrigger>
                              <SelectContent>
                                {participants.length === 2 ? (
                                  // Para 2 times: mostrar picks compatíveis do outro time
                                  getCompatiblePicksForSwap(
                                    participants.find(p => p.team_id !== participant.team_id)?.team_id || 0,
                                    asset.swap_pick_a_id
                                  ).map((pick) => (
                                    <SelectItem key={pick.id} value={pick.id.toString()}>
                                      {pick.season_year} - {pick.original_team_name} ({pick.round}ª rodada)
                                    </SelectItem>
                                  ))
                                ) : (
                                  // Para 3+ times: mostrar picks compatíveis dos outros times
                                  participants
                                    .filter(p => p.team_id !== participant.team_id)
                                    .flatMap(p => getCompatiblePicksForSwap(p.team_id, asset.swap_pick_a_id))
                                    .map((pick) => (
                                      <SelectItem key={pick.id} value={pick.id.toString()}>
                                        {pick.season_year} - {pick.original_team_name} ({pick.round}ª rodada) - {pick.current_team_name}
                                      </SelectItem>
                                    ))
                                )}
                                {asset.swap_pick_a_id && (
                                  participants.length === 2 ? 
                                    getCompatiblePicksForSwap(
                                      participants.find(p => p.team_id !== participant.team_id)?.team_id || 0,
                                      asset.swap_pick_a_id
                                    ).length === 0 :
                                    participants
                                      .filter(p => p.team_id !== participant.team_id)
                                      .flatMap(p => getCompatiblePicksForSwap(p.team_id, asset.swap_pick_a_id))
                                      .length === 0
                                ) && (
                                  <SelectItem value="" disabled>
                                    Nenhuma pick compatível encontrada
                                  </SelectItem>
                                )}
                              </SelectContent>
                            </Select>
                            
                            {/* Seleção do tipo de swap */}
                            <Select
                              value={asset.swap_type || ''}
                              onValueChange={(value) => handleAssetChange(participantIndex, assetIndex, 'swap_type', value)}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Tipo do swap" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="best">Melhor Pick</SelectItem>
                                <SelectItem value="worst">Pior Pick</SelectItem>
                              </SelectContent>
                            </Select>
                            
                            {/* Para 3+ times: seleção de quem recebe cada ativo */}
                            {participants.length > 2 && asset.swap_type && (
                              <div className="space-y-2">
                                <div className="text-xs font-medium text-gray-700">
                                  Quem recebe cada ativo:
                                </div>
                                <Select
                                  value={asset.swap_best_to_team_id?.toString() || ''}
                                  onValueChange={(value) => handleAssetChange(participantIndex, assetIndex, 'swap_best_to_team_id', Number(value))}
                                >
                                  <SelectTrigger>
                                    <SelectValue placeholder="Quem recebe a melhor pick?" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {getSwapParticipantTeams(asset).map((team) => (
                                      <SelectItem key={team.id} value={team.id.toString()}>
                                        {team.name}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                <Select
                                  value={asset.swap_worst_to_team_id?.toString() || ''}
                                  onValueChange={(value) => handleAssetChange(participantIndex, assetIndex, 'swap_worst_to_team_id', Number(value))}
                                >
                                  <SelectTrigger>
                                    <SelectValue placeholder="Quem recebe a pior pick?" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {getSwapParticipantTeams(asset).map((team) => (
                                      <SelectItem key={team.id} value={team.id.toString()}>
                                        {team.name}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                            )}
                          </div>
                        )}

                        {participants.length > 2 && (
                          <Select
                            value={asset.to_participant_id !== undefined ? participants[asset.to_participant_id]?.team_id.toString() || '' : ''}
                            onValueChange={(value) => {
                              // Encontrar o índice do participante baseado no team_id selecionado
                              const targetParticipantIndex = participants.findIndex(p => p.team_id === Number(value));
                              if (targetParticipantIndex !== -1 && targetParticipantIndex !== participantIndex) {
                                handleAssetChange(participantIndex, assetIndex, 'to_participant_id', targetParticipantIndex);
                              }
                            }}
                          >
                            <SelectTrigger className="w-40">
                              <SelectValue placeholder="Time destino" />
                            </SelectTrigger>
                            <SelectContent>
                              {participants
                                .filter((p, pIndex) => p.team_id !== participant.team_id && pIndex !== participantIndex)
                                .map((p) => (
                                  <SelectItem key={p.team_id} value={p.team_id.toString()}>
                                    {getTeamName(p.team_id)}
                                  </SelectItem>
                                ))}
                            </SelectContent>
                          </Select>
                        )}

                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveAsset(participantIndex, assetIndex)}
                        >
                          <X size={16} />
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Summary */}
          {participants.length >= 2 && (
            <Card className="bg-gray-50">
              <CardHeader>
                <CardTitle className="text-base">Resumo da Trade</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {participants.map((participant, index) => {
                    let sending = [];
                    let receiving = [];

                    if (participants.length === 2) {
                      // 2 times: tudo que propôs está enviando, tudo do outro está recebendo
                      const other = participants.find((p) => p.team_id !== participant.team_id);
                      sending = participant.assets;
                      receiving = other ? other.assets : [];
                    } else {
                      // 3+ times: usa o campo to_participant_id
                      sending = participant.assets.filter(
                        (asset) => asset.to_participant_id !== undefined && asset.to_participant_id !== index
                      );
                      receiving = participants
                        .flatMap((p, pIndex) =>
                          p.assets
                            .filter(
                              (asset) =>
                                asset.to_participant_id === index &&
                                pIndex !== index
                            )
                            .map((asset) => ({ ...asset, from_team_id: p.team_id }))
                        );
                    }

                    return (
                      <div key={index} className="border rounded-lg p-3 bg-white mb-2">
                        <div className="font-medium mb-1">{getTeamName(participant.team_id)}</div>
                        <div className="text-sm text-gray-700">
                          <strong>Enviando:</strong>{' '}
                          {sending.length === 0
                            ? 'Nenhum asset'
                            : sending
                                .map((asset) =>
                                  asset.asset_type === 'player'
                                    ? getPlayerName(asset.player_id || 0)
                                    : asset.asset_type === 'pick'
                                    ? getPickDescription(asset.pick_id || 0)
                                    : getSwapDescription(asset)
                                )
                                .join(', ')}
                        </div>
                        <div className="text-sm text-gray-700">
                          <strong>Recebendo:</strong>{' '}
                          {receiving.length === 0
                            ? 'Nenhum asset'
                            : receiving
                                .map((asset) =>
                                  asset.asset_type === 'player'
                                    ? getPlayerName(asset.player_id || 0)
                                    : asset.asset_type === 'pick'
                                    ? getPickDescription(asset.pick_id || 0)
                                    : getSwapDescription(asset)
                                )
                                .join(', ')}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Actions */}
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={handleSubmit}
              disabled={participants.length < 2 || createTradeMutation.isPending}
              className="bg-nba-blue hover:bg-nba-blue/90"
            >
              {createTradeMutation.isPending ? 'Criando...' : 'Propor Trade'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TradeProposal;
