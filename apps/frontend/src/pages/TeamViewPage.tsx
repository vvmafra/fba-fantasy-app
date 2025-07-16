import React from 'react';
import { useParams } from 'react-router-dom';
import { useTeam } from '@/hooks/useTeams';
import ViewTeam from '@/components/TeamView';
import { useOutletContext } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

interface TeamContext {
  teamId: string;
  isAdmin: boolean;
}

const TeamViewPage = () => {
  const { user, isAdmin: authAdmin, teamId } = useAuth();
  const { otherTeamId } = useParams();
  
  // Usar teamId do contexto se não houver otherTeamId (para visualizar o próprio time)
  const teamIdToShow = otherTeamId ? parseInt(otherTeamId) : (teamId ? Number(teamId) : undefined);
  
  return <ViewTeam isAdmin={authAdmin} teamId={teamIdToShow} />
};
export default TeamViewPage;