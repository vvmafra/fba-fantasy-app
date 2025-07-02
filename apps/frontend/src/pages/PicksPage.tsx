import React from 'react';
import { useOutletContext } from 'react-router-dom';
import Picks from '@/components/Picks';

interface TeamContext {
  teamId: string;
  isAdmin: boolean;
}

const PicksPage = () => {
  const { teamId, isAdmin } = useOutletContext<TeamContext>();
  
  return <Picks isAdmin={isAdmin} teamId={parseInt(teamId)} />;
};

export default PicksPage; 