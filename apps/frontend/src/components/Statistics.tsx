import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { BarChart3, Trophy, Calendar, Upload, TrendingUp, Target, Image as ImageIcon, ChevronUp, ChevronDown } from 'lucide-react';
import { useTeam } from '@/hooks/useTeams';
import { useEditionRanking } from '@/hooks/useEditionRanking';
import { usePlayoffImageBySeason } from '@/hooks/usePlayoffImages';
import PlayoffImageModal from './PlayoffImageModal';
import ImageFullscreenModal from './ImageFullscreenModal';
import { playoffImageService } from '@/services/playoffImageService';
import { useToast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';

interface TeamStats {
  teamName: string;
  wins: number;
  losses: number;
  pointsFor: number;
  pointsAgainst: number;
  streak: string;
  rank: number;
}

interface StatisticsProps {
  isAdmin: boolean;
  teamId?: number;
}

type SortField = 'name' | 'points';
type SortDirection = 'asc' | 'desc';

const Statistics = ({ isAdmin, teamId }: StatisticsProps) => {
  const [selectedSeason, setSelectedSeason] = useState<'edition' | 'playoffs'>('edition');
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [isFullscreenModalOpen, setIsFullscreenModalOpen] = useState(false);
  const [sortField, setSortField] = useState<SortField>('points');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  
  // Hook para navegação
  const navigate = useNavigate();
  
  // Buscar dados do time do usuário
  const { data: team } = useTeam(teamId || 1); // TODO: Pegar team_id do usuário logado
  const userTeamName = team?.data?.name || 'Los Angeles Lakers'; // Fallback para dados mock
  
  // Buscar dados do ranking de edição
  const { data: editionRanking, isLoading: editionLoading } = useEditionRanking();
  
  // Buscar imagem dos playoffs (usando temporada atual como exemplo)
  const { data: playoffImage } = usePlayoffImageBySeason(1); // TODO: Usar temporada atual
  
  // Hooks para funcionalidades admin
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Função para navegar para a página do time
  const handleTeamClick = (clickedTeamId: number) => {
    // Usar o teamId do usuário logado como base e o teamId do time clicado como otherTeamId
    const userTeamId = teamId || 1; // teamId é o time do usuário logado
    navigate(`/team/${userTeamId}/view/${clickedTeamId}`);
  };

  // Função para limpar imagens inválidas
  const handleCleanupInvalidImages = async () => {
    if (!confirm('Tem certeza que deseja limpar todas as imagens inválidas?')) return;

    try {
      const response = await playoffImageService.cleanupInvalidImages();
      
      toast({
        title: 'Sucesso',
        description: `${response.data.deletedCount} imagens inválidas foram removidas`,
      });

      // Invalidar cache para atualizar a lista
      queryClient.invalidateQueries({ queryKey: ['playoff-images'] });
    } catch (error) {
      console.error('Erro ao limpar imagens:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao limpar imagens inválidas',
        variant: 'destructive',
      });
    }
  };

  // Função para ordenar os dados do ranking
  const sortedRankingData = useMemo(() => {
    if (!editionRanking?.data) return [];
    
    return [...editionRanking.data].sort((a, b) => {
      let comparison = 0;
      
      if (sortField === 'name') {
        comparison = a.team_name.localeCompare(b.team_name, 'pt-BR');
      } else if (sortField === 'points') {
        comparison = a.total_points - b.total_points;
      }
      
      return sortDirection === 'asc' ? comparison : -comparison;
    });
  }, [editionRanking?.data, sortField, sortDirection]);

  // Função para alternar ordenação
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  // Função para renderizar ícone de ordenação
  const renderSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return <ChevronUp size={16} className="text-gray-400" />;
    }
    return sortDirection === 'asc' ? 
      <ChevronUp size={16} className="text-nba-blue" /> : 
      <ChevronDown size={16} className="text-nba-blue" />;
  };

  // Mock data - será substituído por dados reais do Supabase
  const regularSeasonStats: TeamStats[] = [
    { teamName: 'Boston Celtics', wins: 45, losses: 15, pointsFor: 6800, pointsAgainst: 6200, streak: 'W5', rank: 1 },
    { teamName: 'Denver Nuggets', wins: 42, losses: 18, pointsFor: 6700, pointsAgainst: 6300, streak: 'W2', rank: 2 },
    { teamName: 'Milwaukee Bucks', wins: 41, losses: 19, pointsFor: 6650, pointsAgainst: 6400, streak: 'L1', rank: 3 },
    { teamName: userTeamName, wins: 38, losses: 22, pointsFor: 6500, pointsAgainst: 6450, streak: 'W3', rank: 4 },
    { teamName: 'Miami Heat', wins: 35, losses: 25, pointsFor: 6300, pointsAgainst: 6500, streak: 'L2', rank: 5 },
  ];

  const playoffStats: TeamStats[] = [
    { teamName: 'Boston Celtics', wins: 12, losses: 3, pointsFor: 1680, pointsAgainst: 1520, streak: 'W4', rank: 1 },
    { teamName: 'Denver Nuggets', wins: 10, losses: 5, pointsFor: 1600, pointsAgainst: 1580, streak: 'W1', rank: 2 },
    { teamName: userTeamName, wins: 8, losses: 7, pointsFor: 1550, pointsAgainst: 1600, streak: 'L1', rank: 3 },
    { teamName: 'Milwaukee Bucks', wins: 6, losses: 4, pointsFor: 1200, pointsAgainst: 1180, streak: 'W2', rank: 4 },
  ];

  const currentStats = selectedSeason === 'edition' ? regularSeasonStats : playoffStats;
  const userTeamStats = currentStats.find(team => team.teamName === userTeamName);

  const StatsTable = ({ stats }: { stats: TeamStats[] }) => (
    <div className="space-y-2">
      {stats.map((team, index) => (
        <Card key={team.teamName} className={`${team.teamName === userTeamName ? 'ring-2 ring-nba-blue bg-blue-50' : ''}`}>
          <CardContent className="p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-nba-dark text-white rounded-full flex items-center justify-center text-sm font-bold">
                  {team.rank}
                </div>
                <div>
                  <h3 className="font-semibold">{team.teamName}</h3>
                  <p className="text-sm text-gray-600">
                    {team.wins}-{team.losses} • {((team.wins / (team.wins + team.losses)) * 100).toFixed(1)}%
                  </p>
                </div>
              </div>
              
              <div className="text-right">
                <Badge 
                  variant={team.streak.startsWith('W') ? 'default' : 'destructive'}
                  className={`mb-1 ${team.streak.startsWith('W') ? 'bg-green-600' : ''}`}
                >
                  {team.streak}
                </Badge>
                <p className="text-xs text-gray-500">
                  {team.pointsFor} PF | {team.pointsAgainst} PA
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );

  return (
    <div className="p-4 pb-20 space-y-6">
      {/* Team Performance Overview */}

      {/* Season Toggle */}
      <Tabs value={selectedSeason} onValueChange={(value) => setSelectedSeason(value as 'edition' | 'playoffs')} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="edition" className="flex items-center">
            <BarChart3 size={16} className="mr-2" />
            Ranking Edição
          </TabsTrigger>
          <TabsTrigger value="playoffs" className="flex items-center">
            <ImageIcon size={16} className="mr-2" />
            Últimos Playoffs
          </TabsTrigger>
        </TabsList>

        <TabsContent value="edition" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <BarChart3 className="mr-2" />
                Ranking de Edição
              </CardTitle>
            </CardHeader>
            <CardContent>
              {editionLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-nba-blue mx-auto"></div>
                  <p className="mt-2 text-gray-600">Carregando ranking...</p>
                </div>
              ) : sortedRankingData.length > 0 ? (
                <div className="space-y-2">
                  {/* Cabeçalho da tabela com ordenação */}
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg mb-3">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-gray-300 text-gray-600 rounded-full flex items-center justify-center text-sm font-bold">
                        #
                      </div>
                      <button
                        onClick={() => handleSort('name')}
                        className="flex items-center space-x-1 hover:text-nba-blue transition-colors cursor-pointer"
                      >
                        <span className="font-semibold">Nome do Time</span>
                        {renderSortIcon('name')}
                      </button>
                    </div>
                    
                    <button
                      onClick={() => handleSort('points')}
                      className="flex items-center space-x-1 hover:text-nba-blue transition-colors cursor-pointer"
                    >
                      <span className="font-semibold">Pontuação</span>
                      {renderSortIcon('points')}
                    </button>
                  </div>

                  {/* Lista dos times ordenados */}
                  {sortedRankingData.map((team, index) => (
                    <Card 
                      key={team.team_id} 
                      className={`${team.team_name === userTeamName ? 'ring-2 ring-nba-blue bg-blue-50' : ''} cursor-pointer hover:shadow-md transition-shadow`}
                      onClick={() => handleTeamClick(team.team_id)}
                    >
                      <CardContent className="p-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-nba-dark text-white rounded-full flex items-center justify-center text-sm font-bold">
                              {index + 1}
                            </div>
                            <div>
                              <h3 className="font-semibold">{team.team_name}</h3>
                              <p className="text-sm text-gray-600">
                                {team.championships} títulos • {team.finals_appearances} finais • {team.conference_finals} finais de conf.
                              </p>
                            </div>
                          </div>
                          
                          <div className="text-right">
                            <Badge className="mb-1 bg-nba-orange">
                              {team.total_points} pts
                            </Badge>
                            <p className="text-xs text-gray-500">
                              {team.standings_points} standings • {team.awards_points} awards
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-600">
                  Nenhum dado de ranking disponível
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="playoffs" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <ImageIcon className="mr-2" />
                Últimos Playoffs
              </CardTitle>
            </CardHeader>
            <CardContent>
              {playoffImage?.data?.image_url ? (
                <div className="space-y-4">
                  <div className="relative">
                    <img 
                      src={playoffImage.data.image_url} 
                      alt={playoffImage.data.title || 'Imagem dos playoffs'}
                      className="w-full h-auto rounded-lg shadow-lg cursor-pointer hover:opacity-90 transition-opacity"
                      onClick={() => setIsFullscreenModalOpen(true)}
                    />
                    {isAdmin && (
                      <div className="absolute top-2 right-2">
                        <Button 
                          size="sm" 
                          variant="secondary" 
                          className="bg-white/90 hover:bg-white"
                          onClick={() => setIsImageModalOpen(true)}
                        >
                          <Upload size={14} className="mr-1" />
                          Editar
                        </Button>
                      </div>
                    )}
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">{playoffImage.data.title}</h3>
                    {playoffImage.data.description && (
                      <p className="text-gray-600 mt-1">{playoffImage.data.description}</p>
                    )}
                    <p className="text-xs text-gray-500 mt-2">
                      Enviado por {playoffImage.data.uploader_name} em {new Date(playoffImage.data.created_at).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <ImageIcon size={48} className="mx-auto text-gray-400 mb-4" />
                  <h3 className="text-lg font-semibold text-gray-600 mb-2">Nenhuma imagem disponível</h3>
                  <p className="text-gray-500 mb-4">Ainda não há imagens dos playoffs para esta temporada.</p>
                  {isAdmin && (
                    <Button 
                      className="bg-nba-orange hover:bg-nba-orange/90"
                      onClick={() => setIsImageModalOpen(true)}
                    >
                      <Upload size={16} className="mr-2" />
                      Upload Imagem
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Quick Stats Cards */}


      {/* Modal para upload/edição de imagens */}
      <PlayoffImageModal
        isOpen={isImageModalOpen}
        onClose={() => setIsImageModalOpen(false)}
        seasonId={1} // TODO: Usar temporada atual
        existingImage={playoffImage?.data || null}
      />

      {/* Modal para visualização em tela cheia */}
      <ImageFullscreenModal
        isOpen={isFullscreenModalOpen}
        onClose={() => setIsFullscreenModalOpen(false)}
        imageUrl={playoffImage?.data?.image_url || ''}
        title={playoffImage?.data?.title}
        description={playoffImage?.data?.description}
      />
    </div>
  );
};

export default Statistics;
