import { OAuth2Client } from 'google-auth-library';
import jwt from 'jsonwebtoken';
import pool from '../utils/postgresClient.js';
import { createError } from '../middlewares/errorHandler.js';

export interface GoogleUser {
  id: string;
  email: string;
  name: string;
}

export interface AuthResponse {
  user: any;
  token: string;
  refreshToken: string;
  expiresIn: number;
}

export class AuthService {
  private static client = new OAuth2Client(process.env['GOOGLE_CLIENT_ID']);

  // Verificar se o cliente PostgreSQL está inicializado
  private static checkPostgresClient() {
    if (!pool) {
      throw createError('Cliente PostgreSQL não inicializado. Verifique suas variáveis de ambiente.', 500);
    }
  }

  // Verificar se as variáveis de ambiente estão configuradas
  private static checkEnvironmentVariables() {
    if (!process.env['GOOGLE_CLIENT_ID']) {
      throw createError('GOOGLE_CLIENT_ID não configurado', 500);
    }
    if (!process.env['JWT_SECRET']) {
      throw createError('JWT_SECRET não configurado', 500);
    }
  }

  // Validar token Google e extrair dados do usuário
  static async validateGoogleToken(credential: string): Promise<GoogleUser> {
    try {
      this.checkEnvironmentVariables();

      const googleClientId = process.env['GOOGLE_CLIENT_ID']!;
      
      const ticket = await this.client.verifyIdToken({
        idToken: credential,
        audience: googleClientId,
      });

      const payload = ticket.getPayload();
      if (!payload) {
        throw createError('Token inválido', 401);
      }

      return {
        id: payload.sub!,
        email: payload.email!,
        name: payload.name!
      };
    } catch (error) {
      throw createError('Token inválido ou expirado', 401);
    }
  }

  // Buscar usuário por Google ID
  static async findUserByGoogleId(googleId: string): Promise<any | null> {
    try {
      this.checkPostgresClient();
      
      const { rows } = await pool.query(
        `SELECT u.*, t.id AS "teamId"
         FROM users u
         LEFT JOIN teams t ON t.owner_id = u.id
         WHERE u.google_id = $1`,
        [googleId]
      );

      return rows.length > 0 ? rows[0] : null;
    } catch (error) {
      throw error;
    }
  }

  // Buscar usuário por email
  static async findUserByEmail(email: string): Promise<any | null> {
    try {
      this.checkPostgresClient();
      
      const { rows } = await pool.query(
        `SELECT u.*, t.id AS "teamId"
         FROM users u
         LEFT JOIN teams t ON t.owner_id = u.id
         WHERE u.email = $1`,
        [email]
      );

      return rows.length > 0 ? rows[0] : null;
    } catch (error) {
      throw error;
    }
  }

  // Atualizar google_id de um usuário existente
  static async updateUserGoogleId(userId: number, googleId: string): Promise<any> {
    try {
      this.checkPostgresClient();
      
      const { rows } = await pool.query(
        `UPDATE users 
         SET google_id = $1, updated_at = NOW()
         WHERE id = $2
         RETURNING *`,
        [googleId, userId]
      );

      return rows[0];
    } catch (error) {
      throw error;
    }
  }

  // Criar novo usuário
  static async createUser(googleId: string, email: string, name: string): Promise<any> {
    try {
      this.checkPostgresClient();
      
      const { rows } = await pool.query(
        'INSERT INTO users (google_id, email, name) VALUES ($1, $2, $3) RETURNING *',
        [googleId, email, name]
      );

      return rows[0];
    } catch (error) {
      throw error;
    }
  }

  // Salvar refresh token no banco
  static async saveRefreshToken(userId: number, refreshToken: string): Promise<void> {
    try {
      this.checkPostgresClient();
      
      await pool.query(
        `UPDATE users 
         SET refresh_token = $1, token_updated_at = NOW()
         WHERE id = $2`,
        [refreshToken, userId]
      );
    } catch (error) {
      throw error;
    }
  }

