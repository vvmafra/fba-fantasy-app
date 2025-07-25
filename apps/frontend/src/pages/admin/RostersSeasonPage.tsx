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
  rotation_made?: boolean;
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
          // Inicializar checkedRosters baseado na propriedade rotation_made
          const checkedIds = new Set(
            response.data
              .filter((roster: RosterWithDetails) => roster.rotation_made)
              .map((roster: RosterWithDetails) => roster.id)
          );
          setCheckedRosters(checkedIds);
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

  // Função para obter nome abreviado (primeira letra + sobrenome)
  const getAbbreviatedName = (fullName: string) => {
    const parts = fullName.trim().split(' ');
    if (parts.length >= 3) {
      // Inicial do primeiro nome + dois últimos sobrenomes
      return `${parts[0][0]}. ${parts[parts.length - 2]} ${parts[parts.length - 1]}`;
    }
    if (parts.length === 2) {
      // Inicial do primeiro nome + último sobrenome
      return `${parts[0][0]}. ${parts[1]}`;
    }
    return fullName; // Se não tiver sobrenome, retorna o nome completo
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
  const toggleCheck = async (rosterId: number) => {
    try {
      const isCurrentlyChecked = checkedRosters.has(rosterId);
      const newRotationMade = !isCurrentlyChecked;
      
      // Fazer chamada para a API
      await rosterService.updateRotationMade(rosterId, newRotationMade);
      
      // Atualizar estado local
      const newChecked = new Set(checkedRosters);
      if (isCurrentlyChecked) {
        newChecked.delete(rosterId);
      } else {
        newChecked.add(rosterId);
      }
      setCheckedRosters(newChecked);
      
      // Atualizar o roster na lista
      setRosters(prevRosters => 
        prevRosters.map(roster => 
          roster.id === rosterId 
            ? { ...roster, rotation_made: newRotationMade }
            : roster
        )
      );
      
      toast({
        title: "Sucesso",
        description: `Roster ${newRotationMade ? 'marcado' : 'desmarcado'} como feito`,
        variant: "default"
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao atualizar status do roster",
        variant: "destructive"
      });
    }
  };

  // Função para marcar todos como feitos
  const markAllAsDone = async (rosterIds: number[]) => {
    try {
      // Fazer chamadas para a API para todos os rosters
      await Promise.all(
        rosterIds.map(id => rosterService.updateRotationMade(id, true))
      );
      
      // Atualizar estado local
      const newChecked = new Set(checkedRosters);
      rosterIds.forEach(id => newChecked.add(id));
      setCheckedRosters(newChecked);
      
      // Atualizar os rosters na lista
      setRosters(prevRosters => 
        prevRosters.map(roster => 
          rosterIds.includes(roster.id)
            ? { ...roster, rotation_made: true }
            : roster
        )
      );
      
      toast({
        title: "Sucesso",
        description: `${rosterIds.length} rosters marcados como feitos`,
        variant: "default"
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao marcar rosters como feitos",
        variant: "destructive"
      });
    }
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
        <h1 className="text-lg font-bold text-nba-dark sm:text-2xl md:text-3xl">Rosters da Temporada</h1>
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
          <CardTitle className="flex items-center gap-2 text-lg">
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
            <div className="text-center py-8 text-muted-foreground text-lg">
              Nenhum roster manual encontrado
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table className="min-w-full">
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <Checkbox 
                        checked={manualRosters.length > 0 && manualRosters.every(r => r.rotation_made)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            markAllAsDone(manualRosters.map(r => r.id));
                          } else {
                            // Desmarcar todos os rosters manuais
                            const uncheckedIds = manualRosters.map(r => r.id);
                            Promise.all(
                              uncheckedIds.map(id => rosterService.updateRotationMade(id, false))
                            ).then(() => {
                              setCheckedRosters(new Set());
                              setRosters(prevRosters => 
                                prevRosters.map(roster => 
                                  uncheckedIds.includes(roster.id)
                                    ? { ...roster, rotation_made: false }
                                    : roster
                                )
                              );
                            }).catch(() => {
                              toast({
                                title: "Erro",
                                description: "Erro ao desmarcar rosters",
                                variant: "destructive"
                              });
                            });
                          }
                        }}
                      />
                    </TableHead>
                    <TableHead className="w-24">Time</TableHead>
                    <TableHead className="min-w-[170px] md:min-w-[200px]">Titulares</TableHead>
                    <TableHead className="min-w-[150px] md:min-w-[200px]">Reservas</TableHead>
                    <TableHead className="min-w-[150px] md:min-w-[200px]">G-League</TableHead>
                    <TableHead className="min-w-[100px] md:min-w-[150px]">Config</TableHead>
                    <TableHead className="min-w-[150px] md:min-w-[150px]">Estratégias</TableHead>
                    <TableHead className="w-24">Enviado</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {manualRosters.map((roster) => (
                    <TableRow key={roster.id} className={roster.rotation_made ? 'opacity-50 line-through' : ''}>
                      <TableCell>
                        <Checkbox 
                          checked={roster.rotation_made || false}
                          onCheckedChange={() => toggleCheck(roster.id)}
                        />
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">{roster.team_name}</div>
                        <div className="text-sm text-muted-foreground">{roster.team_abbreviation}</div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-0.5">
                          {roster.starting_players.map((player, index) => {
                            const positions = ['PG', 'SG', 'SF', 'PF', 'C'];
                            return (
                              <div key={player.id} className="text-xs">
                                {positions[index]}: {getAbbreviatedName(player.name)} ({player.minutes}min)
                              </div>
                            );
                          })}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-0.5">
                          {roster.bench_players.map((player) => (
                            <div key={player.id} className="text-xs">
                              {getAbbreviatedName(player.name)} ({player.minutes}min)
                            </div>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-0.5">
                          {roster.gleague_players.map((player) => (
                            <div key={player.id} className="text-xs">
                              {getAbbreviatedName(player.name)}
                            </div>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-0.5 text-xs">
                          <div><strong>STYLE:</strong> {getGameStyleName(roster.game_style || '')}</div>
                          <div><strong>OFF:</strong> {getOffenseStyleName(roster.offense_style || '')}</div>
                          <div><strong>DEF:</strong> {getDefenseStyleName(roster.defense_style || '')}</div>
                          {roster.game_style === 'best_for_fp' && roster.franchise_player && (
                            <div className="text-xs text-muted-foreground">
                              FP: {getAbbreviatedName(roster.franchise_player.name)}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-0.5 text-xs">
                          <div><strong>OFF-TEMP:</strong> {roster.offensive_tempo || 'N/A'}</div>
                          <div><strong>OFF-RBD:</strong> {roster.offensive_rebounding || 'N/A'}</div>
                          <div><strong>DEF-AG:</strong> {roster.defensive_aggression || 'N/A'}</div>
                          <div><strong>DEF-RBD:</strong> {roster.defensive_rebounding || 'N/A'}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-xs text-muted-foreground">
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
          <CardTitle className="flex items-center gap-2 text-lg">
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
            <div className="text-center py-8 text-muted-foreground text-lg">
              Nenhum roster automático encontrado
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table className="min-w-full">
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <Checkbox 
                        checked={automaticRosters.length > 0 && automaticRosters.every(r => r.rotation_made)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            markAllAsDone(automaticRosters.map(r => r.id));
                          } else {
                            // Desmarcar todos os rosters automáticos
                            const uncheckedIds = automaticRosters.map(r => r.id);
                            Promise.all(
                              uncheckedIds.map(id => rosterService.updateRotationMade(id, false))
                            ).then(() => {
                              setCheckedRosters(new Set());
                              setRosters(prevRosters => 
                                prevRosters.map(roster => 
                                  uncheckedIds.includes(roster.id)
                                    ? { ...roster, rotation_made: false }
                                    : roster
                                )
                              );
                            }).catch(() => {
                              toast({
                                title: "Erro",
                                description: "Erro ao desmarcar rosters",
                                variant: "destructive"
                              });
                            });
                          }
                        }}
                      />
                    </TableHead>
                    <TableHead className="w-24">Time</TableHead>
                    <TableHead className="min-w-[120px] md:min-w-[150px]">Rotação</TableHead>
                    <TableHead className="w-20">Idade</TableHead>
                    <TableHead className="w-20">G-League</TableHead>
                    <TableHead className="min-w-[150px] md:min-w-[200px]">Config</TableHead>
                    <TableHead className="min-w-[150px] md:min-w-[200px]">Estratégias</TableHead>
                    <TableHead className="w-24">Enviado</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {automaticRosters.map((roster) => (
                    <TableRow key={roster.id} className={checkedRosters.has(roster.id) ? 'opacity-50 line-through' : ''}>
                      <TableCell>
                        <Checkbox 
                          checked={roster.rotation_made || false}
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
                            <div>
                              {roster.age_preference}%
                            </div>
                          ) : (
                            <span className="text-muted-foreground">Sem preferência</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-0.5">
                          {roster.gleague_players.map((player) => (
                            <div key={player.id} className="text-xs">
                              {getAbbreviatedName(player.name)}
                            </div>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-0.5 text-xs">
                          <div><strong>STYLE:</strong> {getGameStyleName(roster.game_style || '')}</div>
                          <div><strong>OFF:</strong> {getOffenseStyleName(roster.offense_style || '')}</div>
                          <div><strong>DEF:</strong> {getDefenseStyleName(roster.defense_style || '')}</div>
                          {roster.game_style === 'best_for_fp' && roster.franchise_player && (
                            <div className="text-xs text-muted-foreground">
                              FP: {getAbbreviatedName(roster.franchise_player.name)}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-0.5 text-xs">
                          <div><strong>OFF-TEMP:</strong> {roster.offensive_tempo || 'N/A'}</div>
                          <div><strong>OFF-RBD:</strong> {roster.offensive_rebounding || 'N/A'}</div>
                          <div><strong>DEF-AG:</strong> {roster.defensive_aggression || 'N/A'}</div>
                          <div><strong>DEF-RBD:</strong> {roster.defensive_rebounding || 'N/A'}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-xs text-muted-foreground">
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