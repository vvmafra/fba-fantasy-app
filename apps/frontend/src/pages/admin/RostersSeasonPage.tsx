import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { rosterService } from '@/services/rosterService';
import { seasonService, Season } from '@/services/seasonService';
import { useToast } from '@/hooks/use-toast';
import { FileText, Users, Clock, Settings, Trophy } from 'lucide-react';

interface RosterWithDetails {
  id: number;
  team_name: string;
  team_abbreviation: string;
  rotation_style: 'automatic' | 'manual';
  minutes_starting?: [number, number][];
  minutes_bench?: [number, number][];
  gleague1_player_id?: number | null;
  gleague2_player_id?: number | null;
  total_players_rotation?: number;
  age_preference?: number | null;
  game_style?: string;
  franchise_player_id?: number | null;
  offense_style?: string;
  defense_style?: string;
  offensive_tempo?: string;
  offensive_rebounding?: string;
  defensive_aggression?: string;
  defensive_rebounding?: string;
  created_at: string;
  starting_players: Array<{
    id: number;
    name: string;
    position: string;
    minutes: number;
  }>;
  bench_players: Array<{
    id: number;
    name: string;
    position: string;
    minutes: number;
  }>;
  gleague_players: Array<{
    id: number;
    name: string;
    position: string;
  }>;
  franchise_player?: {
    id: number;
    name: string;
    position: string;
  } | null;
}

