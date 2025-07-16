import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import routes from './routes/index.js';
import { errorHandler } from './middlewares/errorHandler.js';
import { notFound } from './middlewares/notFound.js';
import { checkPostgresConnection } from './utils/postgresClient.js';
import { SECURITY_CONFIG, validateSecurityConfig, logSecurityEvent, testSecurityConfig } from './config/security.js';

// Carregar variáveis de ambiente
dotenv.config();

const app = express();
const PORT = process.env['PORT'] || (process.env['NODE_ENV'] === 'production' ? 10000 : 3001);
const API_PREFIX = process.env['API_PREFIX'] || '/api/v1';

// Validar e testar configurações de segurança na inicialização
const securityValid = validateSecurityConfig();
if (!securityValid) {
  logSecurityEvent('WARNING', 'Configurações de segurança incompletas detectadas');
}

// Testar configurações em desenvolvimento
if (process.env['NODE_ENV'] === 'development') {
  testSecurityConfig();
}

// Middlewares de segurança e logging
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));

// Aplicar headers de segurança customizados
Object.entries(SECURITY_CONFIG.HEADERS).forEach(([header, value]) => {
  app.use((req, res, next) => {
    res.setHeader(header, value);
    next();
  });
});

app.use(morgan('combined'));

// Configuração de CORS mais robusta para produção
const corsOptions = {
  origin: SECURITY_CONFIG.CORS.ORIGIN,
  credentials: SECURITY_CONFIG.CORS.CREDENTIALS,
  optionsSuccessStatus: 200 // Para compatibilidade com alguns navegadores
};

app.use(cors(corsOptions));

// Middleware para parsing de JSON
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Rotas da API
app.use(API_PREFIX, routes);

// Health check na raiz para o Render (deve vir ANTES do notFound)
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'API está funcionando',
    timestamp: new Date().toISOString(),
    environment: process.env['NODE_ENV'] || 'development',
    port: PORT
  });
});

// Middleware para rotas não encontradas
app.use(notFound);

// Middleware para tratamento de erros
app.use(errorHandler);

// Função para inicializar o servidor
const startServer = async () => {
  try {
    // Verificar conexão com PostgreSQL
    const isConnected = await checkPostgresConnection();
    if (!isConnected) {
      console.error('❌ Erro na conexão com PostgreSQL');
      process.exit(1);
    }
    console.log('✅ Conexão com PostgreSQL estabelecida');

    // Iniciar servidor
    app.listen(PORT, () => {
      console.log(`🚀 Servidor rodando na porta ${PORT}`);
      console.log(`📡 API disponível em http://localhost:${PORT}${API_PREFIX}`);
      console.log(`🏥 Health check em http://localhost:${PORT}${API_PREFIX}/health`);
    });
  } catch (error) {
    console.error('❌ Erro ao iniciar servidor:', error);
    process.exit(1);
  }
};

// Tratamento de erros não capturados
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

// Iniciar servidor
startServer(); 