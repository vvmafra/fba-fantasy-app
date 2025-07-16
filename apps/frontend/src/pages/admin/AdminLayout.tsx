import React from 'react';
import { Outlet, useParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import Header from '@/components/Header';
import Navigation from '@/components/Navigation';
import { useTeam } from '@/hooks/useTeams';

const AdminLayout = () => {
  const { isAdmin, isLoading } = useAuth();
  const { teamId } = useParams<{ teamId: string }>();
  
  // Buscar dados do time (usando teamId padrão se não estiver em contexto de time)
  const { data: team } = useTeam(parseInt(teamId || '1'));
  
  // Mock user data - será substituído por autenticação real do Supabase
  const userTeam = team?.data?.name || 'Admin';
  const userTeamOwner = team?.data?.owner_name || 'Administrador';
  const [notifications] = React.useState(0);
  const userTeamLogo = team?.data?.logo_path || 'default-logo.png';

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