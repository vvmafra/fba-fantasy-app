import React from 'react';
import { Outlet, useParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import Header from '@/components/Header';
import Navigation from '@/components/Navigation';
import { useTeam } from '@/hooks/useTeams';

const AdminLayout = () => {
  const { isAdmin, isLoading, teamId: userTeamId, user } = useAuth();
  const { teamId: urlTeamId } = useParams<{ teamId: string }>();
  
  // Usar teamId da URL se disponível, senão usar o teamId do usuário logado
  const effectiveTeamId = urlTeamId ? parseInt(urlTeamId) : (userTeamId ? Number(userTeamId) : undefined);
  
  // Buscar dados do time correto (só se tiver um teamId válido)
  const { data: team } = useTeam(effectiveTeamId);
  
  // Determinar informações do usuário/time
  let userTeam: string;
  let userTeamOwner: string;
  let userTeamLogo: string;
  
  if (effectiveTeamId && team?.data) {
    // Se tem teamId e dados do time, usar os dados do time
    userTeam = team.data.name;
    userTeamOwner = team.data.owner_name;
    userTeamLogo = team.data.logo_path;
  } else if (user?.teamData) {
    // Se tem dados do time no contexto de autenticação
    userTeam = user.teamData.name;
    userTeamOwner = user.teamData.owner_name;
    userTeamLogo = user.teamData.logo_path;
  } else {
    // Fallback para admin sem time específico
    userTeam = 'Administrador';
    userTeamOwner = user?.name || user?.email || 'Admin';
    userTeamLogo = 'default-logo.png';
  }
  
  const [notifications] = React.useState(0);

  // Se ainda está carregando, mostra loading
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-nba-orange mx-auto"></div>
          <p className="mt-2 text-gray-600">Carregando...</p>
        </div>
      </div>
    );
  }

  // Se não for admin, redireciona
  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header 
        userTeam={userTeam} 
        userTeamOwner={userTeamOwner}
        isAdmin={isAdmin} 
        notifications={notifications} 
        userTeamLogo={userTeamLogo}
      />
      
      <main className="pt-20">
        <Outlet />
      </main>
      
      <Navigation 
        isAdmin={isAdmin} 
      />
    </div>
  );
};

export default AdminLayout; 