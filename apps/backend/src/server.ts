import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import routes from './routes/index.js';
import { errorHandler } from './middlewares/errorHandler';
import { notFound } from './middlewares/notFound';
import { checkPostgresConnection } from './utils/postgresClient';

// Carregar variáveis de ambiente
dotenv.config();

const app = express();
const PORT = process.env['PORT'] || 3001;
const API_PREFIX = process.env['API_PREFIX'] || '/api/v1';

// Middlewares de segurança e logging
app.use(helmet());
app.use(morgan('combined'));
app.use(cors({
  origin: process.env['CORS_ORIGIN'] || 'http://localhost:8080',
  credentials: true
}));

// Middleware para parsing de JSON
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Rotas da API
app.use(API_PREFIX, routes);

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