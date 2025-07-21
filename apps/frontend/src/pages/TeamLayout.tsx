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
  
  // Usar dados do contexto de autenticação
  const { user: authUser, isAdmin: authAdmin, isLoading } = useAuth();

  // Verificar se o usuário é dono do time ou admin
  const isOwnerOrAdmin = React.useMemo(() => {
    if (!authUser || !team?.data) return false;
    
    // Se é admin, tem acesso
    if (authAdmin) return true;
    
    // Se não é admin, verificar se é dono do time
    const userId = parseInt(authUser.id);
    const teamOwnerId = team.data.owner_id;
    
    return userId === teamOwnerId;
  }, [authUser, team?.data, authAdmin]);

  // Usar dados do contexto de autenticação se disponíveis, senão usar dados da API
  const userTeam = authUser?.teamData?.name || team?.data?.name || 'Carregando...';
  const userTeamOwner = authUser?.teamData?.owner_name || team?.data?.owner_name || 'Carregando...';
  const userTeamLogo = authUser?.teamData?.logo_path || team?.data?.logo_path || 'Carregando...';
  const [notifications] = React.useState(3);

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
        isAdmin={authAdmin} 
      />
    </div>
  );
};

export default TeamLayout; 