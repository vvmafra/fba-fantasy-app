import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env['SUPABASE_URL'];
const supabaseAnonKey = process.env['SUPABASE_ANON_KEY'];
const supabaseServiceRoleKey = process.env['SUPABASE_SERVICE_ROLE_KEY'];

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('⚠️  Supabase URL e Anon Key não encontrados. Verifique suas variáveis de ambiente.');
  console.warn('📝 Copie o arquivo env.example para .env e configure suas credenciais do Supabase.');
}

// Cliente para operações públicas (anônimas)
export const supabase = supabaseUrl && supabaseAnonKey 
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

// Cliente para operações administrativas (com service role)
export const supabaseAdmin = supabaseUrl && supabaseServiceRoleKey 
  ? createClient(supabaseUrl, supabaseServiceRoleKey)
  : null;

// Função helper para verificar se o Supabase está conectado
export const checkSupabaseConnection = async () => {
  try {
    if (!supabase) {
      console.error('❌ Cliente Supabase não inicializado');
      return false;
    }
    const { data, error } = await supabase.from('players').select('count').limit(1);
    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Erro na conexão com Supabase:', error);
    return false;
  }
};

// Função helper para tratamento de erros do Supabase
export const handleSupabaseError = (error: any) => {
  if (error.code === 'PGRST116') {
    return { message: 'Registro não encontrado', statusCode: 404 };
  }
  if (error.code === '23505') {
    return { message: 'Registro já existe', statusCode: 409 };
  }
  if (error.code === '23503') {
    return { message: 'Violação de chave estrangeira', statusCode: 400 };
  }
  return { message: 'Erro interno do servidor', statusCode: 500 };
}; 