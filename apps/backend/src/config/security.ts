// Configurações de segurança da aplicação

export const SECURITY_CONFIG = {
  // Configurações de JWT
  JWT: {
    SECRET: process.env['JWT_SECRET'] || 'fallback-secret-change-in-production',
    ACCESS_TOKEN_EXPIRY: '30d',
    REFRESH_TOKEN_EXPIRY: '30d',
  },

  // Configurações de Rate Limiting
  RATE_LIMIT: {
    WINDOW_MS: 15 * 60 * 1000, // 15 minutos
    MAX_REQUESTS: {
      LOGIN: 5, // 5 tentativas de login por 15 minutos
      REFRESH: 10, // 10 tentativas de refresh por 15 minutos
      GENERAL: 100, // 100 requisições gerais por 15 minutos
    },
  },

  // Configurações de CORS
  CORS: {
    ORIGIN: process.env['CORS_ORIGIN'] || (process.env['NODE_ENV'] === 'production' ? false : ['http://localhost:3000', 'http://localhost:8080', 'http://127.0.0.1:8080']),
    CREDENTIALS: true,
  },

  // Configurações de Headers de Segurança
  HEADERS: {
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
  },

  // Configurações de Refresh Token
  REFRESH_TOKEN: {
    MAX_AGE_DAYS: 30,
    ROTATION_ENABLED: true, // Rotacionar refresh tokens a cada renovação
    FAMILY_SIZE: 5, // Máximo de refresh tokens ativos por usuário
  },

  // Configurações de Logs de Segurança
  SECURITY_LOGS: {
    ENABLED: true,
    LOG_FAILED_LOGINS: true,
    LOG_FAILED_REFRESH: true,
    LOG_SUSPICIOUS_ACTIVITY: true,
  },
};

// Função para validar configurações de segurança
export const validateSecurityConfig = () => {
  const errors: string[] = [];

  if (!process.env['JWT_SECRET'] || process.env['JWT_SECRET'] === 'fallback-secret-change-in-production') {
    errors.push('JWT_SECRET deve ser configurado em produção');
  }

  if (!process.env['GOOGLE_CLIENT_ID']) {
    errors.push('GOOGLE_CLIENT_ID deve ser configurado');
  }

  if (errors.length > 0) {
    console.warn('⚠️  Configurações de segurança incompletas:');
    errors.forEach(error => console.warn(`   - ${error}`));
  }

  return errors.length === 0;
};

// Função para log de segurança
export const logSecurityEvent = (event: string, details: any) => {
  if (SECURITY_CONFIG.SECURITY_LOGS.ENABLED) {
    const timestamp = new Date().toISOString();
    // Log de segurança implementado aqui
  }
};

// Função para testar configurações de segurança
export const testSecurityConfig = () => {
  // Validar configurações
  const isValid = validateSecurityConfig();
  
  return isValid;
};