import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useWaivers } from '@/hooks/useWaivers';
import { useSeasons, useActiveSeason } from '@/hooks/useSeasons';
import { useTeams } from '@/hooks/useTeams';
import { Waiver } from '@/services/waiverService';
import { Calendar, Users, Clock, Filter, Search, Trash2, Edit, Plus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const WaiversAdminPage: React.FC = () => {
  const { waivers, loading, error, fetchAllWaivers, deleteWaiver } = useWaivers();
  const { data: seasonsData } = useSeasons();
  const { data: activeSeasonData } = useActiveSeason();
  const { data: teamsData } = useTeams();
  const { toast } = useToast();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSeason, setSelectedSeason] = useState<string>('all');
  const [selectedTeam, setSelectedTeam] = useState<string>('all');
  const [filteredWaivers, setFilteredWaivers] = useState<Waiver[]>([]);

  // Filtrar waivers baseado nas seleções
  useEffect(() => {
    // Só aplicar filtros se houver waivers
    if (!waivers || waivers.length === 0) {
      setFilteredWaivers([]);
      return;
    }
    
    let filtered = [...waivers];
    
    if (searchTerm) {
      filtered = filtered.filter(waiver => 
        waiver.player_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        waiver.player_id.toString().includes(searchTerm)
      );
    }
    
    if (selectedSeason !== 'all') {
      filtered = filtered.filter(waiver => waiver.season_id === parseInt(selectedSeason));
    }
    
    if (selectedTeam !== 'all') {
      filtered = filtered.filter(waiver => waiver.team_id === parseInt(selectedTeam));
    }
    

    
    setFilteredWaivers(filtered);
  }, [waivers, searchTerm, selectedSeason, selectedTeam]);

  // Carregar waivers iniciais
  useEffect(() => {
    fetchAllWaivers();
  }, [fetchAllWaivers]);

  // Definir temporada ativa como padrão quando os dados chegarem
  useEffect(() => {
    if (activeSeasonData?.data && selectedSeason === 'all') {
      setSelectedSeason(activeSeasonData.data.id.toString());
    }
  }, [activeSeasonData, selectedSeason]);



  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getSeasonName = (seasonId: number) => {
    const season = seasonsData?.data?.find(s => s.id === seasonId);
    return season ? `Temporada ${season.season_number}` : `Temporada ${seasonId}`;
  };

  const getTeamName = (teamId: number) => {
    const team = teamsData?.data?.find(t => t.id === teamId);
    return team?.name || `Time ${teamId}`;
  };

  const handleDeleteWaiver = async (waiverId: number) => {
    if (window.confirm('Tem certeza que deseja deletar este waiver?')) {
      try {
        await deleteWaiver(waiverId);
        toast({
          title: "Sucesso",
          description: "Waiver deletado com sucesso",
        });
      } catch (error) {
        toast({
          title: "Erro",
          description: "Erro ao deletar waiver",
          variant: "destructive",
        });
      }
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6 flex flex-col min-h-screen mb-12">
        <div className="flex items-center justify-center p-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
            <p className="text-gray-600">Carregando waivers...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-6 flex flex-col min-h-screen mb-12">
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-red-600 mb-4">Erro ao carregar waivers: {error}</p>
            <Button onClick={() => fetchAllWaivers()}>Tentar novamente</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 flex flex-col min-h-screen mb-12">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-lg font-bold text-nba-dark sm:text-2xl md:text-3xl">Gerenciar Waivers</h1>
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Clock size={16} />
          <span>Total: {filteredWaivers.length} jogadores</span>
        </div>
      </div>

      {/* Filtros */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter size={20} />
            Filtros e Busca
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <Label htmlFor="search">Buscar jogador</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="search"
                  placeholder="Buscar por nome ou ID do jogador..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="season">Temporada</Label>
              <Select value={selectedSeason} onValueChange={setSelectedSeason}>
                <SelectTrigger>
                  <SelectValue placeholder="Todas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as temporadas</SelectItem>
                  {seasonsData?.data?.map((season) => (
                    <SelectItem key={season.id} value={season.id.toString()}>
                      Temporada {season.season_number}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
                         <div>
               <Label htmlFor="team">Time</Label>
               <Select value={selectedTeam} onValueChange={setSelectedTeam}>
                 <SelectTrigger>
                   <SelectValue placeholder="Todos" />
                 </SelectTrigger>
                 <SelectContent>
                   <SelectItem value="all">Todos os times</SelectItem>
                   {teamsData?.data
                     ?.sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'))
                     ?.map((team) => (
                       <SelectItem key={team.id} value={team.id.toString()}>
                         {team.name}
                       </SelectItem>
                     ))}
                 </SelectContent>
               </Select>
             </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabela */}
      <Card className="flex-1">
        <CardHeader>
          <CardTitle>Lista de Waivers</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="rounded-md border overflow-x-auto max-h-[600px] overflow-y-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Jogador</TableHead>
                  <TableHead>Time</TableHead>
                  <TableHead>Temporada</TableHead>
                  <TableHead>Data de Dispensa</TableHead>
                  <TableHead className="w-[100px]">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredWaivers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                      <div className="flex flex-col items-center">
                        <Users size={48} className="mx-auto mb-4 text-gray-300" />
                        <p className="text-lg font-medium">Nenhum waiver encontrado</p>
                        <p className="text-sm">
                          {searchTerm || selectedSeason !== 'all' || selectedTeam !== 'all' 
                            ? 'Tente ajustar os filtros para ver mais resultados.'
                            : 'Não há jogadores na lista de waivers no momento.'
                          }
                        </p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredWaivers.map((waiver) => (
                    <TableRow key={waiver.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div>
                            <div className="font-medium">
                              {waiver.player_name || `Jogador ${waiver.player_id}`} - {waiver.player_overall} / {waiver.player_age}y
                            </div>
                            <div className="text-sm text-gray-500">
                              ID: {waiver.player_id}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Users size={16} className="text-gray-400" />
                          <span>{getTeamName(waiver.team_id)}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Calendar size={16} className="text-gray-400" />
                          <span>{getSeasonName(waiver.season_id)}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Clock size={16} className="text-gray-400" />
                          <span>{formatDate(waiver.created_at)}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm" className="h-8 w-8 p-0" title="Editar">
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleDeleteWaiver(waiver.id)}
                            className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                            title="Deletar"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
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

export default WaiversAdminPage;
