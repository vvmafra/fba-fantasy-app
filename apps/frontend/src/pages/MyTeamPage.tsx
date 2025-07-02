import React from 'react';
import { useOutletContext } from 'react-router-dom';
import MyTeam from '@/components/MyTeam';
import Picks from '@/components/Picks';

interface TeamContext {
  teamId: string;
  isAdmin: boolean;
}

const MyTeamPage = () => {
  const { teamId, isAdmin } = useOutletContext<TeamContext>();
  
  return (
    <>
      <MyTeam isAdmin={isAdmin} teamId={parseInt(teamId)} />
      <Picks isAdmin={isAdmin} teamId={parseInt(teamId)} />
    </>
  );
};

export default MyTeamPage; 