import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Search, Play, Users, TrendingUp, Plus, UserCheck, Loader2 } from 'lucide-react';
import { usePlayers } from '@/hooks/usePlayers';
import { Player } from '@/services/playerService';
import { config } from '@/lib/config';

interface FreeAgentsProps {
  isAdmin: boolean;
  teamId?: number;
}

const FreeAgents = ({ isAdmin, teamId }: FreeAgentsProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPosition, setSelectedPosition] = useState('all');

  // Hooks para buscar dados da API
  const { data: freeAgentsResponse, isLoading, error } = useFreeAgents();
  const transferPlayerMutation = useTransferPlayer();

  // Extrair dados da resposta da API
  const freeAgents: Player[] = freeAgentsResponse?.data || [];

  const positions = ['all', 'PG', 'SG', 'SF', 'PF', 'C'];

  const filteredAgents = freeAgents.filter(agent => {
    const matchesSearch = agent.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesPosition = selectedPosition === 'all' || agent.position === selectedPosition;
    return matchesSearch && matchesPosition;
  });

  const handleTransferPlayer = (playerId: number) => {
    transferPlayerMutation.mutate({
      id: playerId,
      data: { new_team_id: config.defaultTeamId }
    });
  };

  const FreeAgentCard = ({ agent }: { agent: Player }) => (
    <Card className="mb-4">
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <h3 className="font-semibold text-lg mb-1">{agent.name}</h3>
            <div className="flex items-center space-x-3 text-sm text-gray-600 mb-2">
              <Badge variant="outline">{agent.position}</Badge>
              <span className="flex items-center">
                <TrendingUp size={14} className="mr-1" />
                {agent.ovr} OVR
              </span>
              <span>{agent.age} anos</span>
            </div>
            <div className="flex items-center space-x-4 text-xs text-gray-400 mt-1">
              <span>INS: {agent.ins}</span>
              <span>MID: {agent.mid}</span>
              <span>3PT: {agent["3pt"]}</span>
              <span>DEF: {agent.ins_d}</span>
            </div>
            <div className="flex items-center space-x-4 text-xs text-gray-400 mt-1">
              <span>PER: {agent.per_d}</span>
              <span>PLMK: {agent.plmk}</span>
              <span>REB: {agent.reb}</span>
              <span>PHYS: {agent.phys}</span>
            </div>
            <div className="flex items-center space-x-4 text-xs text-gray-400 mt-1">
              <span>IQ: {agent.iq}</span>
              <span>POT: {agent.pot}</span>
            </div>
            <p className="text-xs text-gray-400 mt-1">
              Adicionado em {new Date(agent.created_at).toLocaleDateString('pt-BR')}
            </p>
          </div>
        </div>

        <div className="flex space-x-2">
          <Button 
            size="sm" 
            className="flex-1 bg-nba-blue hover:bg-nba-blue/90"
            onClick={() => handleTransferPlayer(agent.id)}
            disabled={transferPlayerMutation.isPending}
          >
            {transferPlayerMutation.isPending ? (
              <Loader2 size={14} className="mr-1 animate-spin" />
            ) : (
              <UserCheck size={14} className="mr-1" />
            )}
            Contratar
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  if (isLoading) {
    return (
      <div className="p-4 pb-20 flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 size={48} className="mx-auto mb-4 animate-spin text-nba-blue" />
          <p className="text-gray-600">Carregando free agents...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 pb-20">
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-8 text-center">
            <p className="text-red-600 font-medium">Erro ao carregar free agents</p>
            <p className="text-red-500 text-sm mt-2">
              {error.message || 'Tente novamente mais tarde'}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-4 pb-20 space-y-6">
      {/* Stats Summary */}
      <Card className="bg-gradient-to-r from-nba-blue to-nba-dark text-white">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Users size={32} />
              <div>
                <h2 className="text-xl font-bold">Free Agents</h2>
                <p className="text-sm opacity-80">{freeAgents.length} jogadores disponíveis</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold">{freeAgents.filter(a => a.ovr >= 80).length}</p>
              <p className="text-xs opacity-80">Elite (80+ OVR)</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Search and Filters */}
      <div className="space-y-3">
        <div className="relative">
          <Search size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <Input
            placeholder="Buscar jogadores..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        <div className="flex space-x-2 overflow-x-auto pb-2">
          {positions.map(pos => (
            <Button
              key={pos}
              variant={selectedPosition === pos ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedPosition(pos)}
              className={`flex-shrink-0 ${selectedPosition === pos ? 'bg-nba-blue' : ''}`}
            >
              {pos === 'all' ? 'Todos' : pos}
            </Button>
          ))}
        </div>
      </div>

      {/* Free Agents List */}
      <div>
        <h2 className="text-xl font-bold mb-4 text-nba-dark">
          Jogadores Disponíveis ({filteredAgents.length})
        </h2>
        {filteredAgents.map(agent => (
          <FreeAgentCard key={agent.id} agent={agent} />
        ))}
        
        {filteredAgents.length === 0 && (
          <Card>
            <CardContent className="p-8 text-center text-gray-500">
              <Users size={48} className="mx-auto mb-4 opacity-50" />
              <p>Nenhum free agent encontrado com os filtros aplicados.</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Admin Actions */}
      {isAdmin && (
        <Card className="border-2 border-dashed border-nba-orange">
          <CardContent className="p-4 space-y-3">
            <h3 className="font-semibold text-center">Ações de Admin</h3>
            <div className="grid grid-cols-1 gap-2">
              <Button className="w-full bg-nba-orange hover:bg-nba-orange/90">
                <Plus size={16} className="mr-2" />
                Adicionar Free Agent
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default FreeAgents;
