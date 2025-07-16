// Configurações da aplicação
export const config = {
  // API Configuration - detecta automaticamente se está em produção
  apiUrl: import.meta.env.VITE_API_URL || (
    import.meta.env.PROD 
      ? 'https://seu-backend.vercel.app/api/v1' // Ajuste para sua URL de produção
      : 'http://localhost:3001/api/v1'
  ),
  
  // Supabase Configuration (se necessário no futuro)
  supabaseUrl: import.meta.env.VITE_SUPABASE_URL,
  supabaseAnonKey: import.meta.env.VITE_SUPABASE_ANON_KEY,
  
  // App Configuration
  appName: 'FBA App',
  version: '1.0.0',
  
  // Default team ID (temporário - será substituído por autenticação)
  // defaultTeamId: 1,
} as const; 