  // Verificar se refresh token é válido
  static async validateRefreshToken(userId: number, refreshToken: string): Promise<boolean> {
    try {
      this.checkPostgresClient();
      
      const { rows } = await pool.query(
        `SELECT refresh_token, token_updated_at 
         FROM users 
         WHERE id = $1 AND refresh_token = $2`,
        [userId, refreshToken]
      );

      if (rows.length === 0) {
        return false;
      }

      // Verificar se o token não expirou (30 dias)
      const tokenUpdatedAt = new Date(rows[0].token_updated_at);
      const now = new Date();
      const daysDiff = (now.getTime() - tokenUpdatedAt.getTime()) / (1000 * 60 * 60 * 24);

      return daysDiff <= 30;
    } catch (error) {
      return false;
    }
  }

  // Gerar JWT token (30 dias de expiração)
  static generateJWT(userId: number, email: string, role: string = 'user'): string {
    this.checkEnvironmentVariables();

    return jwt.sign(
      { userId, email, role },
      process.env['JWT_SECRET']!,
      { expiresIn: '30d' }
    );
  }

  // Gerar refresh token
  static generateRefreshToken(): string {
    this.checkEnvironmentVariables();
    
    return jwt.sign(
      { type: 'refresh' },
      process.env['JWT_SECRET']!,
      { expiresIn: '30d' }
    );
  }

  // Processo completo de login Google
  static async googleLogin(credential: string): Promise<AuthResponse> {
    try {
      // 1. Validar token Google
      const googleUser = await this.validateGoogleToken(credential);

      // 2. Buscar usuário por Google ID primeiro
      let user = await this.findUserByGoogleId(googleUser.id);

      // 3. Se não encontrar por Google ID, verificar se existe por email
      if (!user) {
        const existingUserByEmail = await this.findUserByEmail(googleUser.email);
        
        if (existingUserByEmail) {
          // Usuário existe mas não tem google_id, atualizar
          user = await this.updateUserGoogleId(existingUserByEmail.id, googleUser.id);
        } else {
          // Usuário não existe, criar novo
          user = await this.createUser(googleUser.id, googleUser.email, googleUser.name);
        }
      }

      // 4. Gerar JWT e refresh token
      const userRole = user.role || 'user';
      const token = this.generateJWT(user.id, user.email, userRole);
      const refreshToken = this.generateRefreshToken();

      // 5. Salvar refresh token no banco
      await this.saveRefreshToken(user.id, refreshToken);

      return { 
        user, 
        token, 
        refreshToken,
        expiresIn: 30 * 24 * 60 * 60 * 1000 // 30 dias em millisegundos
      };
    } catch (error) {
      throw error;
    }
  }

  // Renovar token usando refresh token
  static async refreshToken(userId: number, refreshToken: string): Promise<AuthResponse> {
    try {
      // Verificar se o refresh token é válido
      const isValid = await this.validateRefreshToken(userId, refreshToken);
      if (!isValid) {
        throw createError('Refresh token inválido ou expirado', 401);
      }

      // Buscar dados do usuário
      const { rows } = await pool.query(
        `SELECT u.*, t.id AS "teamId"
         FROM users u
         LEFT JOIN teams t ON t.owner_id = u.id
         WHERE u.id = $1`,
        [userId]
      );

      if (rows.length === 0) {
        throw createError('Usuário não encontrado', 404);
      }

      const user = rows[0];

      // Gerar novo JWT e refresh token
      const userRole = user.role || 'user';
      const newToken = this.generateJWT(user.id, user.email, userRole);
      const newRefreshToken = this.generateRefreshToken();

      // Salvar novo refresh token no banco
      await this.saveRefreshToken(user.id, newRefreshToken);

      return { 
        user, 
        token: newToken, 
        refreshToken: newRefreshToken,
        expiresIn: 30 * 24 * 60 * 60 * 1000
      };
    } catch (error) {
      throw error;
    }
  }
}
