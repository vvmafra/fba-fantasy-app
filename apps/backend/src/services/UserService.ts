import pool from '../utils/postgresClient.js';
import { User, CreateUserRequest, UpdateUserRequest, UserQueryParams, PaginatedResponse } from '../types';

export class UserService {
  // Buscar todos os usuários com filtros e paginação
  static async getAllUsers(params: UserQueryParams): Promise<PaginatedResponse<User>> {
    const {
      page = 1,
      limit = 10,
      sortBy = 'id',
      sortOrder = 'asc',
      name,
      email,
      role
    } = params;

    const offset = (page - 1) * limit;

    // Construir query base
    let query = `
      SELECT 
        id,
        name,
        email,
        role
      FROM users
      WHERE 1=1
    `;

    const queryParams: any[] = [];
    let paramIndex = 1;

    // Adicionar filtros
    if (name) {
      query += ` AND name ILIKE $${paramIndex}`;
      queryParams.push(`%${name}%`);
      paramIndex++;
    }

    if (email) {
      query += ` AND email ILIKE $${paramIndex}`;
      queryParams.push(`%${email}%`);
      paramIndex++;
    }

    if (role) {
      query += ` AND role = $${paramIndex}`;
      queryParams.push(role);
      paramIndex++;
    }

    // Query para contar total
    const countQuery = query.replace(/SELECT.*FROM/, 'SELECT COUNT(*) FROM');
    const { rows: countRows } = await pool.query(countQuery, queryParams);
    const total = parseInt(countRows[0].count);

    // Adicionar ordenação e paginação
    query += ` ORDER BY ${sortBy} ${sortOrder.toUpperCase()}`;
    query += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    queryParams.push(limit, offset);

    const { rows } = await pool.query(query, queryParams);

    const totalPages = Math.ceil(total / limit);

    return {
      success: true,
      data: rows,
      pagination: {
        page,
        limit,
        total,
        totalPages
      }
    };
  }

  // Buscar usuário por ID
  static async getUserById(id: number): Promise<User | null> {
    const { rows } = await pool.query(`
      SELECT 
        id,
        name,
        email,
        role
      FROM users 
      WHERE id = $1
    `, [id]);
    
    return rows[0] || null;
  }

  // Criar novo usuário
  static async createUser(userData: CreateUserRequest): Promise<User> {
    const { name, email, role = 'user' } = userData;

    // Verificar se email já existe
    const existingUser = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existingUser.rows.length > 0) {
      throw new Error('Email já está em uso');
    }

    const { rows } = await pool.query(`
      INSERT INTO users (name, email, role)
      VALUES ($1, $2, $3)
      RETURNING 
        id,
        name,
        email,
        role
    `, [name, email, role]);

    return rows[0];
  }

  // Atualizar usuário
  static async updateUser(id: number, userData: UpdateUserRequest): Promise<User> {
    const { name, email, role } = userData;

    // Verificar se usuário existe
    const existingUser = await this.getUserById(id);
    if (!existingUser) {
      throw new Error('Usuário não encontrado');
    }

    // Verificar se email já existe (se estiver sendo alterado)
    if (email && email !== existingUser.email) {
      const emailCheck = await pool.query('SELECT id FROM users WHERE email = $1 AND id != $2', [email, id]);
      if (emailCheck.rows.length > 0) {
        throw new Error('Email já está em uso');
      }
    }

    // Construir query de atualização
    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (name !== undefined) {
      updates.push(`name = $${paramIndex}`);
      values.push(name);
      paramIndex++;
    }

    if (email !== undefined) {
      updates.push(`email = $${paramIndex}`);
      values.push(email);
      paramIndex++;
    }

    if (role !== undefined) {
      updates.push(`role = $${paramIndex}`);
      values.push(role);
      paramIndex++;
    }

    if (updates.length === 0) {
      return existingUser;
    }

    values.push(id);

    const { rows } = await pool.query(`
      UPDATE users 
      SET ${updates.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING 
        id,
        name,
        email,
        role
    `, values);

    return rows[0];
  }

  // Deletar usuário
  static async deleteUser(id: number): Promise<void> {
    // Verificar se usuário existe
    const existingUser = await this.getUserById(id);
    if (!existingUser) {
      throw new Error('Usuário não encontrado');
    }

    // Verificar se usuário tem times associados
    const teamsCheck = await pool.query('SELECT COUNT(*) FROM teams WHERE owner_id = $1', [id]);
    const teamCount = parseInt(teamsCheck.rows[0].count);
    
    if (teamCount > 0) {
      throw new Error('Não é possível deletar usuário que possui times associados');
    }

    await pool.query('DELETE FROM users WHERE id = $1', [id]);
  }
} 