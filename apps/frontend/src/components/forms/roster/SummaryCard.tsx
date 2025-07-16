import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Clock, AlertTriangle } from 'lucide-react';

interface SummaryCardProps {
  totalMinutes: number;
  activePlayers: number;
  gleaguePlayers?: number;
  totalPlayers: number;
  isPlayoffs?: boolean;
}

export function SummaryCard({
  totalMinutes,
  activePlayers,
  gleaguePlayers,
  totalPlayers,
  isPlayoffs = false
}: SummaryCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base md:text-lg">
          <Clock className="h-4 w-4" />
          Resumo da Rotação {isPlayoffs && '(Playoffs)'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 text-center">
          <div>
            <div className={`text-xl md:text-2xl font-bold ${totalMinutes === 240 ? 'text-primary' : 'text-red-600'}`}>
              {totalMinutes}
            </div>
            <div className="text-xs md:text-sm text-muted-foreground">Minutos Totais</div>
            {totalMinutes !== 240 && (
              <div className="text-xs text-red-600 mt-1 flex items-center justify-center gap-1">
                <AlertTriangle className="h-3 w-3" />
                {totalMinutes < 240 ? `Faltam ${240 - totalMinutes}` : `Sobram ${totalMinutes - 240}`}
              </div>
            )}
          </div>
          <div>
            <div className={`text-xl md:text-2xl font-bold ${activePlayers >= 8 ? 'text-green-600' : 'text-red-600'}`}>
              {activePlayers}
            </div>
            <div className="text-xs md:text-sm text-muted-foreground">Jogadores Ativos</div>
            {activePlayers < 8 && (
              <div className="text-xs text-red-600 mt-1 flex items-center justify-center gap-1">
                <AlertTriangle className="h-3 w-3" />
                Mínimo 8
              </div>
            )}
          </div>
          {!isPlayoffs ? (
            <div>
              <div className="text-xl md:text-2xl font-bold text-orange-600">{gleaguePlayers || 0}</div>
              <div className="text-xs md:text-sm text-muted-foreground">G-League</div>
            </div>
          ) : (
            <div>
              <div className="text-xl md:text-2xl font-bold text-gray-600">-</div>
              <div className="text-xs md:text-sm text-muted-foreground">G-League</div>
            </div>
          )}
          <div>
            <div className="text-xl md:text-2xl font-bold text-blue-600">{totalPlayers}</div>
            <div className="text-xs md:text-sm text-muted-foreground">Total do Elenco</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 