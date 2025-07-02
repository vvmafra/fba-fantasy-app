import React from 'react';
import { useOutletContext } from 'react-router-dom';
import Wall from '@/components/Wall';

interface TeamContext {
  teamId: string;
  isAdmin: boolean;
}

const WallPage = () => {
  const { teamId, isAdmin } = useOutletContext<TeamContext>();
  
  return <Wall isAdmin={isAdmin} teamId={parseInt(teamId)} />;
};

export default WallPage; 