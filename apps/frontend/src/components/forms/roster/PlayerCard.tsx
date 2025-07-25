import React, { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PlayerWithMinutes } from './types';

interface PlayerCardProps {
  player: PlayerWithMinutes;
  isStarter: boolean;
  onToggleGLeague?: (playerId: number) => void;
  onUpdateMinutes: (playerId: number, minutes: number) => void;
  gleaguePlayersCount: number;
  totalPlayersCount: number;
  isPlayoffs?: boolean;
}

export function PlayerCard({
  player,
  isStarter,
  onToggleGLeague,
  onUpdateMinutes,
  gleaguePlayersCount,
  totalPlayersCount,
  isPlayoffs = false
}: PlayerCardProps) {
  const [inputValue, setInputValue] = useState(player.minutes.toString());
  
  // Atualizar input quando player.minutes mudar
  useEffect(() => {
    setInputValue(player.minutes.toString());
  }, [player.minutes]);

  const isGLeagueEligible = player.age <= 25 && totalPlayersCount >= 14;
  const canSendToGLeague = (totalPlayersCount === 15 && gleaguePlayersCount < 2) || 
                          (totalPlayersCount === 14 && gleaguePlayersCount < 1) || 
                          player.isGLeague;

  return (
    <div className="w-full max-w-full overflow-visible">
      {/* Nome, idade e OVR */}
      <div className="flex-1 flex items-center min-w-0">
        <div className="flex-1 min-w-0 overflow-hidden">
          <h3 className="font-semibold text-[15px] sm:text-md w-full flex items-center">
            <span 
              className="truncate flex-1 min-w-0"
              title={player.name}
            >
              {player.name}
            </span>
            <span className="flex-shrink-0 ml-1">
            {player.ovr} | {player.age}y
            </span>
          </h3>
        </div>
      </div>
      
      {/* Controles */}
      <div className="flex items-center gap-2 sm:gap-2 mt-2 relative z-10">
        <Label htmlFor={`minutes-${player.id}`} className="text-xs whitespace-nowrap">
          Minutos:
        </Label>
        <Input
          id={`minutes-${player.id}`}
          type="number"
          min="0"
          max="40"
          value={player.isGLeague ? '0' : inputValue}
          onChange={(e) => {
            const value = e.target.value;
            setInputValue(value);
            
            if (value === '') {
              onUpdateMinutes(player.id, 0);
            } else {
              const numValue = parseInt(value);
              if (!isNaN(numValue)) {
                onUpdateMinutes(player.id, numValue);
              }
            }
          }}
          onBlur={(e) => {
            if (e.target.value === '') {
              setInputValue('0');
              onUpdateMinutes(player.id, 0);
            }
          }}
          onClick={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
          onTouchStart={(e) => e.stopPropagation()}
          disabled={player.isGLeague}
          className="w-16 h-8 text-center relative z-20"
        />
        
        {!isStarter && !isPlayoffs && onToggleGLeague && (
          <Button
            variant="outline"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              onToggleGLeague(player.id);
            }}
            onMouseDown={(e) => e.stopPropagation()}
            onTouchStart={(e) => e.stopPropagation()}
            disabled={!isGLeagueEligible || !canSendToGLeague}
            className="text-xs px-2 py-1"
          >
            {player.isGLeague ? 'Remover G-League' : 'G-League'}
          </Button>
        )}
      </div>
    </div>
  );
} 