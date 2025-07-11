import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Shield } from 'lucide-react';

interface Player {
  id: number;
  name: string;
  position: string;
  ovr: number;
  age: number;
}

interface RotationSettingsProps {
  rotationStyle: 'automatic' | 'manual';
  gameStyle: string;
  offenseStyle: string;
  defenseStyle: string;
  franchisePlayerId: number | null;
  players: Player[];
  totalPlayersRotation: number;
  agePreference: number | null;
  gleague1PlayerId?: number | null;
  gleague2PlayerId?: number | null;
  onRotationStyleChange: (value: 'automatic' | 'manual') => void;
  onGameStyleChange: (value: string) => void;
  onOffenseStyleChange: (value: string) => void;
  onDefenseStyleChange: (value: string) => void;
  onFranchisePlayerChange: (playerId: number | null) => void;
  onTotalPlayersRotationChange: (value: number) => void;
  onAgePreferenceChange: (value: number | null) => void;
  onGLeague1PlayerChange?: (playerId: number | null) => void;
  onGLeague2PlayerChange?: (playerId: number | null) => void;
  isPlayoffs?: boolean;
}

export function RotationSettings({
  rotationStyle,
  gameStyle,
  offenseStyle,
  defenseStyle,
  franchisePlayerId,
  players,
  totalPlayersRotation,
  agePreference,
  gleague1PlayerId,
  gleague2PlayerId,
  onRotationStyleChange,
  onGameStyleChange,
  onOffenseStyleChange,
  onDefenseStyleChange,
  onFranchisePlayerChange,
  onTotalPlayersRotationChange,
  onAgePreferenceChange,
  onGLeague1PlayerChange,
  onGLeague2PlayerChange,
  isPlayoffs = false
}: RotationSettingsProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base md:text-lg">
          <Shield className="h-4 w-4" />
          Configurações Rotação {isPlayoffs && '(Playoffs)'}
        </CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
        <div>
          <Label htmlFor="rotationStyle">Estilo de Rotação</Label>
          <Select value={rotationStyle} onValueChange={onRotationStyleChange}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="automatic">Automático</SelectItem>
              <SelectItem value="manual">Manual</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="gameStyle">Estilo de Jogo</Label>
          <Select value={gameStyle} onValueChange={onGameStyleChange}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione o estilo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="balanced">Balanced</SelectItem>
              <SelectItem value="triangle">Triangle</SelectItem>
              <SelectItem value="grit_and_grind">Grit & Grind</SelectItem>
              <SelectItem value="pace_and_space">Pace & Space</SelectItem>
              <SelectItem value="perimeter_centric">Perimeter Centric</SelectItem>
              <SelectItem value="post_centric">Post Centric</SelectItem>
              <SelectItem value="seven_seconds">Seven Seconds</SelectItem>
              <SelectItem value="defense">Defense</SelectItem>
              <SelectItem value="best_for_fp">Melhor esquema para Franchise Player</SelectItem>
              <SelectItem value="best_for_stars">Esquema com mais estrelas</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="offenseStyle">Estilo de Ataque</Label>
          <Select value={offenseStyle} onValueChange={onOffenseStyleChange}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione o estilo" />
            </SelectTrigger>
            <SelectContent>
            <SelectItem value="no_preference">No Preference</SelectItem>
              <SelectItem value="pick_and_roll">Pick & Roll Offense</SelectItem>
              <SelectItem value="neutral_offensive_focus">Neutral Offensive Focus</SelectItem>
              <SelectItem value="play_through_star">Play Through Star</SelectItem>
              <SelectItem value="get_basket">Get To The Basket</SelectItem>
              <SelectItem value="get_shooters_open">Get Shooters Open</SelectItem>
              <SelectItem value="feed_the_post">Feed The Post</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="defenseStyle">Estilo de Defesa</Label>
          <Select value={defenseStyle} onValueChange={onDefenseStyleChange}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione o estilo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="no_preference">No Preference</SelectItem>
              <SelectItem value="protect_the_paint">Protect The Paint</SelectItem>
              <SelectItem value="neutral_defensive_focus">Neutral Defensive Focus</SelectItem>
              <SelectItem value="limit_perimeter_shots">Limit Perimeter Shots</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        {/* Franchise Player Selection - aparece apenas quando "best_for_fp" está selecionado */}
        {gameStyle === 'best_for_fp' && (
          <div className="md:col-span-2">
            <Label htmlFor="franchisePlayer">Franchise Player</Label>
            <Select 
              value={franchisePlayerId?.toString() || ''} 
              onValueChange={(value) => onFranchisePlayerChange(value ? parseInt(value) : null)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione o Franchise Player" />
              </SelectTrigger>
              <SelectContent>
                {players.map((player) => (
                  <SelectItem key={player.id} value={player.id.toString()}>
                    {player.name} - {player.position} (OVR: {player.ovr})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Configurações Automáticas - aparecem apenas quando "automatic" está selecionado */}
        {rotationStyle === 'automatic' && (
          <>
            <div>
              <Label htmlFor="totalPlayersRotation">Jogadores na Rotação</Label>
              <Select 
                value={totalPlayersRotation.toString()} 
                onValueChange={(value) => onTotalPlayersRotationChange(parseInt(value))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: players.length - 7 }, (_, i) => i + 8).map((num) => (
                    <SelectItem key={num} value={num.toString()}>
                      {num} jogadores
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="agePreference">% de foco em Jogadores Velhos</Label>
              <Input
                id="agePreference"
                type="number"
                min="0"
                max="100"
                value={agePreference || ''}
                onChange={(e) => {
                  const value = e.target.value;
                  if (value === '') {
                    onAgePreferenceChange(null);
                  } else {
                    const numValue = parseInt(value);
                    if (!isNaN(numValue)) {
                      const clampedValue = Math.min(Math.max(numValue, 0), 100);
                      onAgePreferenceChange(clampedValue);
                    }
                  }
                }}
                placeholder="0 (foco jovens) - 100 (foco velhos)"
                className="w-full"
              />
            </div>

            {!isPlayoffs && players.length >= 14 && onGLeague1PlayerChange && (
              <div>
                <Label htmlFor="gleague1Player">G-League Player 1</Label>
                <Select 
                  value={gleague1PlayerId?.toString() || 'none'} 
                  onValueChange={(value) => onGLeague1PlayerChange(value === 'none' ? null : parseInt(value))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione jogador para G-League" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Nenhum</SelectItem>
                    {players
                      .filter(player => player.age <= 25)
                      .map((player) => (
                        <SelectItem key={player.id} value={player.id.toString()}>
                          {player.name} - {player.position} ({player.age} anos)
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {!isPlayoffs && players.length >= 15 && onGLeague2PlayerChange && (
              <div>
                <Label htmlFor="gleague2Player">G-League Player 2</Label>
                <Select 
                  value={gleague2PlayerId?.toString() || 'none'} 
                  onValueChange={(value) => onGLeague2PlayerChange(value === 'none' ? null : parseInt(value))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione jogador para G-League" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Nenhum</SelectItem>
                    {players
                      .filter(player => player.age <= 25 && player.id !== gleague1PlayerId)
                      .map((player) => (
                        <SelectItem key={player.id} value={player.id.toString()}>
                          {player.name} - {player.position} ({player.age} anos)
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
} 