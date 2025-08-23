import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import { useDraftPicks, useToggleAddedTo2k, useCreateDraftPick, useDeleteDraftPick, useNextPickNumber, useUpdateDraftPick } from '@/hooks/useDraftPicks';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { draftPickService } from '@/services/draftPickService';
import { useToast } from '@/hooks/use-toast';
import { useSeasons, useActiveSeason } from '@/hooks/useSeasons';
import { useTeams } from '@/hooks/useTeams';
import { CreateDraftPickData, DraftPick } from '@/services/draftPickService';
import { Plus, Edit, Check, ChevronUp, ChevronDown } from 'lucide-react';
import { useUpdatePlayer, useAllPlayers } from '@/hooks/usePlayers';
import { usePlayers } from '@/hooks/usePlayers';
import { useCreatePlayer } from '@/hooks/usePlayers';

const DraftPicksPage = () => {
  const { isAdmin } = useAuth();
  
  // Estados
  const [selectedSeason, setSelectedSeason] = useState<number | undefined>(undefined);
  const [selectedTeam, setSelectedTeam] = useState<number | undefined>(undefined);
  const [sortColumn, setSortColumn] = useState<string>('pick_number');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showAddPlayerModal, setShowAddPlayerModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showCreatePlayerModal, setShowCreatePlayerModal] = useState(false);
  const [showTransferPlayerModal, setShowTransferPlayerModal] = useState(false);
  const [selectedPickForPlayer, setSelectedPickForPlayer] = useState<number | null>(null);
  const [selectedPickForEdit, setSelectedPickForEdit] = useState<any>(null);
  const [newPickData, setNewPickData] = useState<CreateDraftPickData>({
    season_id: 0,
    team_id: 0,
    pick_number: 1,
  });
  const [newPlayerData, setNewPlayerData] = useState({
    name: '',
    primary_position: '',
    secondary_position: 'none',
    age: 18,
    ovr: 70,
  });
  const [editData, setEditData] = useState({
    pick: {
      season_id: 0,
      team_id: 0,
      pick_number: 1,
    },
    player: {
      name: '',
      primary_position: '',
      secondary_position: 'none',
      age: 18,
      ovr: 70,
    }
  });

  // Estados para criar jogador
  const [createPlayerData, setCreatePlayerData] = useState({
    name: '',
    primary_position: '',
    secondary_position: 'none',
    age: 18,
    ovr: 70,
    team_id: 0,
  });

  // Estados para transferir jogador
  const [transferFilterTeam, setTransferFilterTeam] = useState<number | 'free-agents' | 'all'>('free-agents');
  const [selectedPlayerForTransfer, setSelectedPlayerForTransfer] = useState<any>(null);
  const [transferToTeam, setTransferToTeam] = useState<number>(0);

  // Hooks
  const { data: seasonsResponse } = useSeasons();
  const { data: teamsResponse } = useTeams();
  const { data: activeSeasonResponse } = useActiveSeason();
  const { data: nextPickNumberResponse } = useNextPickNumber(activeSeasonResponse?.data?.id || 0);
  const { data: playersResponse } = useAllPlayers();
  const { data: draftPicksResponse, isLoading } = useDraftPicks({
    season_id: selectedSeason,
    team_id: selectedTeam,
  });
  const toggleAddedTo2kMutation = useToggleAddedTo2k();
  const createDraftPickMutation = useCreateDraftPick();
  const deleteDraftPickMutation = useDeleteDraftPick();
  const updateDraftPickMutation = useUpdateDraftPick();
  const updatePlayerMutation = useUpdatePlayer();
  const createPlayerMutation = useCreatePlayer();
  
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Hook customizado para criar jogador e vincular ao draft pick
  const createPlayerAndLinkMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => 
      draftPickService.createPlayerAndAddToDraftPick(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['draft-picks'] });
      toast({
        title: 'Sucesso!',
        description: 'Jogador criado e vinculado com sucesso.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Erro!',
        description: error?.response?.data?.message || 'Erro ao criar jogador.',
        variant: 'destructive',
      });
    },
  });

  // Hook para transferir jogador
  const transferPlayerMutation = useMutation({
    mutationFn: ({ playerId, teamId }: { playerId: number; teamId: number }) => 
      updatePlayerMutation.mutateAsync({ id: playerId, data: { team_id: teamId } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['players'] });
      queryClient.invalidateQueries({ queryKey: ['draft-picks'] });
      toast({
        title: 'Sucesso!',
        description: 'Jogador transferido com sucesso.',
      });
      setShowTransferPlayerModal(false);
      setSelectedPlayerForTransfer(null);
      setTransferToTeam(0);
    },
    onError: (error: any) => {
      toast({
        title: 'Erro!',
        description: error?.response?.data?.message || 'Erro ao transferir jogador.',
        variant: 'destructive',
      });
    },
  });

  const handleCreatePlayer = () => {
    if (createPlayerData.team_id === 0) {
      toast({
        title: 'Time obrigatório!',
        description: 'Por favor, selecione um time para o jogador.',
        variant: 'destructive',
      });
      return;
    }

    // Combinar posições primária e secundária
    const position = createPlayerData.secondary_position && createPlayerData.secondary_position !== 'none'
      ? `${createPlayerData.primary_position}/${createPlayerData.secondary_position}`
      : createPlayerData.primary_position;

    const playerData = {
      name: createPlayerData.name,
      position: position,
      age: createPlayerData.age,
      ovr: createPlayerData.ovr,
      team_id: createPlayerData.team_id,
    };

    createPlayerMutation.mutate(playerData, {
      onSuccess: () => {
        setShowCreatePlayerModal(false);
        setCreatePlayerData({
          name: '',
          primary_position: '',
          secondary_position: 'none',
          age: 18,
          ovr: 70,
          team_id: 0,
        });
      },
    });
  };

  // Nova função para criar jogador e vincular ao draft pick
  const handleCreatePlayerForDraftPick = () => {
    if (!selectedPickForPlayer) {
      toast({
        title: 'Erro!',
        description: 'Nenhum draft pick selecionado.',
        variant: 'destructive',
      });
      return;
    }

    // Encontrar o draft pick selecionado para obter o team_id
    const selectedPick = draftPicks.find(pick => pick.id === selectedPickForPlayer);
    if (!selectedPick) {
      toast({
        title: 'Erro!',
        description: 'Draft pick não encontrado.',
        variant: 'destructive',
      });
      return;
    }

    // Combinar posições primária e secundária
    const position = newPlayerData.secondary_position && newPlayerData.secondary_position !== 'none'
      ? `${newPlayerData.primary_position}/${newPlayerData.secondary_position}`
      : newPlayerData.primary_position;

    const playerData = {
      name: newPlayerData.name,
      position: position,
      age: newPlayerData.age,
      ovr: newPlayerData.ovr,
      team_id: selectedPick.team_id, // Usar o team_id do draft pick selecionado
    };

    createPlayerAndLinkMutation.mutate({
      id: selectedPickForPlayer,
      data: playerData
    }, {
      onSuccess: () => {
        setShowAddPlayerModal(false);
        setSelectedPickForPlayer(null);
        setNewPlayerData({
          name: '',
          primary_position: '',
          secondary_position: 'none',
          age: 18,
          ovr: 70,
        });
      },
    });
  };

  const handleTransferPlayer = () => {
    if (!selectedPlayerForTransfer || transferToTeam === 0) return;

    const currentTeamName = selectedPlayerForTransfer.team_id ? 
      teams.find(t => t.id === selectedPlayerForTransfer.team_id)?.name || 'Time desconhecido' 
      : 'Free Agent';
    const newTeamName = transferToTeam === 0 ? 'Free Agent' : teams.find(t => t.id === transferToTeam)?.name || 'Time desconhecido';

    if (confirm(`Transferir ${selectedPlayerForTransfer.name} de ${currentTeamName} para ${newTeamName}?`)) {
      transferPlayerMutation.mutate({
        playerId: selectedPlayerForTransfer.id,
        teamId: transferToTeam || null
      });
    }
  };

  // Filtrar jogadores para transferência
  const filteredPlayersForTransfer = (playersResponse?.data || []).filter(player => {
    // Filtro por time
    let matchesTeam = true;
    if (transferFilterTeam === 'free-agents') {
      matchesTeam = !player.team_id;
    } else if (transferFilterTeam !== 'all') {
      matchesTeam = player.team_id === transferFilterTeam;
    }

    return matchesTeam;
  });

  // Se não for admin, redireciona
  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  const draftPicks: DraftPick[] = Array.isArray(draftPicksResponse?.data) ? draftPicksResponse.data : [];
  const seasons = seasonsResponse?.data || [];
  const teams = teamsResponse?.data?.sort((a, b) => a.name.localeCompare(b.name)) || [];
  const players = playersResponse?.data || [];
  const activeSeason = activeSeasonResponse?.data;
  const nextPickNumber = nextPickNumberResponse?.data?.next_pick_number || 1;

  // Atualizar valores padrão quando os dados chegarem
  useEffect(() => {
    if (activeSeason && nextPickNumber) {
      setNewPickData({
        season_id: activeSeason.id,
        team_id: 0, // Vai ser escolhido pelo usuário
        pick_number: nextPickNumber,
      });
      // Definir temporada ativa como padrão no filtro apenas se não houver nenhuma selecionada
      if (selectedSeason === undefined) {
        setSelectedSeason(activeSeason.id);
      }
    }
  }, [activeSeason, nextPickNumber, selectedSeason]);

  const handleToggleAddedTo2k = (id: number) => {
    toggleAddedTo2kMutation.mutate(id);
  };

  const handleCreatePick = () => {
    if (newPickData.team_id === 0) {
      alert('Por favor, escolha um time');
      return;
    }
    
    createDraftPickMutation.mutate(newPickData, {
      onSuccess: () => {
        setShowAddModal(false);
        // Reset para valores padrão
        if (activeSeason && nextPickNumber) {
          setNewPickData({
            season_id: activeSeason.id,
            team_id: 0,
            pick_number: nextPickNumber,
          });
        }
      },
    });
  };

  const handleEditPick = (pick: any) => {
    setSelectedPickForEdit(pick);
    
    // Separar posição primária e secundária
    const positions = pick.actual_player_position?.split('/') || [];
    const primaryPosition = positions[0] || '';
    const secondaryPosition = positions[1] || 'none';
    
    setEditData({
      pick: {
        season_id: pick.season_id,
        team_id: pick.team_id,
        pick_number: pick.pick_number,
      },
      player: {
        name: pick.actual_player_name || '',
        primary_position: primaryPosition,
        secondary_position: secondaryPosition,
        age: pick.actual_player_age || 18,
        ovr: pick.actual_player_ovr || 70,
      }
    });
    
    setShowEditModal(true);
  };

  const handleOpenAddPlayerModal = (pickId: number) => {
    setSelectedPickForPlayer(pickId);
    setNewPlayerData({
      name: '',
      primary_position: '',
      secondary_position: 'none',
      age: 18,
      ovr: 70,
    });
    setShowAddPlayerModal(true);
  };

  const handleSaveEdit = () => {
    if (!selectedPickForEdit) return;

    // Combinar posições primária e secundária
    const position = editData.player.secondary_position && editData.player.secondary_position !== 'none'
      ? `${editData.player.primary_position}/${editData.player.secondary_position}`
      : editData.player.primary_position;

    // Atualizar draft pick
    const pickUpdateData = {
      season_id: editData.pick.season_id,
      team_id: editData.pick.team_id,
      pick_number: editData.pick.pick_number,
    };

    // Atualizar player (se existir)
    const playerUpdateData = {
      name: editData.player.name,
      position: position,
      age: editData.player.age,
      ovr: editData.player.ovr,
    };

    // Executar as atualizações
    const promises = [];

    // Atualizar draft pick
    promises.push(
      updateDraftPickMutation.mutateAsync({
        id: selectedPickForEdit.id,
        data: pickUpdateData
      })
    );

    // Atualizar player se existir
    if (selectedPickForEdit.player_id) {
      promises.push(
        updatePlayerMutation.mutateAsync({
          id: selectedPickForEdit.player_id,
          data: playerUpdateData
        })
      );
    }

    // Executar todas as atualizações
    Promise.all(promises)
      .then(() => {
        toast({
          title: 'Sucesso!',
          description: 'Draft pick e jogador atualizados com sucesso.',
        });
        setShowEditModal(false);
        setSelectedPickForEdit(null);
      })
      .catch((error) => {
        toast({
          title: 'Erro!',
          description: error?.response?.data?.message || 'Erro ao atualizar dados.',
          variant: 'destructive',
        });
      });
  };

  const getPositionColor = (position: string) => {
    const colors: { [key: string]: string } = {
      'PG': 'bg-blue-100 text-blue-800',
      'SG': 'bg-green-100 text-green-800',
      'SF': 'bg-yellow-100 text-yellow-800',
      'PF': 'bg-orange-100 text-orange-800',
      'C': 'bg-red-100 text-red-800',
    };
    return colors[position] || 'bg-gray-100 text-gray-800';
  };

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      // Se clicar na mesma coluna, alterna a direção
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      // Se clicar em uma nova coluna, define como ascendente
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

  const sortedDraftPicks = [...(Array.isArray(draftPicks) ? draftPicks : [])].sort((a, b) => {
    let aValue: any;
    let bValue: any;

    switch (sortColumn) {
      case 'is_added_to_2k':
        aValue = a.is_added_to_2k ? 1 : 0;
        bValue = b.is_added_to_2k ? 1 : 0;
        break;
      case 'pick_number':
        aValue = a.pick_number;
        bValue = b.pick_number;
        break;
      case 'team_name':
        aValue = a.team_name || '';
        bValue = b.team_name || '';
        break;
      case 'player_name':
        aValue = a.actual_player_name || '';
        bValue = b.actual_player_name || '';
        break;
      case 'position':
        aValue = a.actual_player_position || '';
        bValue = b.actual_player_position || '';
        break;
      case 'overall':
        aValue = a.actual_player_ovr || 0;
        bValue = b.actual_player_ovr || 0;
        break;
      case 'age':
        aValue = a.actual_player_age || 0;
        bValue = b.actual_player_age || 0;
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

  return (
    <div className="container mx-auto p-6 flex flex-col min-h-screen mb-12">
      <div className="flex justify-between items-center mb-6">
      <h1 className="text-lg font-bold text-nba-dark sm:text-2xl md:text-3xl">Jogadores e Draft</h1>
        <Button onClick={() => setShowAddModal(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Adicionar Pick
        </Button>
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
                  ...(Array.isArray(seasons) ? seasons : []).map((season) => ({
                    value: season.id.toString(),
                    label: `Temporada ${season.season_number} (${season.year})`
                  }))
                ]}
              />
            </div>
            <div>
              <Label htmlFor="team">Time</Label>
              <SearchableSelect
                value={selectedTeam?.toString() || "all"}
                onValueChange={(value) => setSelectedTeam(value === "all" ? undefined : parseInt(value))}
                placeholder="Selecione um time"
                searchPlaceholder="Buscar time..."
                options={[
                  { value: 'all', label: 'Todos os times' },
                  ...teams.map((team) => ({
                    value: team.id.toString(),
                    label: team.name
                  }))
                ]}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Botões de gerenciamento de jogadores */}
      <div className="flex flex-col sm:flex-row gap-4">
        <Button onClick={() => setShowCreatePlayerModal(true)} className="bg-green-600 hover:bg-green-700">
          <Plus className="w-4 h-4 mr-2" />
          Criar jogador em time
        </Button>
        <Button onClick={() => setShowTransferPlayerModal(true)} className="bg-blue-600 hover:bg-blue-700">
          <Edit className="w-4 h-4 mr-2" />
          Transferir jogador
        </Button>
      </div>

      {/* Tabela */}
      <Card className="flex-1">
        <CardHeader>
          <CardTitle>Draft Picks</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="rounded-md border overflow-x-auto max-h-[600px] overflow-y-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead 
                    className="w-[50px] cursor-pointer hover:bg-gray-50 select-none" 
                    title="Adicionado ao 2K pelo admin"
                    onClick={() => handleSort('is_added_to_2k')}
                  >
                    <div className="flex items-center gap-2">
                      2K {getSortIcon('is_added_to_2k')}
                    </div>
                  </TableHead>
                  <TableHead 
                    onClick={() => handleSort('pick_number')} 
                    className="cursor-pointer hover:bg-gray-50 select-none"
                  >
                    <div className="flex items-center gap-2">
                      Pick {getSortIcon('pick_number')}
                    </div>
                  </TableHead>
                  <TableHead 
                    onClick={() => handleSort('team_name')} 
                    className="cursor-pointer hover:bg-gray-50 select-none"
                  >
                    <div className="flex items-center gap-2">
                      Time {getSortIcon('team_name')}
                    </div>
                  </TableHead>
                  <TableHead 
                    onClick={() => handleSort('player_name')} 
                    className="cursor-pointer hover:bg-gray-50 select-none"
                  >
                    <div className="flex items-center gap-2">
                      Jogador {getSortIcon('player_name')}
                    </div>
                  </TableHead>
                  <TableHead 
                    onClick={() => handleSort('position')} 
                    className="cursor-pointer hover:bg-gray-50 select-none"
                  >
                    <div className="flex items-center gap-2">
                      Posição {getSortIcon('position')}
                    </div>
                  </TableHead>
                  <TableHead 
                    onClick={() => handleSort('overall')} 
                    className="cursor-pointer hover:bg-gray-50 select-none"
                  >
                    <div className="flex items-center gap-2">
                      Overall {getSortIcon('overall')}
                    </div>
                  </TableHead>
                  <TableHead 
                    onClick={() => handleSort('age')} 
                    className="cursor-pointer hover:bg-gray-50 select-none"
                  >
                    <div className="flex items-center gap-2">
                      Idade {getSortIcon('age')}
                    </div>
                  </TableHead>
                  <TableHead className="w-[100px]">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedDraftPicks.map((pick) => (
                  <TableRow key={pick.id}>
                    <TableCell>
                      <Checkbox 
                        checked={pick.is_added_to_2k}
                        onCheckedChange={() => handleToggleAddedTo2k(pick.id)}
                      />
                    </TableCell>
                    <TableCell className="font-medium">#{pick.pick_number}</TableCell>
                    <TableCell>{pick.team_name}</TableCell>
                    <TableCell>
                      {pick.actual_player_name ? (
                        pick.actual_player_name
                      ) : (
                        <Button 
                          size="sm" 
                          variant="outline" 
                          onClick={() => handleOpenAddPlayerModal(pick.id)}
                          className="h-6 w-6 p-0"
                        >
                          <Plus className="w-3 h-3" />
                        </Button>
                      )}
                    </TableCell>
                    <TableCell>
                      {pick.actual_player_position ? (
                        <Badge className={getPositionColor(pick.actual_player_position)}>
                          {pick.actual_player_position}
                        </Badge>
                      ) : (
                        '-'
                      )}
                    </TableCell>
                    <TableCell>
                      {pick.actual_player_ovr || '-'}
                    </TableCell>
                    <TableCell>
                      {pick.actual_player_age || '-'}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        {pick.actual_player_name && (
                          <Button size="sm" variant="outline" className="h-8 w-8 p-0" title="Jogador vinculado">
                            <Check className="w-4 h-4 text-green-600" />
                          </Button>
                        )}
                        <Button size="sm" variant="outline" className="h-8 w-8 p-0" onClick={() => handleEditPick(pick)} title="Editar">
                          <Edit className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Modal para adicionar pick */}
      <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adicionar Draft Pick</DialogTitle>
            <DialogDescription>
              Preencha as informações do novo draft pick.
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 gap-4">
            <div>
              <Label htmlFor="season">Temporada</Label>
              <SearchableSelect
                value={newPickData.season_id.toString()}
                onValueChange={(value) => setNewPickData({ ...newPickData, season_id: parseInt(value) })}
                placeholder="Selecione uma temporada"
                searchPlaceholder="Buscar temporada..."
                options={seasons.map((season) => ({
                  value: season.id.toString(),
                  label: `Temporada ${season.season_number} (${season.year})`
                }))}
              />
            </div>
            <div>
              <Label htmlFor="team">Time</Label>
              <SearchableSelect
                value={newPickData.team_id === 0 ? "" : newPickData.team_id.toString()}
                onValueChange={(value) => setNewPickData({ ...newPickData, team_id: parseInt(value) })}
                placeholder="Escolher time"
                searchPlaceholder="Buscar time..."
                options={teams.map((team) => ({
                  value: team.id.toString(),
                  label: team.name
                }))}
              />
            </div>
            <div>
              <Label htmlFor="pick_number">Número do Pick</Label>
              <Input
                type="number"
                value={newPickData.pick_number}
                onChange={(e) => setNewPickData({ ...newPickData, pick_number: parseInt(e.target.value) })}
                min="1"
                max="60"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddModal(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={handleCreatePick} 
              disabled={createDraftPickMutation.isPending || newPickData.team_id === 0}
            >
              {createDraftPickMutation.isPending ? 'Criando...' : 'Criar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal para adicionar jogador */}
      <Dialog open={showAddPlayerModal} onOpenChange={setShowAddPlayerModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adicionar Jogador ao Draft Pick</DialogTitle>
            <DialogDescription>
              Preencha as informações do jogador para vincular a este draft pick.
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 gap-4">
            <div>
              <Label htmlFor="player_name">Nome do Jogador</Label>
              <Input
                id="player_name"
                value={newPlayerData.name}
                onChange={(e) => setNewPlayerData({ ...newPlayerData, name: e.target.value })}
                placeholder="Nome do jogador"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="primary_position">Posição Primária</Label>
                <SearchableSelect
                  value={newPlayerData.primary_position}
                  onValueChange={(value) => setNewPlayerData({ ...newPlayerData, primary_position: value })}
                  placeholder="Selecione"
                  searchPlaceholder="Buscar posição..."
                  options={[
                    { value: 'PG', label: 'PG' },
                    { value: 'SG', label: 'SG' },
                    { value: 'SF', label: 'SF' },
                    { value: 'PF', label: 'PF' },
                    { value: 'C', label: 'C' }
                  ]}
                />
              </div>
              <div>
                <Label htmlFor="secondary_position">Posição Secundária (opcional)</Label>
                <SearchableSelect
                  value={newPlayerData.secondary_position}
                  onValueChange={(value) => setNewPlayerData({ ...newPlayerData, secondary_position: value })}
                  placeholder="Nenhuma"
                  searchPlaceholder="Buscar posição..."
                  options={[
                    { value: 'none', label: 'Nenhuma' },
                    { value: 'PG', label: 'PG', disabled: newPlayerData.primary_position === 'PG' },
                    { value: 'SG', label: 'SG', disabled: newPlayerData.primary_position === 'SG' },
                    { value: 'SF', label: 'SF', disabled: newPlayerData.primary_position === 'SF' },
                    { value: 'PF', label: 'PF', disabled: newPlayerData.primary_position === 'PF' },
                    { value: 'C', label: 'C', disabled: newPlayerData.primary_position === 'C' }
                  ]}
                />
                {newPlayerData.secondary_position !== 'none' && newPlayerData.primary_position === newPlayerData.secondary_position && (
                  <p className="text-sm text-red-600 mt-1">Posição secundária deve ser diferente da primária</p>
                )}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="age">Idade</Label>
                <Input
                  id="age"
                  type="number"
                  value={newPlayerData.age}
                  onChange={(e) => setNewPlayerData({ ...newPlayerData, age: parseInt(e.target.value) })}
                  min="17"
                  max="50"
                />
              </div>
              <div>
                <Label htmlFor="ovr">Overall</Label>
                <Input
                  id="ovr"
                  type="number"
                  value={newPlayerData.ovr}
                  onChange={(e) => setNewPlayerData({ ...newPlayerData, ovr: parseInt(e.target.value) })}
                  min="0"
                  max="99"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddPlayerModal(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={handleCreatePlayerForDraftPick} 
              disabled={
                createPlayerAndLinkMutation.isPending || 
                !newPlayerData.name || 
                !newPlayerData.primary_position ||
                (newPlayerData.secondary_position !== 'none' && newPlayerData.primary_position === newPlayerData.secondary_position)
              }
            >
              {createPlayerAndLinkMutation.isPending ? 'Criando...' : 'Criar Jogador'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal para editar draft pick e jogador */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Editar Draft Pick e Jogador</DialogTitle>
            <DialogDescription>
              Edite as informações do draft pick e do jogador vinculado.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid grid-cols-1 gap-6">
            {/* Seção do Draft Pick */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Draft Pick</h3>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="edit_season">Temporada</Label>
                  <SearchableSelect
                    value={editData.pick.season_id.toString()}
                    onValueChange={(value) => setEditData({ 
                      ...editData, 
                      pick: { ...editData.pick, season_id: parseInt(value) }
                    })}
                    placeholder="Selecione uma temporada"
                    searchPlaceholder="Buscar temporada..."
                    options={seasons.map((season) => ({
                      value: season.id.toString(),
                      label: `Temporada ${season.season_number} (${season.year})`
                    }))}
                  />
                </div>
                <div>
                  <Label htmlFor="edit_team">Time</Label>
                  <SearchableSelect
                    value={editData.pick.team_id.toString()}
                    onValueChange={(value) => setEditData({ 
                      ...editData, 
                      pick: { ...editData.pick, team_id: parseInt(value) }
                    })}
                    placeholder="Selecione um time"
                    searchPlaceholder="Buscar time..."
                    options={teams.map((team) => ({
                      value: team.id.toString(),
                      label: team.name
                    }))}
                  />
                </div>
                <div>
                  <Label htmlFor="edit_pick_number">Número do Pick</Label>
                  <Input
                    type="number"
                    value={editData.pick.pick_number}
                    onChange={(e) => setEditData({ 
                      ...editData, 
                      pick: { ...editData.pick, pick_number: parseInt(e.target.value) }
                    })}
                    min="1"
                    max="60"
                  />
                </div>
              </div>
            </div>

            {/* Seção do Jogador */}
            {selectedPickForEdit?.actual_player_name && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Jogador</h3>
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <Label htmlFor="edit_player_name">Nome do Jogador</Label>
                    <Input
                      value={editData.player.name}
                      onChange={(e) => setEditData({ 
                        ...editData, 
                        player: { ...editData.player, name: e.target.value }
                      })}
                      placeholder="Nome do jogador"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="edit_primary_position">Posição Primária</Label>
                      <SearchableSelect
                        value={editData.player.primary_position}
                        onValueChange={(value) => setEditData({ 
                          ...editData, 
                          player: { ...editData.player, primary_position: value }
                        })}
                        placeholder="Selecione"
                        searchPlaceholder="Buscar posição..."
                        options={[
                          { value: 'PG', label: 'PG' },
                          { value: 'SG', label: 'SG' },
                          { value: 'SF', label: 'SF' },
                          { value: 'PF', label: 'PF' },
                          { value: 'C', label: 'C' }
                        ]}
                      />
                    </div>
                    <div>
                      <Label htmlFor="edit_secondary_position">Posição Secundária (opcional)</Label>
                      <SearchableSelect
                        value={editData.player.secondary_position}
                        onValueChange={(value) => setEditData({ 
                          ...editData, 
                          player: { ...editData.player, secondary_position: value }
                        })}
                        placeholder="Nenhuma"
                        searchPlaceholder="Buscar posição..."
                        options={[
                          { value: 'none', label: 'Nenhuma' },
                          { value: 'PG', label: 'PG', disabled: editData.player.primary_position === 'PG' },
                          { value: 'SG', label: 'SG', disabled: editData.player.primary_position === 'SG' },
                          { value: 'SF', label: 'SF', disabled: editData.player.primary_position === 'SF' },
                          { value: 'PF', label: 'PF', disabled: editData.player.primary_position === 'PF' },
                          { value: 'C', label: 'C', disabled: editData.player.primary_position === 'C' }
                        ]}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="edit_age">Idade</Label>
                      <Input
                        type="number"
                        value={editData.player.age}
                        onChange={(e) => setEditData({ 
                          ...editData, 
                          player: { ...editData.player, age: parseInt(e.target.value) }
                        })}
                        min="17"
                        max="50"
                      />
                    </div>
                    <div>
                      <Label htmlFor="edit_ovr">Overall</Label>
                      <Input
                        type="number"
                        value={editData.player.ovr}
                        onChange={(e) => setEditData({ 
                          ...editData, 
                          player: { ...editData.player, ovr: parseInt(e.target.value) }
                        })}
                        min="0"
                        max="99"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditModal(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={handleSaveEdit}
              disabled={updateDraftPickMutation.isPending || updatePlayerMutation.isPending}
            >
              {updateDraftPickMutation.isPending || updatePlayerMutation.isPending ? 'Salvando...' : 'Salvar Alterações'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal para criar jogador em time */}
      <Dialog open={showCreatePlayerModal} onOpenChange={setShowCreatePlayerModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Criar Jogador em Time</DialogTitle>
            <DialogDescription>
              Crie um novo jogador e vincule-o diretamente a um time.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid grid-cols-1 gap-4">
            <div>
              <Label htmlFor="create_player_name">Nome do Jogador</Label>
              <Input
                id="create_player_name"
                value={createPlayerData.name}
                onChange={(e) => setCreatePlayerData({ ...createPlayerData, name: e.target.value })}
                placeholder="Nome do jogador"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="create_primary_position">Posição Primária</Label>
                <SearchableSelect
                  value={createPlayerData.primary_position}
                  onValueChange={(value) => setCreatePlayerData({ ...createPlayerData, primary_position: value })}
                  placeholder="Selecione"
                  searchPlaceholder="Buscar posição..."
                  options={[
                    { value: 'PG', label: 'PG' },
                    { value: 'SG', label: 'SG' },
                    { value: 'SF', label: 'SF' },
                    { value: 'PF', label: 'PF' },
                    { value: 'C', label: 'C' }
                  ]}
                />
              </div>
              <div>
                <Label htmlFor="create_secondary_position">Posição Secundária (opcional)</Label>
                <SearchableSelect
                  value={createPlayerData.secondary_position}
                  onValueChange={(value) => setCreatePlayerData({ ...createPlayerData, secondary_position: value })}
                  placeholder="Nenhuma"
                  searchPlaceholder="Buscar posição..."
                  options={[
                    { value: 'none', label: 'Nenhuma' },
                    { value: 'PG', label: 'PG', disabled: createPlayerData.primary_position === 'PG' },
                    { value: 'SG', label: 'SG', disabled: createPlayerData.primary_position === 'SG' },
                    { value: 'SF', label: 'SF', disabled: createPlayerData.primary_position === 'SF' },
                    { value: 'PF', label: 'PF', disabled: createPlayerData.primary_position === 'PF' },
                    { value: 'C', label: 'C', disabled: createPlayerData.primary_position === 'C' }
                  ]}
                />
              </div>
            </div>
            
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="create_age">Idade</Label>
                <Input
                  id="create_age"
                  type="number"
                  value={createPlayerData.age}
                  onChange={(e) => setCreatePlayerData({ ...createPlayerData, age: parseInt(e.target.value) })}
                  min="17"
                  max="50"
                />
              </div>
              <div>
                <Label htmlFor="create_ovr">Overall</Label>
                <Input
                  id="create_ovr"
                  type="number"
                  value={createPlayerData.ovr}
                  onChange={(e) => setCreatePlayerData({ ...createPlayerData, ovr: parseInt(e.target.value) })}
                  min="0"
                  max="99"
                />
              </div>
              <div>
                <Label htmlFor="create_team">Time</Label>
                <SearchableSelect
                  value={createPlayerData.team_id === 0 ? "" : createPlayerData.team_id.toString()}
                  onValueChange={(value) => setCreatePlayerData({ ...createPlayerData, team_id: parseInt(value) })}
                  placeholder="Escolher time"
                  searchPlaceholder="Buscar time..."
                  options={teams.map((team) => ({
                    value: team.id.toString(),
                    label: team.name
                  }))}
                />
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreatePlayerModal(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={handleCreatePlayer} 
              disabled={
                createPlayerMutation.isPending || 
                !createPlayerData.name || 
                !createPlayerData.primary_position ||
                createPlayerData.team_id === 0
              }
            >
              {createPlayerMutation.isPending ? 'Criando...' : 'Criar Jogador'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal para transferir jogador */}
      <Dialog open={showTransferPlayerModal} onOpenChange={setShowTransferPlayerModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Transferir Jogador</DialogTitle>
            <DialogDescription>
              Selecione um jogador e transfira-o para outro time.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* 1. Filtrar por time */}
            <div>
              <Label htmlFor="filter_team">Filtrar por time</Label>
              <SearchableSelect
                value={transferFilterTeam === 'all' ? 'all' : transferFilterTeam.toString()}
                onValueChange={(value) => setTransferFilterTeam(value === 'all' ? 'all' : parseInt(value))}
                placeholder="Selecione um time para filtrar"
                searchPlaceholder="Buscar time..."
                options={[
                  { value: 'free-agents', label: 'Free Agents (sem time)' },
                  { value: 'all', label: 'Todos os times' },
                  ...teams.map((team) => ({
                    value: team.id.toString(),
                    label: team.name
                  }))
                ]}
              />
            </div>

            {/* 2. Selecionar jogador */}
            <div>
              <Label htmlFor="select_player">Selecionar jogador</Label>
              <SearchableSelect
                value={selectedPlayerForTransfer?.id?.toString() || ""}
                onValueChange={(value) => {
                  const player = filteredPlayersForTransfer.find(p => p.id.toString() === value);
                  setSelectedPlayerForTransfer(player || null);
                }}
                placeholder="Selecione um jogador"
                searchPlaceholder="Buscar jogador..."
                options={filteredPlayersForTransfer.map((player) => ({
                  value: player.id.toString(),
                  label: `${player.position}: ${player.name} (${player.ovr}/${player.age}) - ${player.team_id ? 
                    teams.find(t => t.id === player.team_id)?.name || 'Time desconhecido' 
                    : 'Free Agent'
                  }`
                }))}
              />
            </div>

            {/* 3. Transferir para */}
            <div>
              <Label htmlFor="transfer_to_team">Transferir para</Label>
              <SearchableSelect
                value={transferToTeam === 0 ? "0" : transferToTeam.toString()}
                onValueChange={(value) => setTransferToTeam(parseInt(value))}
                placeholder="Selecione o time de destino"
                searchPlaceholder="Buscar time..."
                options={[
                  { value: '0', label: 'Free Agent (sem time)' },
                  ...teams.map((team) => ({
                    value: team.id.toString(),
                    label: team.name
                  }))
                ]}
              />
            </div>

            {/* Botão de transferência */}
            <div className="pt-4">
              <Button
                onClick={handleTransferPlayer}
                disabled={transferPlayerMutation.isPending || !selectedPlayerForTransfer || transferToTeam === 0}
                className="w-full"
              >
                {transferPlayerMutation.isPending ? 'Transferindo...' : 'Transferir Jogador'}
              </Button>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowTransferPlayerModal(false)}>
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
};

export default DraftPicksPage; 