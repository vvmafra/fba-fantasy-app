import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { BarChart3, Trophy, Calendar, Upload, TrendingUp, Target } from 'lucide-react';
import { useTeam } from '@/hooks/useTeams';

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

const Statistics = ({ isAdmin, teamId }: StatisticsProps) => {
  const [selectedSeason, setSelectedSeason] = useState<'regular' | 'playoffs'>('regular');
  
  // Buscar dados do time do usuário
  const { data: team } = useTeam(teamId || 1); // TODO: Pegar team_id do usuário logado
  const userTeamName = team?.data?.name || 'Los Angeles Lakers'; // Fallback para dados mock

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

  const currentStats = selectedSeason === 'regular' ? regularSeasonStats : playoffStats;
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
      {userTeamStats && (
        <Card className="bg-gradient-to-r from-nba-blue to-nba-dark text-white">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>{userTeamName}</span>
              <Badge variant="secondary" className="bg-nba-orange">
                #{userTeamStats.rank}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-4 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold">{userTeamStats.wins}</p>
                <p className="text-sm opacity-80">Vitórias</p>
              </div>
              <div>
                <p className="text-2xl font-bold">{userTeamStats.losses}</p>
                <p className="text-sm opacity-80">Derrotas</p>
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {((userTeamStats.wins / (userTeamStats.wins + userTeamStats.losses)) * 100).toFixed(1)}%
                </p>
                <p className="text-sm opacity-80">Aproveit.</p>
              </div>
              <div>
                <p className="text-2xl font-bold">{userTeamStats.streak}</p>
                <p className="text-sm opacity-80">Sequência</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Season Toggle */}
      <Tabs value={selectedSeason} onValueChange={(value) => setSelectedSeason(value as 'regular' | 'playoffs')} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="regular" className="flex items-center">
            <Calendar size={16} className="mr-2" />
            Temporada Regular
          </TabsTrigger>
          <TabsTrigger value="playoffs" className="flex items-center">
            <Trophy size={16} className="mr-2" />
            Playoffs
          </TabsTrigger>
        </TabsList>

        <TabsContent value="regular" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <BarChart3 className="mr-2" />
                Classificação - Temporada Regular
              </CardTitle>
            </CardHeader>
            <CardContent>
              <StatsTable stats={regularSeasonStats} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="playoffs" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Trophy className="mr-2" />
                Classificação - Playoffs
              </CardTitle>
            </CardHeader>
            <CardContent>
              <StatsTable stats={playoffStats} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Quick Stats Cards */}
      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <TrendingUp size={24} className="mx-auto mb-2 text-nba-blue" />
            <p className="text-lg font-bold">+5.2</p>
            <p className="text-xs text-gray-600">Média de Pontos</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <Target size={24} className="mx-auto mb-2 text-nba-orange" />
            <p className="text-lg font-bold">52.3%</p>
            <p className="text-xs text-gray-600">FG%</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Matches */}
      <Card>
        <CardHeader>
          <CardTitle>Últimos Jogos</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Badge className="bg-green-600">V</Badge>
              <span className="font-medium">{userTeamName} 118 x 110 Warriors</span>
            </div>
            <span className="text-sm text-gray-500">Ontem</span>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Badge className="bg-green-600">V</Badge>
              <span className="font-medium">{userTeamName} 125 x 120 Nuggets</span>
            </div>
            <span className="text-sm text-gray-500">3d atrás</span>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Badge variant="destructive">D</Badge>
              <span className="font-medium">Celtics 130 x 118 {userTeamName}</span>
            </div>
            <span className="text-sm text-gray-500">1 sem atrás</span>
          </div>
        </CardContent>
      </Card>

      {/* Admin Actions */}
      {isAdmin && (
        <Card className="border-2 border-dashed border-nba-orange">
          <CardContent className="p-4 space-y-3">
            <h3 className="font-semibold text-center">Painel Admin</h3>
            <div className="grid grid-cols-1 gap-2">
              <Button className="w-full bg-nba-orange hover:bg-nba-orange/90">
                <Upload size={16} className="mr-2" />
                Upload Screenshot
              </Button>
              <Button variant="outline" className="w-full">
                Editar Estatísticas
              </Button>
              <Button variant="outline" className="w-full">
                Gerenciar Temporadas
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Season Info */}
      <Card className="bg-nba-light">
        <CardContent className="p-4 text-center">
          <h3 className="font-semibold mb-2">Temporada 2023-24</h3>
          <p className="text-sm text-gray-600">
            Regular: 82 jogos • Playoffs: Até 28 jogos
          </p>
          <p className="text-xs text-gray-500 mt-1">
            Última atualização: {new Date().toLocaleDateString('pt-BR')}
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default Statistics;