export default function RostersSeasonPage() {
  const [rosters, setRosters] = useState<RosterWithDetails[]>([]);
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [selectedSeason, setSelectedSeason] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<'team_name' | 'created_at'>('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [checkedRosters, setCheckedRosters] = useState<Set<number>>(new Set());
  const { toast } = useToast();

  // Carregar temporadas
  useEffect(() => {
    const loadSeasons = async () => {
      try {
        const response = await seasonService.getAllSeasons();
        if (response.success && response.data) {
          setSeasons(response.data);
          // Selecionar temporada ativa por padrão
          const activeSeason = response.data.find(s => s.is_active);
          if (activeSeason) {
            setSelectedSeason(activeSeason.id);
          }
        }
      } catch (error) {
        toast({
          title: "Erro",
          description: "Erro ao carregar temporadas",
          variant: "destructive"
        });
      }
    };

    loadSeasons();
  }, [toast]);

  // Carregar rosters
  useEffect(() => {
    const loadRosters = async () => {
      if (!selectedSeason) return;

      setLoading(true);
      try {
        const response = await rosterService.getAllRostersWithDetails({
          season_id: selectedSeason,
          sortBy,
          sortOrder
        });

        if (response.success && response.data) {
          setRosters(response.data);
        }
      } catch (error) {
        toast({
          title: "Erro",
          description: "Erro ao carregar rosters",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };

    loadRosters();
  }, [selectedSeason, sortBy, sortOrder, toast]);

  // Separar rosters por tipo
  const automaticRosters = rosters.filter(r => r.rotation_style === 'automatic');
  const manualRosters = rosters.filter(r => r.rotation_style === 'manual');

  // Função para formatar data
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Função para obter nome do estilo de jogo
  const getGameStyleName = (style: string) => {
    const styles: Record<string, string> = {
      'balanced': 'Balanced',
      'triangle': 'Triangle',
      'grit_and_grind': 'Grit & Grind',
      'pace_and_space': 'Pace & Space',
      'perimeter_centric': 'Perimeter Centric',
      'post_centric': 'Post Centric',
      'seven_seconds': 'Seven Seconds',
      'defense': 'Defense',
      'best_for_fp': 'Best for FP',
      'best_for_stars': 'Best for Stars'
    };
    return styles[style] || style;
  };

  // Função para obter nome do estilo de ataque
  const getOffenseStyleName = (style: string) => {
    const styles: Record<string, string> = {
      'no_preference': 'No Preference',
      'pick_and_roll': 'Pick & Roll',
      'neutral_offensive_focus': 'Neutral Offensive',
      'play_through_star': 'Play Through Star',
      'get_basket': 'Get to Basket',
      'get_shooters_open': 'Get Shooters Open',
      'feed_the_post': 'Feed the Post'
    };
    return styles[style] || style;
  };

  // Função para obter nome do estilo de defesa
  const getDefenseStyleName = (style: string) => {
    const styles: Record<string, string> = {
      'no_preference': 'No Preference',
      'protect_the_paint': 'Protect Paint',
      'neutral_defensive_focus': 'Neutral Defensive',
      'limit_perimeter_shots': 'Limit Perimeter'
    };
    return styles[style] || style;
  };

  // Função para alternar check
  const toggleCheck = (rosterId: number) => {
    const newChecked = new Set(checkedRosters);
    if (newChecked.has(rosterId)) {
      newChecked.delete(rosterId);
    } else {
      newChecked.add(rosterId);
    }
    setCheckedRosters(newChecked);
  };

  // Função para marcar todos como feitos
  const markAllAsDone = (rosterIds: number[]) => {
    const newChecked = new Set(checkedRosters);
    rosterIds.forEach(id => newChecked.add(id));
    setCheckedRosters(newChecked);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Carregando rosters...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-2 mb-6">
        <FileText className="h-6 w-6" />
        <h1 className="text-2xl font-bold">Rosters da Temporada</h1>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Temporada</label>
              <Select value={selectedSeason?.toString() || ''} onValueChange={(value) => setSelectedSeason(Number(value))}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a temporada" />
                </SelectTrigger>
                                 <SelectContent>
                   {seasons.map((season) => (
                     <SelectItem key={season.id} value={season.id.toString()}>
                       Temporada {season.season_number} ({season.year}) {season.is_active && '(Ativa)'}
                     </SelectItem>
                   ))}
                 </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Ordenar por</label>
              <Select value={sortBy} onValueChange={(value: 'team_name' | 'created_at') => setSortBy(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="team_name">Nome do Time</SelectItem>
                  <SelectItem value="created_at">Data de Envio</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Ordem</label>
              <Select value={sortOrder} onValueChange={(value: 'asc' | 'desc') => setSortOrder(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="asc">Crescente</SelectItem>
                  <SelectItem value="desc">Decrescente</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabela de Rotações Manuais */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Rotações Manuais ({manualRosters.length})
            {manualRosters.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => markAllAsDone(manualRosters.map(r => r.id))}
                className="ml-auto"
              >
                Marcar todos como feitos
              </Button>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {manualRosters.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Nenhum roster manual encontrado
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <Checkbox 
                        checked={manualRosters.length > 0 && manualRosters.every(r => checkedRosters.has(r.id))}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            markAllAsDone(manualRosters.map(r => r.id));
                          } else {
                            setCheckedRosters(new Set());
                          }
                        }}
                      />
                    </TableHead>
                    <TableHead>Time</TableHead>
                    <TableHead>Minutagem Titular</TableHead>
                    <TableHead>Minutagem Reservas</TableHead>
                    <TableHead>G-League</TableHead>
                    <TableHead>Configurações</TableHead>
                    <TableHead>Estratégias</TableHead>
                    <TableHead>Enviado em</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {manualRosters.map((roster) => (
                    <TableRow key={roster.id} className={checkedRosters.has(roster.id) ? 'opacity-50 line-through' : ''}>
                      <TableCell>
                        <Checkbox 
                          checked={checkedRosters.has(roster.id)}
                          onCheckedChange={() => toggleCheck(roster.id)}
                        />
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">{roster.team_name}</div>
                        <div className="text-sm text-muted-foreground">{roster.team_abbreviation}</div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          {roster.starting_players.map((player, index) => {
                            const positions = ['PG', 'SG', 'SF', 'PF', 'C'];
                            return (
                              <div key={player.id} className="text-sm">
                                {positions[index]}: {player.name} - {player.minutes}min
                              </div>
                            );
                          })}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          {roster.bench_players.map((player) => (
                            <div key={player.id} className="text-sm">
                              {player.name} - {player.minutes}min
                            </div>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          {roster.gleague_players.map((player) => (
                            <div key={player.id} className="text-sm">
                              {player.name}
                            </div>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1 text-sm">
                          <div><strong>Jogo:</strong> {getGameStyleName(roster.game_style || '')}</div>
                          <div><strong>Ataque:</strong> {getOffenseStyleName(roster.offense_style || '')}</div>
                          <div><strong>Defesa:</strong> {getDefenseStyleName(roster.defense_style || '')}</div>
                          {roster.game_style === 'best_for_fp' && roster.franchise_player && (
                            <div className="text-xs text-muted-foreground">
                              FP: {roster.franchise_player.name}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1 text-sm">
                          <div><strong>Tempo:</strong> {roster.offensive_tempo || 'N/A'}</div>
                          <div><strong>Rebote Of.:</strong> {roster.offensive_rebounding || 'N/A'}</div>
                          <div><strong>Agressão Def.:</strong> {roster.defensive_aggression || 'N/A'}</div>
                          <div><strong>Rebote Def.:</strong> {roster.defensive_rebounding || 'N/A'}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm text-muted-foreground">
                          {formatDate(roster.created_at)}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tabela de Rotações Automáticas */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Rotações Automáticas ({automaticRosters.length})
            {automaticRosters.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => markAllAsDone(automaticRosters.map(r => r.id))}
                className="ml-auto"
              >
                Marcar todos como feitos
              </Button>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {automaticRosters.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Nenhum roster automático encontrado
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <Checkbox 
                        checked={automaticRosters.length > 0 && automaticRosters.every(r => checkedRosters.has(r.id))}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            markAllAsDone(automaticRosters.map(r => r.id));
                          } else {
                            setCheckedRosters(new Set());
                          }
                        }}
                      />
                    </TableHead>
                    <TableHead>Time</TableHead>
                    <TableHead>Jogadores na Rotação</TableHead>
                    <TableHead>Preferência de Idade</TableHead>
                    <TableHead>G-League</TableHead>
                    <TableHead>Configurações</TableHead>
                    <TableHead>Estratégias</TableHead>
                    <TableHead>Enviado em</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {automaticRosters.map((roster) => (
                    <TableRow key={roster.id} className={checkedRosters.has(roster.id) ? 'opacity-50 line-through' : ''}>
                      <TableCell>
                        <Checkbox 
                          checked={checkedRosters.has(roster.id)}
                          onCheckedChange={() => toggleCheck(roster.id)}
                        />
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">{roster.team_name}</div>
                        <div className="text-sm text-muted-foreground">{roster.team_abbreviation}</div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {roster.total_players_rotation || 8} jogadores
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {roster.age_preference !== null ? (
                            <Badge variant={roster.age_preference > 50 ? 'destructive' : 'secondary'}>
                              {roster.age_preference}% (foco em {roster.age_preference > 50 ? 'velhos' : 'jovens'})
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground">Sem preferência</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          {roster.gleague_players.map((player) => (
                            <div key={player.id} className="text-sm">
                              {player.name}
                            </div>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1 text-sm">
                          <div><strong>Jogo:</strong> {getGameStyleName(roster.game_style || '')}</div>
                          <div><strong>Ataque:</strong> {getOffenseStyleName(roster.offense_style || '')}</div>
                          <div><strong>Defesa:</strong> {getDefenseStyleName(roster.defense_style || '')}</div>
                          {roster.game_style === 'best_for_fp' && roster.franchise_player && (
                            <div className="text-xs text-muted-foreground">
                              FP: {roster.franchise_player.name}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1 text-sm">
                          <div><strong>Tempo:</strong> {roster.offensive_tempo || 'N/A'}</div>
                          <div><strong>Rebote Of.:</strong> {roster.offensive_rebounding || 'N/A'}</div>
                          <div><strong>Agressão Def.:</strong> {roster.defensive_aggression || 'N/A'}</div>
                          <div><strong>Rebote Def.:</strong> {roster.defensive_rebounding || 'N/A'}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm text-muted-foreground">
                          {formatDate(roster.created_at)}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 