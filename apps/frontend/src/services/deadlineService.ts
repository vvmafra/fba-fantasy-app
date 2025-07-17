import { apiRequest } from '@/lib/api';

export interface Deadline {
  id: number;
  season_id: number;
  title: string;
  description?: string;
  deadline_date: string; // Data no formato YYYY-MM-DD
  deadline_time: string; // Horário no formato HH:MM:SS
  type: 'draft' | 'trade_deadline' | 'fa_deadline' | 'regular_roster' | 'playoffs_roster' | 'regular_season' | 'playoffs' | 'other';
  is_active: boolean;
  created_at: string;
  updated_at: string;
  season_year?: string; // Campo adicional retornado pelo backend
}

export interface CreateDeadlineRequest {
  season_id: number;
  title: string;
  description?: string;
  deadline_date: string; // Data no formato YYYY-MM-DD
  deadline_time: string; // Horário no formato HH:MM:SS
  type: 'draft' | 'trade_deadline' | 'fa_deadline' | 'regular_roster' | 'playoffs_roster' | 'regular_season' | 'playoffs' | 'other';
  is_active?: boolean;
}

export interface UpdateDeadlineRequest extends Partial<CreateDeadlineRequest> {}

// Serviço de Deadlines
export const deadlineService = {
  // Buscar todos os deadlines
  getAllDeadlines: () =>
    apiRequest.get<Deadline[]>('/deadlines'),

  // Buscar deadlines por temporada
  getDeadlinesBySeason: (seasonId: number) =>
    apiRequest.get<Deadline[]>(`/deadlines/season/${seasonId}`),

  // Buscar próximos deadlines da temporada ativa
  getUpcomingDeadlines: () =>
    apiRequest.get<Deadline[]>('/deadlines/upcoming'),

  // Buscar deadline por ID
  getDeadlineById: (id: number) =>
    apiRequest.get<Deadline>(`/deadlines/${id}`),

  // Buscar deadline por tipo e temporada
  getDeadlineByTypeAndSeason: (type: string, seasonId: number) =>
    apiRequest.get<Deadline>(`/deadlines/type/${type}/season/${seasonId}`),

  // Criar novo deadline
  createDeadline: (data: CreateDeadlineRequest) =>
    apiRequest.post<Deadline>('/deadlines', data),

  // Atualizar deadline
  updateDeadline: (id: number, data: UpdateDeadlineRequest) =>
    apiRequest.put<Deadline>(`/deadlines/${id}`, data),

  // Deletar deadline
  deleteDeadline: (id: number) =>
    apiRequest.delete<void>(`/deadlines/${id}`),

  // Utilitários para trabalhar com deadlines
  utils: {
    // Calcular data/hora do deadline
    calculateDeadlineDateTime: (deadline: Deadline): Date => {
      // SEMPRE combinar a data com o horário correto
      // Extrair apenas a data (YYYY-MM-DD) do deadline_date
      const dateOnly = deadline.deadline_date.split('T')[0];
      const combinedDateTime = `${dateOnly}T${deadline.deadline_time}`;
      return new Date(combinedDateTime);
    },

    // Formatar data completa do deadline (ex: "22/01 (segunda-feira) 14h00")
    formatDeadlineDate: (deadline: Deadline): string => {
      // Normalizar a data primeiro
      let date: Date;
      if (deadline.deadline_date.includes('T')) {
        date = new Date(deadline.deadline_date);
      } else {
        date = new Date(`${deadline.deadline_date}T${deadline.deadline_time}`);
      }
      const time = deadline.deadline_time.substring(0, 5); // Remove segundos
      const dayName = date.toLocaleDateString('pt-BR', { weekday: 'long' });
      const dayMonth = date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
      return `${dayMonth} (${dayName}) ${time.replace(':', 'h')}`;
    },

    // Formatar data e hora separadamente
    formatDate: (deadline: Deadline): string => {
      // Normalizar a data primeiro
      let date: Date;
      if (deadline.deadline_date.includes('T')) {
        date = new Date(deadline.deadline_date);
      } else {
        date = new Date(`${deadline.deadline_date}T${deadline.deadline_time}`);
      }
      return date.toLocaleDateString('pt-BR');
    },

    formatTime: (deadline: Deadline): string => {
      return deadline.deadline_time.substring(0, 5).replace(':', 'h');
    },

    // Verificar se o deadline já passou
    isDeadlineExpired: (deadline: Deadline): boolean => {
      const deadlineDateTime = deadlineService.utils.calculateDeadlineDateTime(deadline);
      return new Date() > deadlineDateTime;
    },

    // Verificar se está próximo do deadline (menos de 8 horas)
    isDeadlineNear: (deadline: Deadline): boolean => {
      const deadlineDateTime = deadlineService.utils.calculateDeadlineDateTime(deadline);
      const now = new Date();
      const timeDiff = deadlineDateTime.getTime() - now.getTime();
      return timeDiff > 0 && timeDiff <= 8 * 60 * 60 * 1000; // 8 horas em milissegundos
    },

    // Obter próximo deadline
    getNextDeadline: (deadlines: Deadline[]): Deadline | null => {
      const now = new Date();
      const futureDeadlines = deadlines
        .filter(d => deadlineService.utils.calculateDeadlineDateTime(d) > now)
        .sort((a, b) => 
          deadlineService.utils.calculateDeadlineDateTime(a).getTime() - 
          deadlineService.utils.calculateDeadlineDateTime(b).getTime()
        );
      return futureDeadlines[0] || null;
    },

    // Calcular próxima data do deadline (para deadlines recorrentes como roster)
    calculateNextDeadlineDate: (deadline: Deadline): Date => {
      // SEMPRE combinar a data com o horário correto
      // Extrair apenas a data (YYYY-MM-DD) do deadline_date
      const dateOnly = deadline.deadline_date.split('T')[0];
      const combinedDateTime = `${dateOnly}T${deadline.deadline_time}`;
      const baseDate = new Date(combinedDateTime);
      
      const now = new Date();
      if (baseDate <= now) {
        if (deadline.type === 'regular_roster' || deadline.type === 'playoffs_roster') {
          const nextDate = new Date(baseDate);
          while (nextDate <= now) {
            nextDate.setDate(nextDate.getDate() + 7);
          }
          return nextDate;
        }
      }
      return baseDate;
    },

    // Calcular deadline da semana atual para rosters
    calculateCurrentWeekDeadline: (deadline: Deadline): Date => {
      // O deadline_date pode vir como ISO string ou como YYYY-MM-DD
      // Vamos normalizar para garantir que funcione
      let baseDate: Date;
      
      // SEMPRE combinar a data com o horário correto
      // Extrair apenas a data (YYYY-MM-DD) do deadline_date
      const dateOnly = deadline.deadline_date.split('T')[0];
      const combinedDateTime = `${dateOnly}T${deadline.deadline_time}`;
      baseDate = new Date(combinedDateTime);
      
      const now = new Date();
      
      // Para deadlines de roster, encontra o deadline da semana atual
      if (deadline.type === 'regular_roster' || deadline.type === 'playoffs_roster') {
        // Se o deadline ainda não passou, retorna o deadline original
        if (baseDate > now) {
          return baseDate;
        }
        
        // Se o deadline já passou, calcula o próximo deadline da semana atual
        const currentDate = new Date(baseDate);
        
        // Encontra o próximo deadline que ainda não passou
        
        return currentDate;
      }
      
      return baseDate;
    }
  }
}; 