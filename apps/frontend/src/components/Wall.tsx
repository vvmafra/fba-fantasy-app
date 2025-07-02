import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Calendar, ExternalLink, Clock, Trophy, Users, FileText, Target, Users2, Zap, UserPlus, RefreshCw, Award, Medal } from 'lucide-react';
import { teamService, Team } from '@/services/teamService';
import { Link } from 'react-router-dom';

interface ImportantLink {
  id: string;
  title: string;
  url: string;
  description?: string;
  category: 'news' | 'rules' | 'schedule' | 'other';
}

interface FBAEvent {
  id: string;
  title: string;
  date: string; // Formato: "Domingo 14h" ou "Segunda-feira 20h"
  description?: string;
  type: 'draft' | 'trade_deadline' | 'playoffs' | 'regular_season' | 'playoffs_roster' | 'regular_roster' | 'fa_deadline' | 'other';
}

interface WallProps {
  isAdmin: boolean;
  teamId: number;
}

const Wall: React.FC<WallProps> = ({ isAdmin, teamId }) => {
  const currentSeason = '2025/26';
  const seasonsAhead = '1';
  
  // Função para extrair apenas o ano final da temporada
  const getSeasonYear = (season: string) => {
    // Remove os últimos 3 dígitos e soma 1 aos 4 primeiros
    const year = parseInt(season.substring(0, 4)) + 1;
    return year.toString();
  };
  
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

  const getDayOfWeek = (date: Date) => {
    const days = [
      'Domingo', 'Segunda-feira', 'Terça-feira', 
      'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'
    ];
    return days[date.getDay()];
  };

  // Função auxiliar para pegar o Date do evento (próxima ocorrência)
  const getEventDate = (event: FBAEvent) => {
    const match = event.date.match(/([A-Za-zçãé-]+)\s(\d{1,2})h(\d{2})?/i);
    if (!match) return null;
    const [_, diaSemana, hora, minutos] = match;
    const weekDays = [
      'Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'
    ];
    const now = new Date();
    const dayIndex = weekDays.findIndex(d => d.toLowerCase().startsWith(diaSemana.toLowerCase().slice(0,3)));
    if (dayIndex === -1) return null;
    const eventDate = new Date(now);
    eventDate.setHours(parseInt(hora), minutos ? parseInt(minutos) : 0, 0, 0);

    // Calcula o próximo dia da semana para o evento
    const daysUntilEvent = (dayIndex - now.getDay() + 7) % 7;
    eventDate.setDate(now.getDate() + daysUntilEvent);

    // Se o evento é hoje mas já passou o horário, joga para a próxima semana
    if (daysUntilEvent === 0 && eventDate <= now) {
      eventDate.setDate(eventDate.getDate() + 7);
    }

    return eventDate;
  };

  // Função para encontrar o próximo evento baseado no dia e hora atual
  const getNextEvent = () => {
    const now = new Date();
    // Ordena eventos pela data/hora da semana
    const sortedEvents = fbaEvents
      .map(event => ({ event, eventDate: getEventDate(event) }))
      .filter(e => e.eventDate)
      .sort((a, b) => (a.eventDate!.getTime() - b.eventDate!.getTime()));

    // Procura o próximo evento futuro
    for (const { event, eventDate } of sortedEvents) {
      if (eventDate > now) {
        return event;
      }
    }
    // Se todos já passaram, retorna o primeiro evento da próxima semana
    return sortedEvents[0]?.event || fbaEvents[0];
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const [fbaEvents, setFbaEvents] = useState<FBAEvent[]>([
    {
      id: '1',
      title: 'Início do Relógio do Draft',
      date: 'Domingo 14h',
      description: `Draft classe de ${getSeasonYear(currentSeason)}`,
      type: 'draft'
    },
    {
      id: '2',
      title: 'Deadline de Trades',
      date: 'Terça-feira 23h59',
      description: 'Último dia para realizar trades',
      type: 'trade_deadline'
    },
    {
      id: '3',
      title: 'Deadline da FA',
      date: 'Quarta-feira 20h',
      description: 'Último dia para realizar requisições de FA',
      type: 'fa_deadline'
    },
    {
      id: '4',
      title: 'Deadline envio roster regular',
      date: 'Quinta-feira 23h59',
      description: 'Envio do roster da temporada regular',
      type: 'regular_roster'
    },
    {
      id: '5',
      title: 'Temporada Regular',
      date: 'Sexta-feira 19h',
      description: 'Transmissão da temporada regular',
      type: 'regular_season'
    },
    {
      id: '6',
      title: 'Deadline envio roster playoffs',
      date: 'Sábado 12h',
      description: 'Envio do roster dos playoffs',
      type: 'playoffs_roster'
    },
    {
      id: '7',
      title: 'Playoffs',
      date: 'Sábado 15h',
      description: 'Transmissão dos playoffs',
      type: 'playoffs'
    }
  ]);

  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);

  // Buscar times com CAP
  useEffect(() => {
    const fetchTeams = async () => {
      try {
        const teamsData = await teamService.getTeamsWithCAP();
        setTeams(teamsData);
      } catch (error) {
        console.error('Erro ao buscar times:', error);
        // Fallback para dados mockados em caso de erro
        setTeams([
          { id: 1, name: 'Lakers', cap: 780, abbreviation: 'LAL', owner_id: null },
          { id: 2, name: 'Bulls', cap: 765, abbreviation: 'CHI', owner_id: null },
          { id: 3, name: 'Celtics', cap: 760, abbreviation: 'BOS', owner_id: null },
          { id: 4, name: 'Heat', cap: 750, abbreviation: 'MIA', owner_id: null },
          { id: 5, name: 'Warriors', cap: 740, abbreviation: 'GSW', owner_id: null },
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchTeams();
  }, []);

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
            <div className="text-3xl font-bold text-primary mb-2">
              {currentSeason}
            </div>
            <p className="text-sm text-muted-foreground">
              {seasonsAhead} / 15 temporadas
            </p>
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
            {fbaEvents.length > 0 && (
              <div>
                <div className="text-lg font-semibold mb-1">
                  {getNextEvent().title}
                </div>
                <div className="text-sm text-muted-foreground">
                  {getNextEvent().date}
                </div>
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
                  <span className="flex-1 truncate">{team.name}</span>
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
          <div className="space-y-4">
            {fbaEvents
              .map(event => ({
                event,
                eventDate: getEventDate(event)
              }))
              .filter(e => e.eventDate)
              .sort((a, b) => a.eventDate!.getTime() - b.eventDate!.getTime())
              .map(({ event }) => (
                <div
                  key={event.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="p-2 rounded-full text-white"
                      style={{ backgroundColor: getEventBadgeColor(event.type) }}
                    >
                      {getEventIcon(event.type)}
                    </div>
                    <div>
                      <h3 className="font-semibold">{event.title}</h3>
                      {event.description && (
                        <p className="text-sm text-muted-foreground">
                          {event.description}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold">
                      {event.date}
                    </div>
                    <Badge variant="secondary">
                      {event.type.replace('_', ' ')}
                    </Badge>
                  </div>
                </div>
              ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Wall;
