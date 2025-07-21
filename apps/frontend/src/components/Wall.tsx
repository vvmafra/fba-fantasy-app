import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Calendar, ExternalLink, Clock, Trophy, Users, FileText, Target, Users2, Zap, UserPlus, RefreshCw, Award, Medal, Youtube, Check, AlertTriangle } from 'lucide-react';
import { teamService, Team } from '@/services/teamService';
import { useActiveSeason } from '@/hooks/useSeasons';
import { useDeadlines } from '@/hooks/useDeadlines';
import { deadlineService, Deadline } from '@/services/deadlineService';
import { Link } from 'react-router-dom';
import { RosterSeasonForm } from './forms/rosterSeason';
import { RosterPlayoffsForm } from './forms/rosterPlayoffs';
import { rosterService } from '@/services/rosterService';
import { rosterPlayoffsService } from '@/services/rosterPlayoffsService';

interface ImportantLink {
  id: string;
  title: string;
  url: string;
  description?: string;
  category: 'news' | 'rules' | 'schedule' | 'other';
}

interface WallProps {
  isAdmin: boolean;
  teamId: number;
}

const WallUpdated: React.FC<WallProps> = ({ isAdmin, teamId }) => {
  // Buscar temporada ativa
  const { data: activeSeason, isLoading: seasonLoading } = useActiveSeason();
  
  // Buscar deadlines da temporada ativa
  const { deadlines, loading: deadlinesLoading, refreshDeadlines } = useDeadlines(activeSeason?.data?.id);
  
  // Estado para controlar os modais de roster
  const [isRosterModalOpen, setIsRosterModalOpen] = useState(false);
  const [isPlayoffsModalOpen, setIsPlayoffsModalOpen] = useState(false);
  
  // Usar dados da temporada ativa ou null se não existir
  const currentSeason = activeSeason?.data?.year;
  const seasonsAhead = activeSeason?.data?.season_number?.toString();
  const totalSeasons = activeSeason?.data?.total_seasons?.toString();
  
  const [currentDate, setCurrentDate] = useState(new Date());
  const [importantLinks, setImportantLinks] = useState<ImportantLink[]>([
    {
      id: '1',
      title: 'Regulamento da Temporada',
      url: '#',
      description: 'Regras atualizadas para a temporada atual',
      category: 'rules'
    },
    {
      id: '2',
      title: 'Calendário de Jogos',
      url: '#',
      description: 'Cronograma completo da temporada',
      category: 'schedule'
    },
    {
      id: '3',
      title: 'Notícias da Liga',
      url: '#',
      description: 'Últimas atualizações e notícias',
      category: 'news'
    }
  ]);

  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasRegularRoster, setHasRegularRoster] = useState(false);
  const [hasPlayoffsRoster, setHasPlayoffsRoster] = useState(false);
  const [rostersLoading, setRostersLoading] = useState(true);

  // Buscar times com CAP
  useEffect(() => {
    const fetchTeams = async () => {
      try {
        const teamsData = await teamService.getTeamsWithCAP();
        setTeams(teamsData);
      } catch (error) {
        console.error('Erro ao buscar times:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTeams();
  }, []);

  const checkRosters = async () => {
    if (teamId && activeSeason?.data?.id) {
      setRostersLoading(true);
      try {
        const regularRoster = await rosterService.getRosterByTeamAndSeason(teamId, activeSeason.data.id);
        const playoffsRoster = await rosterPlayoffsService.getRosterByTeamAndSeason(teamId, activeSeason.data.id);
        setHasRegularRoster(!!regularRoster);
        setHasPlayoffsRoster(!!playoffsRoster);
      } catch (error) {
        console.error('Erro ao verificar rosters:', error);
      } finally {
        setRostersLoading(false);
      }
    } else {
      setRostersLoading(false);
    }
  };

  useEffect(() => {
    if (activeSeason?.data?.id && teamId) {
      checkRosters();
    }
  }, [teamId, activeSeason?.data?.id]);

  // Ordena os times pelo CAP
  const sortedTeams = teams.sort((a, b) => (b.cap || 0) - (a.cap || 0));

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'draft':
        return <Users className="h-4 w-4" />;
      case 'trade_deadline':
        return <RefreshCw className="h-4 w-4" />;
      case 'fa_deadline':
        return <UserPlus className="h-4 w-4" />;
      case 'regular_roster':
        return <FileText className="h-4 w-4" />;
      case 'regular_season':
        return <Calendar className="h-4 w-4" />;
      case 'playoffs_roster':
        return <FileText className="h-4 w-4" />;
      case 'playoffs':
        return <Trophy className="h-4 w-4" />;
      case 'bets':
        return <Target className="h-4 w-4" />;
      default:
        return <Calendar className="h-4 w-4" />;
    }
  };

  const getEventBadgeColor = (type: string) => {
    switch (type) {
      case 'draft':
        return '#010d00';
      case 'trade_deadline':
        return '#010d00';
      case 'playoffs':
        return '#010d00';
      case 'bets':
        return '#010d00';
      default:
        return '#010d00';
    }
  };

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentDate(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Função para encontrar o próximo evento
  const getNextEvent = () => {
    if (!deadlines || deadlines.length === 0) return null;
    
    const now = new Date();
    const sortedDeadlines = deadlines
      .map(deadline => ({
        deadline,
        nextDate: getDisplayDate(deadline)
      }))
      .filter(({ nextDate }) => {
        // Filtra apenas eventos futuros
        return nextDate >= now;
      })
      .sort((a, b) => a.nextDate.getTime() - b.nextDate.getTime());

    // Retorna o primeiro evento da lista ordenada (próximo evento)
    return sortedDeadlines[0]?.deadline || null;
  };

  // Função para obter o status do roster
  const getRosterStatus = (deadline: Deadline) => {
    if (deadline.type === 'regular_roster') {
      const currentWeekDeadline = deadlineService.utils.calculateCurrentWeekDeadline(deadline);
      const now = new Date();
      
      if (rostersLoading) return 'normal';
      if (hasRegularRoster) return 'success';
      if (now.getTime() > currentWeekDeadline.getTime()) return 'expired';
      if (currentWeekDeadline.getTime() - now.getTime() <= 8 * 60 * 60 * 1000) return 'warning';
      return 'normal';
    }
    
    if (deadline.type === 'playoffs_roster') {
      const currentWeekDeadline = deadlineService.utils.calculateCurrentWeekDeadline(deadline);
      const now = new Date();
      
      if (rostersLoading) return 'normal';
      if (hasPlayoffsRoster) return 'success';
      if (now.getTime() > currentWeekDeadline.getTime()) return 'expired';
      if (currentWeekDeadline.getTime() - now.getTime() <= 8 * 60 * 60 * 1000) return 'warning';
      return 'normal';
    }
    
    return 'normal';
  };

  // Função para verificar se pode enviar roster
  const canSubmitRoster = (deadline: Deadline) => {
    if (deadline.type !== 'regular_roster' && deadline.type !== 'playoffs_roster') {
      return true;
    }
    
    if (rostersLoading) return true;
    
    // Se já tem roster enviado, pode clicar para visualizar/editar
    if ((deadline.type === 'regular_roster' && hasRegularRoster) || 
        (deadline.type === 'playoffs_roster' && hasPlayoffsRoster)) {
      return true;
    }
    
    const currentWeekDeadline = deadlineService.utils.calculateCurrentWeekDeadline(deadline);
    const now = new Date();
    
    return now.getTime() <= currentWeekDeadline.getTime();
  };

  // Função auxiliar para calcular a data de exibição correta
  const getDisplayDate = (deadline: Deadline): Date => {
    if (deadline.type === 'regular_roster' || deadline.type === 'playoffs_roster') {
      return deadlineService.utils.calculateCurrentWeekDeadline(deadline);
    }
    return deadlineService.utils.calculateDeadlineDateTime(deadline);
  };

  function getLocalDateAndTime(date: Date, originalTime: string) {
    const pad = (n: number) => n.toString().padStart(2, '0');
    const year = date.getFullYear();
    const month = pad(date.getMonth() + 1);
    const day = pad(date.getDate());
    // Use o horário original do banco!

    return {
      deadline_date: `${year}-${month}-${day}`,
      deadline_time: originalTime
    };
  }

  const nextEvent = getNextEvent();

  return (
    <div className="container mx-auto p-6 space-y-6 pb-24">
      {/* Header com Temporada e Data */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5" />
              Temporada Atual
            </CardTitle>
          </CardHeader>
          <CardContent>
            {seasonLoading ? (
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-400 mb-2">Carregando...</div>
                <p className="text-sm text-muted-foreground">Buscando temporada ativa</p>
              </div>
            ) : currentSeason ? (
              <>
                <div className="text-3xl font-bold text-primary mb-2">
                  {currentSeason}
                </div>
                <p className="text-sm text-muted-foreground">
                  {seasonsAhead} / {totalSeasons} temporadas
                </p>
              </>
            ) : (
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-400 mb-2">Sem temporada</div>
                <p className="text-sm text-muted-foreground">Nenhuma temporada ativa</p>
              </div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Próximo Evento
            </CardTitle>
          </CardHeader>
          <CardContent>
            {deadlinesLoading ? (
              <div className="text-center">
                <div className="text-lg font-semibold mb-1">Carregando...</div>
              </div>
            ) : nextEvent ? (
              <div>
                <div className="text-lg font-semibold mb-1">
                  {nextEvent.title}
                </div>
                <div className="text-sm text-muted-foreground">
                  {deadlineService.utils.formatDeadlineDate({
                    ...nextEvent,
                    deadline_date: getLocalDateAndTime(getDisplayDate(nextEvent), nextEvent.deadline_time).deadline_date,
                    deadline_time: getLocalDateAndTime(getDisplayDate(nextEvent), nextEvent.deadline_time).deadline_time
                  })}
                </div>
              </div>
            ) : (
              <div className="text-center">
                <div className="text-lg font-semibold mb-1">Sem eventos</div>
                <p className="text-sm text-muted-foreground">Nenhum evento programado</p>
              </div>
            )}
          </CardContent>
        </Card>
        {/* Power Ranking */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Medal className="h-5 w-5" />
              Power Ranking
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-2 max-h-40 overflow-y-auto">
              {sortedTeams.map((team, idx) => (
                <Link
                  to={`/team/${teamId}/view/${team.id}`}
                  key={team.id}
                  className={`flex items-center gap-3 p-2 rounded-md cursor-pointer ${idx < 3 ? 'font-bold border-2 border-yellow-400' : 'hover:bg-muted/50'} transition`}
                >
                  <span className={`text-lg w-6 text-center ${idx === 0 ? 'text-yellow-500' : idx === 1 ? 'text-gray-500' : idx === 2 ? 'text-orange-700' : 'text-muted-foreground'}`}>{idx + 1}</span>
                  <div className="flex-1 min-w-0">
                    <span className="block truncate">{team.name}</span>
                    <span className="block text-xs text-muted-foreground truncate">
                      Dono: {team.owner_name || 'Sem dono'}
                    </span>
                  </div>
                  <span className="text-sm font-mono">CAP: {team.cap || 0}</span>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Calendário da FBA */}
      <Card>
        <CardHeader>
          <CardTitle>Calendário da FBA</CardTitle>
        </CardHeader>
        <CardContent>
          {deadlinesLoading ? (
            <div className="text-center py-8">
              <div className="text-lg font-semibold mb-2">Carregando eventos...</div>
              <p className="text-sm text-muted-foreground">Buscando calendário da temporada</p>
            </div>
          ) : deadlines.length > 0 ? (
            <div className="space-y-4">
              {deadlines
                .map(deadline => {
                  const eventDate = getDisplayDate(deadline);
                  return { deadline, eventDate };
                })
                .filter(({ eventDate }) => {
                  const now = new Date();
                  return eventDate >= now;
                })
                .sort((a, b) => a.eventDate.getTime() - b.eventDate.getTime())
                .map(({ deadline }) => {
                  const isRosterEvent = deadline.type === 'regular_roster' || deadline.type === 'playoffs_roster';
                  const status = getRosterStatus(deadline);

                  let icon, bgColor;
                  if (isRosterEvent) {
                    if (rostersLoading) {
                      icon = <div className="w-4 h-4 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />;
                      bgColor = 'bg-gray-50 border-gray-200';
                    } else if (status === 'success') {
                      icon = <Check className="text-green-600" />;
                      bgColor = 'bg-green-50 border-green-200';
                    } else if (status === 'warning') {
                      icon = <Clock className="text-yellow-600" />;
                      bgColor = 'bg-yellow-50 border-yellow-200';
                    } else if (status === 'expired') {
                      icon = <AlertTriangle className="text-red-600" />;
                      bgColor = 'bg-red-50 border-red-200';
                    }
                  } else {
                    icon = null;
                    bgColor = '';
                  }

                  const nextDate = getDisplayDate(deadline);
                  const { deadline_date, deadline_time } = getLocalDateAndTime(nextDate, deadline.deadline_time);

                  return (
                    <div
                      key={deadline.id}
                      className={`flex items-center justify-between p-4 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors
                        ${isRosterEvent ? bgColor : ''}
                      `}
                      onClick={() => {
                        if (isRosterEvent && !canSubmitRoster(deadline)) {
                          return;
                        }
                        
                        const youtubeEvents = ['regular_season', 'playoffs'];
                        
                        if (youtubeEvents.includes(deadline.type)) {
                          const youtubeLinks = {
                            'regular_season': 'https://www.youtube.com/@fba2kleaguebrasil/live',
                            'playoffs': 'https://www.youtube.com/@fba2kleaguebrasil/live'
                          };
                          
                          const link = youtubeLinks[deadline.type as keyof typeof youtubeLinks];
                          if (link) {
                            window.open(link, '_blank');
                          }
                        } else if (deadline.type === 'bets') {
                          window.open('https://forms.gle/d558ChkM9Dp7fxvK9', '_blank');
                        } else if (deadline.type === 'regular_roster') {
                          setIsRosterModalOpen(true);
                        } else if (deadline.type === 'playoffs_roster') {
                          setIsPlayoffsModalOpen(true);
                        }
                      }}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className="p-2 rounded-full text-white"
                          style={{ backgroundColor: getEventBadgeColor(deadline.type) }}
                        >
                          {getEventIcon(deadline.type)}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold flex items-center gap-1">
                              {deadline.title}
                              {isRosterEvent && icon}
                            </h3>
                            {['regular_season', 'playoffs'].includes(deadline.type) && (
                              <Youtube className="h-4 w-4 text-red-600" />
                            )}
                          </div>
                          {deadline.description && (
                            <p className="text-sm text-muted-foreground">
                              {deadline.description}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold">
                          {deadlineService.utils.formatDeadlineDate({
                            ...deadline,
                            deadline_date,
                            deadline_time
                          })}
                        </div>
                        <Badge variant="secondary" className="mt-1">
                          {deadline.type.replace('_', ' ')}
                        </Badge>
                      </div>
                    </div>
                  );
                })}
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="text-lg font-semibold mb-2">Sem eventos</div>
              <p className="text-sm text-muted-foreground">Nenhum evento programado para esta temporada</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal para gerenciar roster da temporada */}
      <RosterSeasonForm
        isOpen={isRosterModalOpen}
        onClose={() => setIsRosterModalOpen(false)}
        teamId={teamId}
        seasonId={activeSeason?.data?.id || 1}
        isAdmin={isAdmin}
        deadline={deadlines.find(d => d.type === 'regular_roster') ? 
          deadlineService.utils.calculateCurrentWeekDeadline(deadlines.find(d => d.type === 'regular_roster')!) : 
          undefined}
        hasExistingRoster={hasRegularRoster}
        onSuccess={async () => {
          await checkRosters();
          setIsRosterModalOpen(false);
        }}
      />

      {/* Modal para gerenciar roster playoffs */}
      <RosterPlayoffsForm
        isOpen={isPlayoffsModalOpen}
        onClose={() => setIsPlayoffsModalOpen(false)}
        teamId={teamId}
        seasonId={activeSeason?.data?.id || 1}
        isAdmin={isAdmin}
        deadline={deadlines.find(d => d.type === 'playoffs_roster') ? 
          deadlineService.utils.calculateCurrentWeekDeadline(deadlines.find(d => d.type === 'playoffs_roster')!) : 
          undefined}
        hasExistingRoster={hasPlayoffsRoster}
        onSuccess={async () => {
          await checkRosters();
          setIsPlayoffsModalOpen(false);
        }}
      />
    </div>
  );
};

export default WallUpdated; 