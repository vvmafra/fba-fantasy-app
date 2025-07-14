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

  // Gerar JWT token
  static generateJWT(userId: number, email: string, role: string = 'user'): string {
    this.checkEnvironmentVariables();

    return jwt.sign(
      { userId, email, role },
      process.env['JWT_SECRET']!,
      { expiresIn: '7d' }
    );
  }

  // Processo completo de login Google
  static async googleLogin(credential: string): Promise<AuthResponse> {
    try {
      // 1. Validar token Google
      const googleUser = await this.validateGoogleToken(credential);

      // 2. Buscar ou criar usuário
      let user = await this.findUserByGoogleId(googleUser.id);

      if (!user) {
        user = await this.createUser(googleUser.id, googleUser.email, googleUser.name);
      }

      // 3. Gerar JWT com role do usuário
      const userRole = user.role || 'user'; // Default para 'user' se não tiver role
      const token = this.generateJWT(user.id, user.email, userRole);

      return { user, token };
    } catch (error) {
      throw error;
    }
  }
}
