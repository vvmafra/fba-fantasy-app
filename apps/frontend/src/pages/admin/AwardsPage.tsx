import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import { useSeasonAwardsBySeason, useUpdateSeasonAwards, useSeasonAwards } from '@/hooks/useSeasonAwards';
import { useSeasons, useActiveSeason } from '@/hooks/useSeasons';
import { useAllPlayers } from '@/hooks/usePlayers';
import { useTeams } from '@/hooks/useTeams';
import { useUsers } from '@/hooks/useUsers';
import { useToast } from '@/hooks/use-toast';
import { Trophy, Save, Check } from 'lucide-react';

const AwardsPage = () => {
  const { isAdmin } = useAuth();
  
  // Estados
  const [selectedSeason, setSelectedSeason] = useState<number | undefined>(undefined);
  const [awardsData, setAwardsData] = useState({
    mvp_player_id: null as number | null,
    mvp_team_id: null as number | null,
    roy_player_id: null as number | null,
    roy_team_id: null as number | null,
    smoy_player_id: null as number | null,
    smoy_team_id: null as number | null,
    dpoy_player_id: null as number | null,
    dpoy_team_id: null as number | null,
    mip_player_id: null as number | null,
    mip_team_id: null as number | null,
    coy_user_id: null as number | null,
    coy_team_id: null as number | null,
  });

  // Hooks
  const { data: seasonsResponse } = useSeasons();
  const { data: activeSeasonResponse } = useActiveSeason();
  const { data: playersResponse } = useAllPlayers();
  const { data: teamsResponse } = useTeams();
  const { data: usersResponse } = useUsers({ sortBy: 'name', sortOrder: 'asc', limit: 1000 });
  const { data: awardsResponse, isLoading } = useSeasonAwardsBySeason(selectedSeason || 0);
  const updateAwardsMutation = useUpdateSeasonAwards();
  const { data: allAwardsResponse } = useSeasonAwards();
  
  const { toast } = useToast();

  // Definir temporada ativa como padrão
  useEffect(() => {
    if (activeSeasonResponse?.data && !selectedSeason) {
      setSelectedSeason(activeSeasonResponse.data.id);
    }
  }, [activeSeasonResponse, selectedSeason]);

  // Atualizar dados quando a premiação for carregada
  useEffect(() => {
    if (awardsResponse?.data) {
      setAwardsData({
        mvp_player_id: awardsResponse.data.mvp_player_id,
        mvp_team_id: awardsResponse.data.mvp_team_id,
        roy_player_id: awardsResponse.data.roy_player_id,
        roy_team_id: awardsResponse.data.roy_team_id,
        smoy_player_id: awardsResponse.data.smoy_player_id,
        smoy_team_id: awardsResponse.data.smoy_team_id,
        dpoy_player_id: awardsResponse.data.dpoy_player_id,
        dpoy_team_id: awardsResponse.data.dpoy_team_id,
        mip_player_id: awardsResponse.data.mip_player_id,
        mip_team_id: awardsResponse.data.mip_team_id,
        coy_user_id: awardsResponse.data.coy_user_id,
        coy_team_id: awardsResponse.data.coy_team_id,
      });
    }
  }, [awardsResponse]);

  // Se não for admin, redireciona
  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  const seasons = seasonsResponse?.data || [];
  const players = playersResponse?.data || [];
  const teams = teamsResponse?.data || [];
  const users = usersResponse?.data || [];
  const activeSeason = activeSeasonResponse?.data;
  const awards = awardsResponse?.data;
  const allAwards = allAwardsResponse?.data || [];

  // Função para verificar se uma temporada tem premiação com dados
  const hasAwardsForSeason = (seasonId: number) => {
    const award = allAwards.find(a => a.season_id === seasonId);
    if (!award) return false;
    
    // Verificar se pelo menos um campo de premiação está preenchido
    return !!(
      award.mvp_player_id ||
      award.roy_player_id ||
      award.smoy_player_id ||
      award.dpoy_player_id ||
      award.mip_player_id ||
      award.coy_user_id
    );
  };

  const handleSave = () => {
    if (!awards?.id) {
      toast({
        title: 'Erro!',
        description: 'Premiação não encontrada para esta temporada.',
        variant: 'destructive',
      });
      return;
    }

    updateAwardsMutation.mutate(
      { id: awards.id, data: awardsData },
      {
        onSuccess: () => {
          toast({
            title: 'Sucesso!',
            description: 'Premiações salvas com sucesso.',
          });
        },
        onError: (error: any) => {
          toast({
            title: 'Erro!',
            description: error?.response?.data?.message || 'Erro ao salvar premiações.',
            variant: 'destructive',
          });
        },
      }
    );
  };

  const getPlayerTeamName = (playerId: number | null, awardType: string) => {
    if (!playerId) return '-';
    
    if (awardType === 'COY') {
      // Para COY, buscar o time onde o usuário é owner
      const user = users.find(u => u.id === playerId);
      if (user) {
        const team = teams.find(t => t.owner_id === user.id);
        return team?.name || 'Sem time';
      }
      return '-';
    } else {
      // Para jogadores, buscar o time através do player
      const player = players.find(p => p.id === playerId);
      if (!player?.team_id) return 'Free Agent';
      const team = teams.find(t => t.id === player.team_id);
      return team?.name || 'Time desconhecido';
    }
  };

  const getAwardColor = (awardType: string) => {
    // Usar a mesma cor para todos os awards - cor de fundo do header
    return 'bg-nba-blue text-white';
  };

  const awardTypes = [
    { key: 'mvp', label: 'MVP', playerField: 'mvp_player_id', teamField: 'mvp_team_id' },
    { key: 'roy', label: 'ROY', playerField: 'roy_player_id', teamField: 'roy_team_id' },
    { key: 'smoy', label: 'SMOY', playerField: 'smoy_player_id', teamField: 'smoy_team_id' },
    { key: 'dpoy', label: 'DPOY', playerField: 'dpoy_player_id', teamField: 'dpoy_team_id' },
    { key: 'mip', label: 'MIP', playerField: 'mip_player_id', teamField: 'mip_team_id' },
    { key: 'coy', label: 'COY', playerField: 'coy_user_id', teamField: 'coy_team_id' },
  ];

  return (
    <div className="container mx-auto p-6 flex flex-col min-h-screen mb-12">
      <div className="flex justify-between items-center mb-6">
      <h1 className="text-lg font-bold text-nba-dark sm:text-2xl md:text-3xl">Premiações da Temporada</h1>
        <Button 
          onClick={handleSave} 
          disabled={updateAwardsMutation.isPending}
          className="bg-nba-blue hover:bg-nba-blue/80"
        >
          <Save className="w-4 h-4 mr-2" />
          {updateAwardsMutation.isPending ? 'Salvando...' : 'Salvar Premiações'}
        </Button>
      </div>

      {/* Filtro de Temporada */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="season">Temporada</Label>
              <SearchableSelect
                value={selectedSeason?.toString() || ""}
                onValueChange={(value) => setSelectedSeason(parseInt(value))}
                placeholder="Selecione uma temporada"
                searchPlaceholder="Buscar temporada..."
                options={seasons.map((season) => ({
                  value: season.id.toString(),
                  label: `Temporada ${season.season_number} (${season.year})${hasAwardsForSeason(season.id) ? ' ✓' : ''}`
                }))}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabela de Premiações */}
      <Card className="flex-1">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-6 w-6 text-nba-orange" />
            Premiações
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[150px]">Prêmio</TableHead>
                  <TableHead>Jogador/Usuário</TableHead>
                  <TableHead>Time</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {awardTypes.map((award) => (
                  <TableRow key={award.key}>
                    <TableCell>
                      <Badge className={getAwardColor(award.label)}>
                        {award.label}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <SearchableSelect
                        value={awardsData[award.playerField as keyof typeof awardsData]?.toString() || ""}
                        onValueChange={(value) => {
                          const playerId = value ? parseInt(value) : null;
                          
                          if (award.key === 'coy') {
                            // Para COY, não definir team_id automaticamente
                            setAwardsData(prev => ({
                              ...prev,
                              [award.playerField]: playerId,
                              [award.teamField]: null // Será determinado pelo owner_id
                            }));
                          } else {
                            const player = players.find(p => p.id === playerId);
                            setAwardsData(prev => ({
                              ...prev,
                              [award.playerField]: playerId,
                              [award.teamField]: player?.team_id || null
                            }));
                          }
                        }}
                        placeholder={award.key === 'coy' ? "Selecione um usuário" : "Selecione um jogador"}
                        searchPlaceholder={award.key === 'coy' ? "Buscar usuário..." : "Buscar jogador..."}
                        options={
                          award.key === 'coy'
                            ? users.map((user) => ({
                                value: user.id.toString(),
                                label: user.name
                              }))
                            : players.map((player) => ({
                                value: player.id.toString(),
                                label: `${player.position}: ${player.name} (${player.ovr}/${player.age})`
                              }))
                        }
                      />
                    </TableCell>
                    <TableCell>
                      {awardsData[award.playerField as keyof typeof awardsData] ? (
                        <span className="text-sm text-gray-600">
                          {getPlayerTeamName(awardsData[award.playerField as keyof typeof awardsData], award.label)}
                        </span>
                      ) : (
                        <span className="text-sm text-gray-400">-</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AwardsPage; 