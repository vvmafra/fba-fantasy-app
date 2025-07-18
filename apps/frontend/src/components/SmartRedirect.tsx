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

    // Se estamos na rota raiz (/)
    if (location.pathname === '/') {
      if (user) {
        // Usuário está logado, redirecionar para /teams
        navigate('/teams', { replace: true });
      } else {
        // Usuário não está logado, permanecer na página de login
        console.error('🔐 Usuário não logado, permanecendo na página de login');
      }
      return;
    }

    // Proteger rotas que requerem autenticação
    const protectedRoutes = ['/teams', '/team', '/admin'];
    const isProtectedRoute = protectedRoutes.some(route => 
      location.pathname.startsWith(route)
    );

    if (isProtectedRoute && !user) {
      navigate('/', { replace: true });
      return;
    }

    // Se o usuário está logado mas tentando acessar a página de login
    if (location.pathname === '/login' && user) {
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