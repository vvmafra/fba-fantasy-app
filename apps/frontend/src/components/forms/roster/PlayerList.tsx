import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Crown, Users, GripVertical } from 'lucide-react';
import { PlayerCard } from './PlayerCard';
import { PlayerWithMinutes } from './types';

interface PlayerListProps {
  title: string;
  droppableId: string;
  players: PlayerWithMinutes[];
  isStarter: boolean;
  onToggleGLeague?: (playerId: number) => void;
  onUpdateMinutes: (playerId: number, minutes: number) => void;
  gleaguePlayersCount?: number;
  totalPlayersCount: number;
  isPlayoffs?: boolean;
  onPlayerClick?: (playerId: number) => void;
  selectedPlayerId?: number | null;
}

// Componente SortablePlayerCard
const SortablePlayerCard = ({ 
  player, 
  index, 
  isStarter, 
  onToggleGLeague, 
  onUpdateMinutes, 
  gleaguePlayersCount, 
  totalPlayersCount, 
  isPlayoffs, 
  onPlayerClick, 
  selectedPlayerId
}: {
  player: PlayerWithMinutes;
  index: number;
  isStarter: boolean;
  onToggleGLeague?: (playerId: number) => void;
  onUpdateMinutes: (playerId: number, minutes: number) => void;
  gleaguePlayersCount?: number;
  totalPlayersCount: number;
  isPlayoffs?: boolean;
  onPlayerClick?: (playerId: number) => void;
  selectedPlayerId?: number | null;
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: player.id.toString() });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    border: selectedPlayerId === player.id ? '2px solid #2563eb' : undefined,
  };

  // Posições fixas para titulares
  const STARTER_POSITIONS = ['PG', 'SG', 'SF', 'PF', 'C'];

  return (
    <Card 
      ref={setNodeRef}
      style={style}
      className={`mb-3 transition-all relative ${
        isDragging ? 'shadow-lg scale-105 z-50' : ''
      } ${selectedPlayerId === player.id ? 'ring-2 ring-blue-600' : ''}`}
      onClick={() => onPlayerClick && onPlayerClick(player.id)}
    >
      <CardContent className="p-4 pb-6 relative">
        <div className="flex items-center justify-between">
          {/* Handle de drag */}
          {/* <div
            className="mr-2 flex items-center justify-center w-7 h-7 rounded-full bg-gray-200 cursor-grab active:cursor-grabbing"
            {...attributes}
            {...listeners}
            title="Arraste para mover"
          >
            <GripVertical size={16} />
          </div> */}

          {/* O resto do card */}
          <div className="flex items-center w-full min-w-0 overflow-hidden max-w-full">
            {/* Badge de posição */}
            <div className="flex flex-col items-center justify-center col-span-1">
              <div 
                className={`text-white w-[40px] flex items-center justify-center text-xs font-bold px-2 py-1 rounded-md
                  ${
                    isStarter && index < 5 ? (
                      STARTER_POSITIONS[index] === 'PG' ? 'bg-blue-600' :
                      STARTER_POSITIONS[index] === 'SG' ? 'bg-blue-600' :
                      STARTER_POSITIONS[index] === 'SF' ? 'bg-blue-700' :
                      STARTER_POSITIONS[index] === 'PF' ? 'bg-blue-700' :
                      'bg-blue-800' // C
                    ) : 'bg-gray-600'
                  }`}
              >
                {isStarter && index < 5 ? STARTER_POSITIONS[index] : player.position}
              </div>
            </div>
            
            {/* Conteúdo do PlayerCard */}
            <div className="flex-1 ml-2 sm:ml-3 min-w-0 pb-2" style={{ maxWidth: 'calc(100% - 60px)' }}>
              <PlayerCard
                player={player}
                isStarter={isStarter}
                onToggleGLeague={onToggleGLeague}
                onUpdateMinutes={onUpdateMinutes}
                gleaguePlayersCount={gleaguePlayersCount || 0}
                totalPlayersCount={totalPlayersCount}
                isPlayoffs={isPlayoffs}
              />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export function PlayerList({
  title,
  droppableId,
  players,
  isStarter,
  onToggleGLeague,
  onUpdateMinutes,
  gleaguePlayersCount,
  totalPlayersCount,
  isPlayoffs = false,
  onPlayerClick,
  selectedPlayerId
}: PlayerListProps) {
  const Icon = isStarter ? Crown : Users;
  const iconColor = isStarter ? 'text-nba-orange' : '';

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base md:text-lg">
          <Icon className={`h-4 w-4 ${iconColor}`} />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="min-h-[100px] overflow-visible">
          {players.length > 0 ? (
            players.map((player, index) => (
              <SortablePlayerCard
                key={player.id}
                player={player}
                index={index}
                isStarter={isStarter}
                onToggleGLeague={onToggleGLeague}
                onUpdateMinutes={onUpdateMinutes}
                gleaguePlayersCount={gleaguePlayersCount}
                totalPlayersCount={totalPlayersCount}
                isPlayoffs={isPlayoffs}
                onPlayerClick={onPlayerClick}
                selectedPlayerId={selectedPlayerId}
              />
            ))
          ) : (
            <Card>
              <CardContent className="p-8 text-center text-gray-500">
                <p>
                  {isStarter 
                    ? 'Arraste jogadores aqui para formar o quinteto titular.'
                    : 'Nenhum reserva no elenco.'
                  }
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </CardContent>
    </Card>
  );
} 