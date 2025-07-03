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
  
  // Mock user data - será substituído por autenticação real do Supabase
  const userTeam = team?.data?.name || 'Carregando...';
  const userTeamOwner = team?.data?.owner_name || 'Carregando...';
  const [notifications] = React.useState(3);

  const { user, isAdmin: authAdmin, isLoading } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50">
      <Header 
        userTeam={userTeam} 
        userTeamOwner={userTeamOwner}
        isAdmin={authAdmin} 
        notifications={notifications} 
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