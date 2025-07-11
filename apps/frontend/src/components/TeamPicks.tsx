import React, { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowUp, ArrowDown, ChevronUp, ChevronDown } from 'lucide-react';
import { useTeamFuturePicks } from '@/hooks/usePicks';
import { useTeam } from '@/hooks/useTeams';

interface TeamPicksProps {
  teamId: number;
}

const TeamPicks = ({ teamId }: TeamPicksProps) => {
  // Hook para buscar picks futuras do time
  const { data: futurePicks, isLoading: isLoadingPicks, error: errorPicks } = useTeamFuturePicks(teamId);
  
  // Hook para buscar informações do time
  const { data: teamData, isLoading: isLoadingTeam } = useTeam(teamId);

  // Agrupar picks em posse e trocadas, ordenadas por season_year e depois por round
  const picksEmPosse = useMemo(() => {
    if (!futurePicks) return [];
    const allPicks = [
      ...(futurePicks.my_own_picks || []),
      ...(futurePicks.received_picks || [])
    ];
    return allPicks.sort((a, b) => {
      // Primeiro ordena por ano
      if (a.season_year !== b.season_year) {
        return a.season_year - b.season_year;
      }
      // Se for o mesmo ano, ordena por round (1º round antes do 2º)
      return a.round - b.round;
    });
  }, [futurePicks]);

  const picksTrocadas = useMemo(() => {
    if (!futurePicks) return [];
    return (futurePicks.lost_picks || []).sort((a, b) => {
      // Primeiro ordena por ano
      if (a.season_year !== b.season_year) {
        return a.season_year - b.season_year;
      }
      // Se for o mesmo ano, ordena por round (1º round antes do 2º)
      return a.round - b.round;
    });
  }, [futurePicks]);

  // Estados para minimizar/maximizar
  const [showOwnedPicks, setShowOwnedPicks] = useState(true);
  const [showTradedPicks, setShowTradedPicks] = useState(true);

  const PickCard = ({ pick, isOwned }: { pick: any; isOwned: boolean }) => {
    // Determinar o tipo da pick baseado na propriedade
    const isOriginalPick = pick.original_team_id === teamId;
    const isAcquiredPick = isOwned && !isOriginalPick;
    
    return (
      <Card className="mb-3">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="flex items-center space-x-2 mb-2">
                <h3 className="font-semibold text-lg">
                  {pick.season_year} - {pick.round}ª Rodada
                </h3>
                {pick.is_protected && (
                  <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                    {pick.protection || 'Protegida'}
                  </Badge>
                )}
              </div>
              
              <div className="space-y-1 text-sm text-gray-600">
                <p>Time Original: <span className="font-medium">{pick.original_team_name}</span></p>
                {/* <p>Atual Proprietário: <span className="font-medium">{pick.current_team_name}</span></p> */}
                
                {!isOwned && pick.original_team_id !== pick.current_team_id && (
                  <p className="flex items-center text-red-600">
                    <ArrowUp size={14} className="mr-1" />
                    Enviado para: {pick.current_team_name}
                  </p>
                )}
              </div>
            </div>
            
            <div className="text-right">
              <Badge 
                variant={isOwned ? 'default' : 'destructive'}
                className={
                  isOwned 
                    ? isOriginalPick 
                      ? 'bg-nba-blue' 
                      : 'bg-green-500 hover:bg-green-600'
                    : ''
                }
              >
                {isOwned 
                  ? isOriginalPick 
                    ? 'Própria' 
                    : 'Adquirida'
                  : 'Trocada'
                }
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  if (isLoadingPicks || isLoadingTeam) {
    return (
      <div className="space-y-4">
        <div className="text-center text-gray-500">Carregando picks...</div>
      </div>
    );
  }

  if (errorPicks) {
    return (
      <div className="space-y-4">
        <div className="text-center text-red-500">Erro ao carregar picks</div>
      </div>
    );
  }

  const teamName = teamData?.data?.name || `Time ${teamId}`;

  return (
    <div className="space-y-6">
      {/* Picks em Nossa Posse */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold">
            Picks do {teamName}
          </h2>
          <button type="button" onClick={() => setShowOwnedPicks(v => !v)} className="ml-2">
            {showOwnedPicks ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
        </div>
        {showOwnedPicks && (
          picksEmPosse.length === 0 ? (
            <div className="text-center text-gray-400">Nenhuma pick futura em posse.</div>
          ) : (
            picksEmPosse.map(pick => (
              <PickCard key={pick.id} pick={pick} isOwned={true} />
            ))
          )
        )}
      </div>

      {/* Picks Trocadas */}
      {picksTrocadas.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold">
              Picks Trocadas
            </h2>
            <button type="button" onClick={() => setShowTradedPicks(v => !v)} className="ml-2">
              {showTradedPicks ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
            </button>
          </div>
          {showTradedPicks && (
            picksTrocadas.map(pick => (
              <PickCard key={pick.id} pick={pick} isOwned={false} />
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default TeamPicks;
