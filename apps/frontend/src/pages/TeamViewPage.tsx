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
  const { user, isAdmin: authAdmin } = useAuth();
  const { otherTeamId } = useParams();
  
  return <ViewTeam isAdmin={authAdmin} teamId={parseInt(otherTeamId)} />
};
export default TeamViewPage;