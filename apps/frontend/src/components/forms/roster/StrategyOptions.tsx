import React from 'react';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface StrategyOptionsProps {
  offensiveTempo: string;
  setOffensiveTempo: (value: string) => void;
  offensiveRebounding: string;
  setOffensiveRebounding: (value: string) => void;
  defensiveAggression: string;
  setDefensiveAggression: (value: string) => void;
  defensiveRebounding: string;
  setDefensiveRebounding: (value: string) => void;
}

const offensiveTempoOptions = [
  { value: 'No preference', label: 'No preference' },
  { value: 'Patient Offense', label: 'Patient Offense' },
  { value: 'Average Tempo', label: 'Average Tempo' },
  { value: 'Shoot at Will', label: 'Shoot at Will' }
];

const offensiveReboundingOptions = [
  { value: 'Limit Transition', label: 'Limit Transition' },
  { value: 'No preference', label: 'No preference' },
  { value: 'Crash Offensive Glass', label: 'Crash Offensive Glass' },
  { value: 'Some Crash, Others Get Back', label: 'Some Crash, Others Get Back' }
];

const defensiveAggressionOptions = [
  { value: 'Play Physical Defense', label: 'Play Physical Defense' },
  { value: 'No preference', label: 'No preference' },
  { value: 'Conservative Defense', label: 'Conservative Defense' },
  { value: 'Neutral Defensive Aggression', label: 'Neutral Defensive Aggression' }
];

const defensiveReboundingOptions = [
  { value: 'Run in Transition', label: 'Run in Transition' },
  { value: 'Crash Defensive Glass', label: 'Crash Defensive Glass' },
  { value: 'Some Crash, Others Run', label: 'Some Crash, Others Run' },
  { value: 'No preference', label: 'No preference' }
];

export function StrategyOptions({
  offensiveTempo,
  setOffensiveTempo,
  offensiveRebounding,
  setOffensiveRebounding,
  defensiveAggression,
  setDefensiveAggression,
  defensiveRebounding,
  setDefensiveRebounding
}: StrategyOptionsProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Estratégias de Jogo</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Offensive Tempo */}
          <div className="space-y-2">
            <Label htmlFor="offensive-tempo">Tempo de Ataque</Label>
            <Select value={offensiveTempo} onValueChange={setOffensiveTempo}>
              <SelectTrigger>
                <SelectValue placeholder="Select offensive tempo" />
              </SelectTrigger>
              <SelectContent>
                {offensiveTempoOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Offensive Rebounding */}
          <div className="space-y-2">
            <Label htmlFor="offensive-rebounding">Rebote Ofensivo</Label>
            <Select value={offensiveRebounding} onValueChange={setOffensiveRebounding}>
              <SelectTrigger>
                <SelectValue placeholder="Select offensive rebounding strategy" />
              </SelectTrigger>
              <SelectContent>
                {offensiveReboundingOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Defensive Aggression */}
          <div className="space-y-2">
            <Label htmlFor="defensive-aggression">Agressividade Defensiva</Label>
            <Select value={defensiveAggression} onValueChange={setDefensiveAggression}>
              <SelectTrigger>
                <SelectValue placeholder="Select defensive aggression" />
              </SelectTrigger>
              <SelectContent>
                {defensiveAggressionOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Defensive Rebounding */}
          <div className="space-y-2">
            <Label htmlFor="defensive-rebounding">Rebote Defensivo</Label>
            <Select value={defensiveRebounding} onValueChange={setDefensiveRebounding}>
              <SelectTrigger>
                <SelectValue placeholder="Select defensive rebounding strategy" />
              </SelectTrigger>
              <SelectContent>
                {defensiveReboundingOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

