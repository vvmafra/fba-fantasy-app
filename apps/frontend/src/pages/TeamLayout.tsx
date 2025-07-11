import React from 'react';
import { Outlet, useParams } from 'react-router-dom';
import Header from '@/components/Header';
import Navigation from '@/components/Navigation';
import { useTeam } from '@/hooks/useTeams';
import { useAuth } from '@/contexts/AuthContext';

const TeamLayout = () => {
  const { teamId } = useParams<{ teamId: string }>();
  
  // Buscar dados do time
  const { data: team } = useTeam(parseInt(teamId || '1'));
  
  // Buscar dados do usuário do localStorage
  const [user, setUser] = React.useState(() => {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  });

  // Listener para mudanças no localStorage
  React.useEffect(() => {
    const handleStorageChange = () => {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        setUser(JSON.parse(userStr));
      }
    };

    const handleUserTeamChanged = (event: CustomEvent) => {
      setUser(event.detail.user);
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('userTeamChanged', handleUserTeamChanged as EventListener);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('userTeamChanged', handleUserTeamChanged as EventListener);
    };
  }, []);
  
  // Usar dados do localStorage se disponíveis, senão usar dados da API
  const userTeam = user?.teamData?.name || team?.data?.name || 'Carregando...';
  const userTeamOwner = user?.teamData?.owner_name || team?.data?.owner_name || 'Carregando...';
  const userTeamLogo = user?.teamData?.logo_path || team?.data?.logo_path || 'Carregando...';
  const [notifications] = React.useState(3);

  const { user: authUser, isAdmin: authAdmin, isLoading } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50">
      <Header 
        userTeam={userTeam} 
        userTeamOwner={userTeamOwner}
        isAdmin={authAdmin} 
        notifications={notifications} 
        userTeamLogo={userTeamLogo}
      />
      
      <main className="pt-20">
        <Outlet context={{ teamId, isAdmin: authAdmin }} />
      </main>
      
      <Navigation 
        teamId={teamId}
        isAdmin={authAdmin} 
      />
    </div>
  );
};

export default TeamLayout; 