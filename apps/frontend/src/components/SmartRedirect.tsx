import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

const SmartRedirect = () => {
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Aguardar até que a verificação de autenticação seja concluída
    if (isLoading) return;

    console.log('🧠 SmartRedirect - Verificando rota:', location.pathname);
    console.log('👤 Status do usuário:', user ? 'Logado' : 'Não logado');

    // Se estamos na rota raiz (/)
    if (location.pathname === '/') {
      if (user) {
        // Usuário está logado, redirecionar para /teams
        console.log('🔄 Usuário logado, redirecionando para /teams');
        navigate('/teams', { replace: true });
      } else {
        // Usuário não está logado, permanecer na página de login
        console.log('🔐 Usuário não logado, permanecendo na página de login');
      }
      return;
    }

    // Proteger rotas que requerem autenticação
    const protectedRoutes = ['/teams', '/team', '/admin'];
    const isProtectedRoute = protectedRoutes.some(route => 
      location.pathname.startsWith(route)
    );

    if (isProtectedRoute && !user) {
      console.log('🚫 Tentativa de acessar rota protegida sem autenticação');
      console.log('🔄 Redirecionando para página de login');
      navigate('/', { replace: true });
      return;
    }

    // Se o usuário está logado mas tentando acessar a página de login
    if (location.pathname === '/login' && user) {
      console.log('🔄 Usuário logado tentando acessar login, redirecionando para /teams');
      navigate('/teams', { replace: true });
      return;
    }

  }, [user, isLoading, navigate, location.pathname]);

  // Se ainda está carregando, mostrar nada
  if (isLoading) {
    return null;
  }

  // Este componente não renderiza nada, apenas gerencia redirecionamentos
  return null;
};

export default SmartRedirect; 