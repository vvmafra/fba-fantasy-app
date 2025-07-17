import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Clock, CheckCircle, XCircle, Calendar, User, AlertCircle } from 'lucide-react';
import { useTrades } from '@/hooks/useTrades';
import { useTeams } from '@/hooks/useTeams';
import { useSeasonsFromActive } from '@/hooks/useSeasons';
import { useUpdateTradeMade } from '@/hooks/useTrades';

const TradesAdminPage = () => {
  const [selectedSeason, setSelectedSeason] = useState<number | null>(null);
  const [madeFilter, setMadeFilter] = useState<'all' | 'true' | 'false'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'executed' | 'reverted'>('all');
  const [updatingTradeId, setUpdatingTradeId] = useState<number | null>(null);

  // Hooks
  const { data: seasonsData } = useSeasonsFromActive();
  const { data: teamsData } = useTeams();
  const updateTradeMadeMutation = useUpdateTradeMade();

  // Encontrar temporada ativa como padrão
  const activeSeason = seasonsData?.data?.find(season => season.is_active);
  const defaultSeasonId = selectedSeason || activeSeason?.id || null;

  // Construir filtros para a query
  const filters: any = {};
  if (defaultSeasonId) filters.season_id = defaultSeasonId;
  if (madeFilter !== 'all') filters.made = madeFilter === 'true';
  if (statusFilter === 'executed' || statusFilter === 'reverted') {
    filters.status = statusFilter;
  } else if (statusFilter === 'all') {
    filters.status = undefined; // vamos filtrar no frontend
  }

  const { data: tradesData, isLoading, refetch } = useTrades({ ...filters, limit: 100 });

  const trades = tradesData?.data || [];

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
    if (!season) return `Temporada ${seasonId}`;
    return `${season.season_number} (${season.year})`;
  };

  const handleMadeToggle = async (tradeId: number, currentMade: boolean) => {
    try {
      setUpdatingTradeId(tradeId);
      await updateTradeMadeMutation.mutateAsync({ tradeId, made: !currentMade });
      refetch();
    } catch (error) {
      console.error('Erro ao atualizar status da trade:', error);
    } finally {
      setUpdatingTradeId(null);
    }
  };

  const TradeCard = ({ trade }: { trade: any }) => {
    return (
      <Card className={`h-full ${trade.made ? 'opacity-75' : ''}`}>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-3">
              <Checkbox
                checked={trade.made || false}
                onCheckedChange={() => handleMadeToggle(trade.id, trade.made || false)}
                disabled={updatingTradeId === trade.id}
              />
              <span className={trade.made ? 'line-through' : ''}>
                Trade #{trade.id}
              </span>
            </div>
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
          {/* Assets Summary */}
          <div className="space-y-2">
            {trade.participants?.map((participant: any) => (
              <div key={participant.id} className="text-xs">
                <div className="font-medium text-gray-700 mb-1">
                  {participant.team.name} ({participant.team.abbreviation}) enviou:
                </div>
                {participant.assets?.map((asset: any) => {
                  // Determinar o destino do asset
                  let toTeamName = '?';
                  if (asset.to_team) {
                    toTeamName = asset.to_team.name;
                  } else if (trade.participants?.length === 2) {
                    const outroParticipante = trade.participants.find((p: any) => p.id !== participant.id);
                    toTeamName = outroParticipante?.team?.name || '?';
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
                          ? `${asset.player?.name || 'Jogador'} → ${toTeamName}`
                          : `pick ${asset.pick?.round}ª rodada - ${asset.pick?.year?.toString().slice(0, 4)} (via ${asset.pick?.original_team_name || asset.pick?.original_team_abbreviation || '?'}) → ${toTeamName}`
                        }
                      </span>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  };

  // Filtrar trades no frontend se statusFilter for 'all'
  const filteredTrades = statusFilter === 'all'
    ? trades.filter((t: any) => t.status === 'executed' || t.status === 'reverted')
    : trades;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-bold text-nba-dark sm:text-2xl md:text-3xl">Gerenciamento de Trades</h1>
        <div className="text-sm text-gray-600">
          Total: {filteredTrades.length} trades
        </div>
      </div>

      {/* Filtros */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Filtro de Temporada */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">Temporada</label>
          <Select
            value={defaultSeasonId?.toString() || ''}
            onValueChange={(value) => setSelectedSeason(value ? Number(value) : null)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione uma temporada" />
            </SelectTrigger>
            <SelectContent>
              {seasonsData?.data?.map((season) => (
                <SelectItem key={season.id} value={season.id.toString()}>
                  {season.season_number} ({season.year}){season.is_active ? '(Ativa)' : ''}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Filtro de Status Made */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">Status de Conclusão</label>
          <Select
            value={madeFilter}
            onValueChange={(value: 'all' | 'true' | 'false') => setMadeFilter(value)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              <SelectItem value="false">Não feitas</SelectItem>
              <SelectItem value="true">Feitas</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Filtro de Status da Trade */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">Status da Trade</label>
          <Select
            value={statusFilter}
            onValueChange={(value: 'all' | 'executed' | 'reverted') => setStatusFilter(value)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="executed">Executadas</SelectItem>
              <SelectItem value="reverted">Revertidas</SelectItem>
              <SelectItem value="all">Todas</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="flex items-center justify-center py-8">
          <div className="text-gray-500">Carregando trades...</div>
        </div>
      )}

      {/* Lista de Trades */}
      {!isLoading && filteredTrades.length === 0 && (
        <div className="pb-32">
          <Card>
            <CardContent className="p-8 text-center">
              <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">Nenhuma trade encontrada com os filtros selecionados.</p>
            </CardContent>
          </Card>
        </div>
      )}

      {!isLoading && filteredTrades.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pb-32">
          {filteredTrades.map(trade => (
            <TradeCard key={trade.id} trade={trade} />
          ))}
        </div>
      )}
    </div>
  );
};

export default TradesAdminPage; 