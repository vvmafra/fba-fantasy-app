import React from 'react';
import { useOutletContext } from 'react-router-dom';
import FreeAgents from '@/components/FreeAgents';

interface TeamContext {
  teamId: string;
  isAdmin: boolean;
}

const FreeAgentsPage = () => {
  const { teamId, isAdmin } = useOutletContext<TeamContext>();
  
  return <FreeAgents isAdmin={isAdmin} teamId={parseInt(teamId)} />;
};

export default FreeAgentsPage; 