import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

// String de conexão PostgreSQL do Supabase
const connectionString = process.env['DATABASE_URL']

// Configuração do pool de conexões
const pool = new Pool({
  connectionString,
  ssl: {
    rejectUnauthorized: false
  },
  max: 20, // máximo de conexões no pool
  idleTimeoutMillis: 30000, // tempo limite de conexões ociosas
  connectionTimeoutMillis: 10000, // tempo limite para estabelecer conexão
});

// Configurar timezone para todas as conexões de forma mais robusta
pool.on('connect', async (client) => {
  try {
    // Forçar timezone para America/Sao_Paulo
    await client.query('SET timezone = \'America/Sao_Paulo\'');
    
    // Verificar se foi aplicado
    const result = await client.query('SELECT current_setting(\'timezone\') as timezone');
    console.log(`✅ Timezone configurado para: ${result.rows[0].timezone}`);
    
    // Configurar também o formato de data
    await client.query('SET datestyle = \'ISO, DMY\'');
    
  } catch (error) {
    console.error('❌ Erro ao configurar timezone:', error);
  }
});

// Função para verificar conexão
export const checkPostgresConnection = async () => {
  try {
    const client = await pool.connect();
    await client.query('SELECT NOW()');
    client.release();
    return true;
  } catch (error) {
    console.error('❌ Erro na conexão PostgreSQL:', error);
    return false;
  }
};

// Função helper para executar queries
export const query = (text: string, params?: any[]) => {
  return pool.query(text, params);
};

// Função para fechar o pool (usar no shutdown da aplicação)
export const closePool = () => {
  return pool.end();
};

export default pool; 