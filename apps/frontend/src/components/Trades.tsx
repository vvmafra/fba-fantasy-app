import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { ArrowRight, MessageSquare, Clock, CheckCircle, XCircle, Plus, Calendar, User, PartyPopperIcon, ChevronDown, ChevronUp, AlertCircle } from 'lucide-react';
import { useTrades, useTradesByTeam, useTradeCounts, useUpdateTradeResponse, useExecuteTrade, useRevertTrade, useExecutedTradesCount, useTradeLimits } from '@/hooks/useTrades';
import { useTeams } from '@/hooks/useTeams';
import { useSeasonsFromActive, useActiveSeason } from '@/hooks/useSeasons';
import { useTradeDeadline } from '@/hooks/useDeadlines';
import { TradeWithDetails } from '@/services/tradeService';
import TradeProposal from './forms/tradeProposal';
import { useAuth } from '@/contexts/AuthContext';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { tradeService } from '@/services/tradeService';
import { deadlineService } from '@/services/deadlineService';

interface TradesProps {
  isAdmin: boolean;
  teamId?: number;
}

const Trades = ({ isAdmin, teamId }: TradesProps) => {
  const [selectedTrade, setSelectedTrade] = useState<number | null>(null);
  const [newComment, setNewComment] = useState('');
  const [showMyExecuted, setShowMyExecuted] = useState(true);
  const [showMyPending, setShowMyPending] = useState(true);
  const [showLeagueExecuted, setShowLeagueExecuted] = useState(true);
  const [cancelingTradeId, setCancelingTradeId] = useState<number | null>(null);

  

  // Hooks
  const { data: activeSeasonData } = useActiveSeason();
  const { data: tradesData } = useTrades({ 
    status: 'executed', 
    sortBy: 'executed_at', 
    sortOrder: 'desc',
    season_id: activeSeasonData?.data?.id 
  });
  const { data: myTradesData, refetch: refetchMyTrades } = useTradesByTeam(teamId || 0, activeSeasonData?.data?.id || 1);
  const { data: countsData } = useTradeCounts(activeSeasonData?.data?.id || 1);
  const { data: teamsData } = useTeams();
  const { data: seasonsData } = useSeasonsFromActive();
  const { deadline: tradeDeadline, loading: deadlineLoading } = useTradeDeadline();
  
  // Calcular período atual para limite de trades (a cada 2 temporadas)
  const currentSeason = activeSeasonData?.data?.season_number || 1;
  const seasonStart = Math.floor((currentSeason - 1) / 2) * 2 + 1;
  const seasonEnd = seasonStart + 1;
  
  // Hook para contar trades executadas no período atual
  const { data: tradeLimitData } = useExecutedTradesCount(
    teamId || 0, 
    seasonStart, 
    seasonEnd
  );
  
  // Verificar se o deadline de trade já passou
  const isTradeDeadlineExpired = tradeDeadline ? deadlineService.utils.isDeadlineExpired(tradeDeadline) : false;
  
  // Verificar se está próximo do deadline (menos de 8 horas)
  const isTradeDeadlineNear = tradeDeadline ? deadlineService.utils.isDeadlineNear(tradeDeadline) : false;
  
  const updateResponseMutation = useUpdateTradeResponse();
  const executeTradeMutation = useExecuteTrade();
  const revertTradeMutation = useRevertTrade();
  const cancelTradeMutation = useMutation({
    mutationFn: (tradeId: number) => tradeService.cancelTrade(tradeId, teamId || 0)
  });
  const { user } = useAuth();

  // Separar trades por categoria
  // Filtra apenas trades válidas (ignora canceladas e revertidas)
  const myValidTrades = myTradesData?.data?.filter(
    t => t.status !== 'cancelled' && t.status !== 'reverted'
  ) || [];

  const myPendingTrades = myValidTrades.filter(
    t => t.status === 'pending' || t.status === 'proposed'
  ) || [];
  const myExecutedTrades = myValidTrades.filter(
    t => t.status === 'executed'
  ) || [];
  
  const leagueExecutedTrades = tradesData?.data || [];

  const pendingCount = myPendingTrades.length;

  // Calcular trades restantes
  const tradesUsed = tradeLimitData?.data?.trades_used || 0;
  const tradesLimit = 10; // Limite fixo de 10 trades a cada 2 temporadas
  const tradesRemaining = tradesLimit - tradesUsed;
  const canProposeTrade = tradesRemaining > 0 && !isTradeDeadlineExpired;

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { color: string; icon: any; label: string }> = {
      proposed: { color: 'bg-blue-100 text-blue-800', icon: Clock, label: 'Proposta' },
      pending: { color: 'bg-yellow-100 text-yellow-800', icon: Clock, label: 'Pendente' },
      executed: { color: 'bg-green-100 text-green-800', icon: CheckCircle, label: 'Executada' },
      reverted: { color: 'bg-red-100 text-red-800', icon: XCircle, label: 'Revertida' },
      cancelled: { color: 'bg-gray-100 text-gray-800', icon: XCircle, label: 'Cancelada' }
    };
    
    const config = statusConfig[status] || statusConfig.proposed;
    const Icon = config.icon;
    
    return (
      <Badge className={config.color}>
        <Icon size={12} className="mr-1" />
        {config.label}
      </Badge>
    );
  };

  const getTeamName = (teamId: number) => {
    return teamsData?.data?.find(team => team.id === teamId)?.name || `Time ${teamId}`;
  };

  const getSeasonName = (seasonId: number) => {
    const season = seasonsData?.data?.find(season => season.id === seasonId);
    if (!season) return `Temporada ${seasonId}`; // fallback seguro
    return `${season.season_number} (${season.year})`;
  };

  const handleRespondToTrade = async (participantId: number, response: 'accepted' | 'rejected') => {
    try {
      await updateResponseMutation.mutateAsync({
        participantId,
        data: { response_status: response }
      });
      
      // Forçar refetch das trades do time após a resposta
      setTimeout(() => {
        refetchMyTrades();
      }, 500); // Pequeno delay para garantir que o backend processou
    } catch (error) {
      console.error('Erro ao responder à trade:', error);
    }
  };

  const handleExecuteTrade = async (tradeId: number) => {
    try {
      await executeTradeMutation.mutateAsync(tradeId);
    } catch (error) {
      console.error('Erro ao executar trade:', error);
    }
  };

  const handleRevertTrade = async (tradeId: number) => {
    try {
      await revertTradeMutation.mutateAsync({ tradeId, revertedByUser: Number(user?.id) });
      // Atualiza a lista após reverter
      if (typeof refetchMyTrades === 'function') refetchMyTrades();
    } catch (error) {
      console.error('Erro ao reverter trade:', error);
    }
  };

  const handleCancelTrade = async (tradeId: number) => {
    try {
      setCancelingTradeId(tradeId);
      await cancelTradeMutation.mutateAsync(tradeId);
      if (typeof refetchMyTrades === 'function') refetchMyTrades();
    } catch (error) {
      console.error('Erro ao cancelar trade:', error);
    } finally {
      setCancelingTradeId(null);
    }
  };

  const TradeCard = ({ trade }: { trade: any }) => {
    // Identifica o participante do time logado
    const myParticipant = trade.participants?.find((p: any) => p.team_id === teamId);
    
    // Verificar limites de trades para esta trade específica
    const { data: tradeLimitsData } = useTradeLimits(trade.id);
    
    // Função para mostrar status amigável
    const getResponseStatus = (status: string) => {
      if (status === 'accepted') return <span className="text-green-700 font-semibold">Aceitou</span>;
      if (status === 'rejected') return <span className="text-red-700 font-semibold">Rejeitou</span>;
      return <span className="text-yellow-700 font-semibold">Pendente</span>;
    };
    
    // Verificar se algum participante atingiu o limite
    const hasParticipantAtLimit = tradeLimitsData?.data?.participants?.some((p: any) => !p.canTrade) || false;
    const participantsAtLimit = tradeLimitsData?.data?.participants?.filter((p: any) => !p.canTrade) || [];

    return (
      <Card className="h-full">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center justify-between text-sm">
            <span>Trade #{trade.id}</span>
            <div className="flex items-center gap-2">
              {getStatusBadge(trade.status)}
            
            </div>
          </CardTitle>
          <div className="text-xs text-gray-600 space-y-1">
            <p>Proposto por {getTeamName(trade.created_by_team)}</p>
            <p>Temporada {getSeasonName(trade.season_id)}</p>
            <p>{new Date(trade.created_at).toLocaleDateString('pt-BR')}</p>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-3">
          {/* Teams Involved */}
          {/* <div className="flex items-center justify-center space-x-1 text-xs">
            {trade.participants?.map((participant: any, index: number) => (
              <React.Fragment key={participant.id}>
                <span className="font-medium px-2 py-1 bg-nba-blue text-white rounded text-xs">
                  {participant.team.abbreviation}
                </span>
                {index < (trade.participants?.length || 0) - 1 && <ArrowRight size={12} />}
              </React.Fragment>
            ))}
          </div> */}

          {/* Assets Summary */}
          <div className="space-y-2">
            {trade.participants?.map((participant: any) => (
              <div key={participant.id} className="text-xs">
                <div className="font-medium text-gray-700 mb-1">
                  {participant.team.name} ({participant.team.abbreviation}) enviou:
                </div>
                {participant.assets?.map((asset: any) => {
                  // Determinar o destino do asset
                  let destinoAbbreviation = '?';
                  
                  if (asset.to_team) {
                    // Se tem to_team definido, usar ele
                    destinoAbbreviation = asset.to_team.abbreviation;
                  } else if (trade.participants?.length === 2) {
                    // Se não tem to_team mas são apenas 2 times, pegar o outro participante
                    const outroParticipante = trade.participants.find((p: any) => p.id !== participant.id);
                    destinoAbbreviation = outroParticipante?.team?.abbreviation || '?';
                  }
                  
                  return (
                    <div key={`${participant.id}-${asset.id}`} className="flex items-center ml-2 mb-1">
                      {asset.asset_type === 'player' ? (
                        <User size={10} className="mr-1 text-gray-500" />
                      ) : (
                        <Calendar size={10} className="mr-1 text-gray-500" />
                      )}
                      <span className="text-xs">
                        {asset.asset_type === 'player'
                          ? `${asset.player?.name || 'Jogador'} → para ${destinoAbbreviation}`
                          : `pick ${asset.pick?.round}ª rodada - ${asset.pick?.year?.toString().slice(0, 4)} (via ${asset.pick?.original_team_name || asset.pick?.original_team_abbreviation || '?'}) → para ${destinoAbbreviation}`
                        }
                      </span>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>

          {/* Aviso de limite de trades */}
          {hasParticipantAtLimit && (
            <div className="bg-red-50 border border-red-200 rounded-md p-3 mb-3">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
                <div className="text-xs">
                  <p className="font-semibold text-red-800 mb-1">
                    ⚠️ Trade não pode ser aceita
                  </p>
                  <p className="text-red-700 mb-2">
                    Os seguintes times atingiram o limite de trades para este período:
                  </p>
                  <ul className="space-y-1">
                    {participantsAtLimit.map((participant: any) => (
                      <li key={participant.teamId} className="text-red-600">
                        • <strong>{participant.teamName}</strong>: {participant.tradesUsed}/{participant.tradesLimit} trades utilizadas
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Status dos participantes */}
          <div className="space-y-1 text-xs">
            <div className="font-semibold mb-1">Status dos times:</div>
            {trade.participants?.map((participant: any) => (
              <div key={participant.id} className="flex items-center gap-2">
                <span className="font-medium">{participant.team.abbreviation}</span>
                {participant.is_initiator && (
                  <span className="text-xs text-gray-500">(Iniciador)</span>
                )}
                <span>
                  {getResponseStatus(participant.response_status)}
                </span>
              </div>
            ))}
            {isAdmin && trade.status === 'executed' && (
          <div className="flex justify-end mt-4 mb-2">
            <Button
              size="sm"
              variant="destructive"
              onClick={() => handleRevertTrade(trade.id)}
              disabled={revertTradeMutation.isPending}
            >
              {revertTradeMutation.isPending ? 'Revertendo...' : 'Reverter'}
            </Button>
          </div>
        )}
          </div>

          {/* Botões de ação para o time logado, se aplicável */}
          {myParticipant &&
            !myParticipant.is_initiator &&
            !['accepted', 'rejected'].includes(myParticipant.response_status) &&
            ['proposed', 'pending'].includes(trade.status) && (
              <div className="flex flex-col space-y-2 pt-2">
                <Button
                  size="sm"
                  className="bg-green-600 hover:bg-green-700 text-xs"
                  onClick={() => handleRespondToTrade(myParticipant.id, 'accepted')}
                  disabled={hasParticipantAtLimit || !canProposeTrade}
                  title={
                    hasParticipantAtLimit 
                      ? "Não é possível aceitar - limite de trades atingido"
                      : isTradeDeadlineExpired
                      ? "Não é possível aceitar - deadline de trade expirado"
                      : ""
                  }
                >
                  Aceitar
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  className="text-xs"
                  onClick={() => handleRespondToTrade(myParticipant.id, 'rejected')}
                  disabled={!canProposeTrade}
                  title={
                    isTradeDeadlineExpired
                      ? "Não é possível rejeitar - deadline de trade expirado"
                      : ""
                  }
                >
                  Rejeitar
                </Button>
              </div>
            )}

          {/* Botão de cancelar para o iniciador */}
          {myParticipant &&
            myParticipant.is_initiator &&
            ['proposed', 'pending'].includes(trade.status) && (
              <div className="flex flex-col space-y-2 pt-2">
                <Button
                  size="sm"
                  variant="destructive"
                  className="text-xs"
                  onClick={() => handleCancelTrade(trade.id)}
                  disabled={cancelingTradeId === trade.id || !canProposeTrade}
                  title={
                    isTradeDeadlineExpired
                      ? "Não é possível cancelar - deadline de trade expirado"
                      : ""
                  }
                >
                  {cancelingTradeId === trade.id ? 'Cancelando...' : 'Cancelar'}
                </Button>
              </div>
            )}

          {/* Execução automática - não precisa de botão */}
        </CardContent>
        
      </Card>
    );
  };

  return (
    <div className="p-4 pb-20 space-y-6">

       {/* Quick Stats */}
       <div className="grid grid-cols-3 gap-3">
        <Card className="text-center">
          <CardContent className="p-3">
            <p className="text-lg font-bold text-blue-600">{myPendingTrades.length}</p>
            <p className="text-xs text-gray-600">Minhas Pendentes</p>
          </CardContent>
        </Card>
        {/* <Card className="text-center">
          <CardContent className="p-3">
            <p className="text-lg font-bold text-green-600">{myExecutedTrades.length}</p>
            <p className="text-xs text-gray-600">Minhas Executadas</p>
          </CardContent>
        </Card> */}
        <Card className="text-center">
          <CardContent className="p-3">
            <p className="text-lg font-bold text-green-600">{tradesUsed}</p>
            <p className="text-xs text-gray-600">Trades Executadas</p>
          </CardContent>
        </Card>
        <Card className="text-center">
          <CardContent className="p-3">
            <p className={`text-lg font-bold ${canProposeTrade ? 'text-gray-600' : 'text-red-600'}`}>
              {tradesRemaining}
            </p>
            <p className="text-xs text-gray-600">Trades Restantes</p>
            <p className="text-xs text-gray-500">Temp. {seasonStart}-{seasonEnd}</p>
          </CardContent>
        </Card>
      </div>

       {/* Aviso sobre deadline de trade */}
       {tradeDeadline && (
        <Card className={`border-2 ${isTradeDeadlineExpired ? 'border-red-200 bg-red-50' : isTradeDeadlineNear ? 'border-orange-200 bg-orange-50' : 'border-blue-200 bg-blue-50'}`}>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Clock className={`h-5 w-5 ${isTradeDeadlineExpired ? 'text-red-600' : isTradeDeadlineNear ? 'text-orange-600' : 'text-blue-600'}`} />
              <div>
                <p className="text-sm font-medium">
                  {isTradeDeadlineExpired ? 'Deadline de Trade Expirado' : isTradeDeadlineNear ? 'Deadline de Trade Próximo' : 'Deadline de Trade'}
                </p>
                <p className="text-xs">
                  {isTradeDeadlineExpired 
                    ? `O deadline de trade expirou em ${deadlineService.utils.formatDeadlineDate(tradeDeadline)}. Não é mais possível fazer trades.`
                    : isTradeDeadlineNear 
                    ? `Deadline de trade em ${deadlineService.utils.formatDeadlineDate(tradeDeadline)}. Apresse-se!`
                    : `Deadline de trade: ${deadlineService.utils.formatDeadlineDate(tradeDeadline)}`
                  }
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

       {/* Mensagem quando deadline expirou */}
       {isTradeDeadlineExpired && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-red-600" />
              <div>
                <p className="text-sm font-medium text-red-800">
                  Deadline de Trade Expirado
                </p>
                <p className="text-xs text-red-600">
                  O deadline de trade expirou. Não é mais possível aceitar, rejeitar ou cancelar trades pendentes.
                  Todas as trades pendentes serão automaticamente canceladas.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* New Trade Button */}
      <TradeProposal 
        teamId={teamId} 
        // isAdmin={isAdmin} 
        onTradeCreated={refetchMyTrades}
        canProposeTrade={canProposeTrade}
        tradesRemaining={tradesRemaining}
      />
      
      {/* Mensagem quando limite atingido */}
      {!canProposeTrade && !isTradeDeadlineExpired && (
        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-orange-600" />
              <div>
                <p className="text-sm font-medium text-orange-800">
                  Limite de trades atingido para este período
                </p>
                <p className="text-xs text-orange-600">
                  Você já utilizou todas as {tradesLimit} trades disponíveis para as temporadas {seasonStart}-{seasonEnd}.
                  O limite será renovado no próximo período.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Minhas Trades Executadas */}
      {myExecutedTrades.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-nba-dark">Minhas Trades Executadas</h2>
            <Button variant="ghost" size="icon" onClick={() => setShowMyExecuted(v => !v)}>
              {showMyExecuted ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
            </Button>
          </div>
          {showMyExecuted && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {myExecutedTrades.map(trade => (
                <TradeCard key={trade.id} trade={trade} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Minhas Trades Pendentes */}
      {myPendingTrades.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-nba-dark">Minhas Trades Pendentes</h2>
            <div className="flex items-center gap-2">
              {pendingCount > 0 && (
                <Badge variant="destructive" className="text-sm">
                  {pendingCount} 
                </Badge>
              )}
              <Button variant="ghost" size="icon" onClick={() => setShowMyPending(v => !v)}>
                {showMyPending ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
              </Button>
            </div>
          </div>
          {showMyPending && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {myPendingTrades.map(trade => (
                <TradeCard key={trade.id} trade={trade} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Trades Executadas da Liga */}
      {leagueExecutedTrades.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-nba-dark">Trades Executadas da Liga</h2>
            <Button variant="ghost" size="icon" onClick={() => setShowLeagueExecuted(v => !v)}>
              {showLeagueExecuted ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
            </Button>
          </div>
          {showLeagueExecuted && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {leagueExecutedTrades.map(trade => (
                <TradeCard key={trade.id} trade={trade} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Trades;
