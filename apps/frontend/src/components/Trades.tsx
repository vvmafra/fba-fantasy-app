import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { ArrowRight, MessageSquare, Clock, CheckCircle, XCircle, Plus } from 'lucide-react';

interface Trade {
  id: string;
  proposedBy: string;
  teams: string[];
  status: 'pending' | 'accepted' | 'rejected' | 'completed';
  createdAt: string;
  players: {
    from: string;
    to: string;
    playerName: string;
  }[];
  picks: {
    from: string;
    to: string;
    year: number;
    round: number;
  }[];
  comments: {
    user: string;
    message: string;
    timestamp: string;
  }[];
}

interface TradesProps {
  isAdmin: boolean;
  teamId?: number;
}

const Trades = ({ isAdmin, teamId }: TradesProps) => {
  const [selectedTrade, setSelectedTrade] = useState<string | null>(null);
  const [newComment, setNewComment] = useState('');

  // Mock data - será substituído por dados reais do Supabase
  const mockTrades: Trade[] = [
    {
      id: '1',
      proposedBy: 'Lakers',
      teams: ['Lakers', 'Heat', 'Celtics'],
      status: 'pending',
      createdAt: '2024-01-20',
      players: [
        { from: 'Lakers', to: 'Heat', playerName: 'D\'Angelo Russell' },
        { from: 'Heat', to: 'Lakers', playerName: 'Tyler Herro' },
        { from: 'Celtics', to: 'Lakers', playerName: 'Malcolm Brogdon' }
      ],
      picks: [
        { from: 'Lakers', to: 'Heat', year: 2025, round: 2 }
      ],
      comments: [
        { user: 'Heat GM', message: 'Interessante proposta, mas preciso pensar melhor.', timestamp: '2024-01-20T15:30:00Z' },
        { user: 'Celtics GM', message: 'Estou dentro!', timestamp: '2024-01-20T16:00:00Z' }
      ]
    },
    {
      id: '2',
      proposedBy: 'Celtics',
      teams: ['Lakers', 'Celtics'],
      status: 'completed',
      createdAt: '2024-01-15',
      players: [
        { from: 'Lakers', to: 'Celtics', playerName: 'Russell Westbrook' },
        { from: 'Celtics', to: 'Lakers', playerName: 'Marcus Smart' }
      ],
      picks: [],
      comments: [
        { user: 'Admin', message: 'Trade confirmado e processado!', timestamp: '2024-01-16T10:00:00Z' }
      ]
    }
  ];

  const getStatusBadge = (status: Trade['status']) => {
    const statusConfig = {
      pending: { color: 'bg-yellow-100 text-yellow-800', icon: Clock, label: 'Pendente' },
      accepted: { color: 'bg-blue-100 text-blue-800', icon: CheckCircle, label: 'Aceito' },
      rejected: { color: 'bg-red-100 text-red-800', icon: XCircle, label: 'Rejeitado' },
      completed: { color: 'bg-green-100 text-green-800', icon: CheckCircle, label: 'Concluído' }
    };
    
    const config = statusConfig[status];
    const Icon = config.icon;
    
    return (
      <Badge className={config.color}>
        <Icon size={12} className="mr-1" />
        {config.label}
      </Badge>
    );
  };

  const TradeCard = ({ trade }: { trade: Trade }) => (
    <Card className="mb-4">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="text-lg">Trade #{trade.id}</span>
          {getStatusBadge(trade.status)}
        </CardTitle>
        <p className="text-sm text-gray-600">
          Proposto por {trade.proposedBy} • {new Date(trade.createdAt).toLocaleDateString('pt-BR')}
        </p>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Teams Involved */}
        <div className="flex items-center justify-center space-x-2 text-sm">
          {trade.teams.map((team, index) => (
            <React.Fragment key={team}>
              <span className="font-medium px-2 py-1 bg-nba-blue text-white rounded">
                {team}
              </span>
              {index < trade.teams.length - 1 && <ArrowRight size={16} />}
            </React.Fragment>
          ))}
        </div>

        {/* Players */}
        <div>
          <h4 className="font-medium mb-2">Jogadores:</h4>
          {trade.players.map((player, index) => (
            <div key={index} className="flex items-center text-sm mb-1">
              <span>{player.playerName}</span>
              <ArrowRight size={14} className="mx-2 text-gray-400" />
              <span className="text-nba-blue font-medium">{player.to}</span>
            </div>
          ))}
        </div>

        {/* Picks */}
        {trade.picks.length > 0 && (
          <div>
            <h4 className="font-medium mb-2">Picks:</h4>
            {trade.picks.map((pick, index) => (
              <div key={index} className="flex items-center text-sm mb-1">
                <span>{pick.year} - {pick.round}ª Rodada</span>
                <ArrowRight size={14} className="mx-2 text-gray-400" />
                <span className="text-nba-blue font-medium">{pick.to}</span>
              </div>
            ))}
          </div>
        )}

        {/* Actions */}
        <div className="flex space-x-2 pt-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setSelectedTrade(selectedTrade === trade.id ? null : trade.id)}
            className="flex-1"
          >
            <MessageSquare size={14} className="mr-1" />
            Comentários ({trade.comments.length})
          </Button>
          
          {trade.status === 'pending' && (
            <>
              <Button size="sm" className="bg-green-600 hover:bg-green-700">
                Aceitar
              </Button>
              <Button size="sm" variant="destructive">
                Rejeitar
              </Button>
            </>
          )}
          
          {isAdmin && trade.status === 'accepted' && (
            <Button size="sm" className="bg-nba-orange hover:bg-nba-orange/90">
              Confirmar
            </Button>
          )}
        </div>

        {/* Comments Section */}
        {selectedTrade === trade.id && (
          <div className="border-t pt-4 space-y-3">
            <h4 className="font-medium">Comentários:</h4>
            {trade.comments.map((comment, index) => (
              <div key={index} className="bg-gray-50 p-3 rounded-lg">
                <div className="flex justify-between items-start mb-1">
                  <span className="font-medium text-sm">{comment.user}</span>
                  <span className="text-xs text-gray-500">
                    {new Date(comment.timestamp).toLocaleString('pt-BR')}
                  </span>
                </div>
                <p className="text-sm">{comment.message}</p>
              </div>
            ))}
            
            <div className="space-y-2">
              <Textarea
                placeholder="Adicionar comentário..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                className="min-h-[80px]"
              />
              <Button size="sm" className="w-full">
                Comentar
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="p-4 pb-20 space-y-6">
      {/* Quick Stats */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="text-center">
          <CardContent className="p-3">
            <p className="text-lg font-bold text-yellow-600">2</p>
            <p className="text-xs text-gray-600">Pendentes</p>
          </CardContent>
        </Card>
        <Card className="text-center">
          <CardContent className="p-3">
            <p className="text-lg font-bold text-green-600">5</p>
            <p className="text-xs text-gray-600">Concluídos</p>
          </CardContent>
        </Card>
        <Card className="text-center">
          <CardContent className="p-3">
            <p className="text-lg font-bold text-blue-600">12</p>
            <p className="text-xs text-gray-600">Totais</p>
          </CardContent>
        </Card>
      </div>

      {/* New Trade Button */}
      <Button className="w-full bg-nba-blue hover:bg-nba-blue/90">
        <Plus size={16} className="mr-2" />
        Propor Nova Trade
      </Button>

      {/* Trades List */}
      <div>
        <h2 className="text-xl font-bold mb-4 text-nba-dark">Trades Recentes</h2>
        {mockTrades.map(trade => (
          <TradeCard key={trade.id} trade={trade} />
        ))}
      </div>

      {/* Admin Section */}
      {isAdmin && (
        <Card className="border-2 border-dashed border-nba-orange">
          <CardContent className="p-4 text-center">
            <h3 className="font-semibold mb-2">Painel Admin</h3>
            <div className="grid grid-cols-2 gap-2">
              <Button variant="outline" size="sm">
                Todas as Trades
              </Button>
              <Button variant="outline" size="sm">
                Histórico Completo
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Trades;
