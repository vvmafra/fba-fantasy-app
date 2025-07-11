import pool from '@/utils/postgresClient';
import { Deadline, CreateDeadlineRequest, UpdateDeadlineRequest } from '@/types';

export class DeadlineService {
  // Buscar todos os deadlines
  static async getAllDeadlines() {
    const { rows } = await pool.query(`
      SELECT d.*, s.year as season_year 
      FROM deadlines d 
      JOIN seasons s ON d.season_id = s.id 
      ORDER BY d.season_id DESC, d.deadline_date, d.deadline_time
    `);
    return rows;
  }

  // Buscar deadlines por temporada
  static async getDeadlinesBySeason(seasonId: number) {
    const { rows } = await pool.query(
      'SELECT * FROM deadlines WHERE season_id = $1 AND is_active = true ORDER BY deadline_date, deadline_time',
      [seasonId]
    );
    return rows;
  }

  // Buscar deadline por ID
  static async getDeadlineById(id: number) {
    const { rows } = await pool.query('SELECT * FROM deadlines WHERE id = $1', [id]);
    return rows[0];
  }

  // Criar novo deadline
  static async createDeadline(data: CreateDeadlineRequest): Promise<Deadline> {
    const { season_id, title, description, deadline_date, deadline_time, type, is_active = true } = data;
    
    const { rows } = await pool.query(
      `INSERT INTO deadlines (season_id, title, description, deadline_date, deadline_time, type, is_active) 
       VALUES ($1, $2, $3, $4, $5, $6, $7) 
       RETURNING *`,
      [season_id, title, description, deadline_date, deadline_time, type, is_active]
    );
    
    return rows[0];
  }

  // Atualizar deadline
  static async updateDeadline(id: number, data: UpdateDeadlineRequest): Promise<Deadline> {
    const fields = [];
    const values = [];
    let paramCount = 1;

    // Construir query dinamicamente
    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined) {
        fields.push(`${key} = $${paramCount}`);
        values.push(value);
        paramCount++;
      }
    });

    if (fields.length === 0) {
      throw new Error('Nenhum campo para atualizar');
    }

    // Adicionar updated_at
    fields.push(`updated_at = CURRENT_TIMESTAMP`);
    
    values.push(id);
    const { rows } = await pool.query(
      `UPDATE deadlines SET ${fields.join(', ')} WHERE id = $${paramCount} RETURNING *`,
      values
    );

    return rows[0];
  }

  // Deletar deadline
  static async deleteDeadline(id: number) {
    await pool.query('DELETE FROM deadlines WHERE id = $1', [id]);
  }

  // Buscar próximos deadlines da temporada ativa
  static async getUpcomingDeadlines() {
    const { rows } = await pool.query(`
      SELECT d.*, s.year as season_year 
      FROM deadlines d 
      JOIN seasons s ON d.season_id = s.id 
      WHERE s.is_active = true AND d.is_active = true 
      ORDER BY d.deadline_date, d.deadline_time
    `);
    return rows;
  }

  // Buscar deadline por tipo e temporada
  static async getDeadlineByTypeAndSeason(type: string, seasonId: number) {
    const { rows } = await pool.query(
      'SELECT * FROM deadlines WHERE type = $1 AND season_id = $2 AND is_active = true LIMIT 1',
      [type, seasonId]
    );
    return rows[0];
  }

  // Calcular data/hora do deadline
  static calculateDeadlineDateTime(deadline: Deadline): Date {
    return new Date(`${deadline.deadline_date}T${deadline.deadline_time}`);
  }

  // Verificar se o deadline já passou
  static isDeadlineExpired(deadline: Deadline): boolean {
    const deadlineDateTime = this.calculateDeadlineDateTime(deadline);
    return new Date() > deadlineDateTime;
  }

  // Verificar se está próximo do deadline (menos de 8 horas)
  static isDeadlineNear(deadline: Deadline): boolean {
    const deadlineDateTime = this.calculateDeadlineDateTime(deadline);
    const now = new Date();
    const timeDiff = deadlineDateTime.getTime() - now.getTime();
    return timeDiff > 0 && timeDiff <= 8 * 60 * 60 * 1000; // 8 horas em milissegundos
  }
}

export default DeadlineService; 