import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowUp, ArrowDown, Calendar, Trophy, RefreshCw } from 'lucide-react';
import { usePicks } from '@/hooks/usePicks';
import { useTeamPickSwaps } from '@/hooks/usePickSwaps';
import { PickSwapCard } from '@/components/PickSwapCard';

interface Pick {
  id: string;
  year: number;
  round: number;
  originalTeam: string;
  currentTeam: string;
  isProtected: boolean;
  protection?: string;
  tradedFrom?: string;
  tradedTo?: string;
}

interface PicksProps {
  isAdmin: boolean;
  teamId?: number;
}

const Picks = ({ isAdmin, teamId }: PicksProps) => {
  // Buscar picks do time
  const { data: picksData, isLoading: picksLoading } = usePicks();
  const { data: swapsData, isLoading: swapsLoading } = useTeamPickSwaps(teamId || 0);

  if (picksLoading || swapsLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  // Mock data - será substituído por dados reais do Supabase
  const mockPicks: Pick[] = [
    { 
      id: '1', 
      year: 2024, 
      round: 1, 
      originalTeam: 'Lakers', 
      currentTeam: 'Lakers', 
      isProtected: false 
    },
    { 
      id: '2', 
      year: 2024, 
      round: 2, 
      originalTeam: 'Lakers', 
      currentTeam: 'Heat', 
      isProtected: false,
      tradedTo: 'Miami Heat'
    },
    { 
      id: '3', 
      year: 2025, 
      round: 1, 
      originalTeam: 'Celtics', 
      currentTeam: 'Lakers', 
      isProtected: true,
      protection: 'Top 3',
      tradedFrom: 'Boston Celtics'
    },
    { 
      id: '4', 
      year: 2025, 
      round: 2, 
      originalTeam: 'Lakers', 
      currentTeam: 'Lakers', 
      isProtected: false 
    },
    { 
      id: '5', 
      year: 2026, 
      round: 1, 
      originalTeam: 'Lakers', 
      currentTeam: 'Lakers', 
      isProtected: true,
      protection: 'Top 5'
    },
  ];

  const ownedPicks = mockPicks.filter(p => p.currentTeam === 'Lakers');
  const tradedPicks = mockPicks.filter(p => p.originalTeam === 'Lakers' && p.currentTeam !== 'Lakers');

  const PickCard = ({ pick }: { pick: Pick }) => (
    <Card className="mb-3">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <div className="flex items-center space-x-2 mb-2">
              <h3 className="font-semibold text-lg">
                {pick.year} - {pick.round}ª Rodada
              </h3>
              {pick.isProtected && (
                <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                  {pick.protection}
                </Badge>
              )}
            </div>
            
            <div className="space-y-1 text-sm text-gray-600">
              <p>Time Original: <span className="font-medium">{pick.originalTeam}</span></p>
              <p>Atual Proprietário: <span className="font-medium">{pick.currentTeam}</span></p>
              
              {pick.tradedFrom && (
                <p className="flex items-center text-green-600">
                  <ArrowDown size={14} className="mr-1" />
                  Recebido de: {pick.tradedFrom}
                </p>
              )}
              
              {pick.tradedTo && (
                <p className="flex items-center text-red-600">
                  <ArrowUp size={14} className="mr-1" />
                  Enviado para: {pick.tradedTo}
                </p>
              )}
            </div>
          </div>
          
          <div className="text-right">
            <Badge 
              variant={pick.currentTeam === 'Lakers' ? 'default' : 'destructive'}
              className={pick.currentTeam === 'Lakers' ? 'bg-nba-blue' : ''}
            >
              {pick.currentTeam === 'Lakers' ? 'Nosso' : 'Trocado'}
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="p-4 pb-20 space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white">
          <CardContent className="p-4 text-center">
            <Trophy size={24} className="mx-auto mb-2" />
            <p className="text-2xl font-bold">{ownedPicks.length}</p>
            <p className="text-sm opacity-90">Picks Próprios</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-red-500 to-red-600 text-white">
          <CardContent className="p-4 text-center">
            <ArrowUp size={24} className="mx-auto mb-2" />
            <p className="text-2xl font-bold">{tradedPicks.length}</p>
            <p className="text-sm opacity-90">Picks Trocados</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
          <CardContent className="p-4 text-center">
            <RefreshCw size={24} className="mx-auto mb-2" />
            <p className="text-2xl font-bold">{swapsData?.length || 0}</p>
            <p className="text-sm opacity-90">Pick Swaps</p>
          </CardContent>
        </Card>
      </div>

      {/* Draft Calendar */}
      <Card className="bg-nba-light">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Calendar className="mr-2" />
            Próximo Draft: Junho 2024
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-600">
            O draft de 2024 acontecerá em breve. Certifique-se de que suas picks estão organizadas!
          </p>
        </CardContent>
      </Card>

      {/* Owned Picks */}
      <div>
        <h2 className="text-xl font-bold mb-4 text-nba-dark">
          Picks em Nossa Posse
        </h2>
        {ownedPicks.map(pick => (
          <PickCard key={pick.id} pick={pick} />
        ))}
      </div>

      {/* Traded Away Picks */}
      {tradedPicks.length > 0 && (
        <div>
          <h2 className="text-xl font-bold mb-4 text-nba-dark">
            Picks Trocados
          </h2>
          {tradedPicks.map(pick => (
            <PickCard key={pick.id} pick={pick} />
          ))}
        </div>
      )}

      {/* Pick Swaps */}
      {swapsData && swapsData.length > 0 && (
        <div>
          <h2 className="text-xl font-bold mb-4 text-nba-dark flex items-center gap-2">
            <RefreshCw size={20} />
            Pick Swaps
          </h2>
          {swapsData.map(swap => (
            <PickSwapCard 
              key={swap.id} 
              swap={swap} 
              isOwner={swap.owned_by_team_id === teamId}
            />
          ))}
        </div>
      )}

      {/* Admin Actions */}
      {isAdmin && (
        <Card className="border-2 border-dashed border-nba-orange">
          <CardContent className="p-4 text-center">
            <h3 className="font-semibold mb-2">Ações de Admin</h3>
            <div className="flex space-x-2">
              <Button className="flex-1 bg-nba-orange hover:bg-nba-orange/90">
                Gerenciar Picks
              </Button>
              <Button variant="outline" className="flex-1">
                Histórico Drafts
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Picks;
