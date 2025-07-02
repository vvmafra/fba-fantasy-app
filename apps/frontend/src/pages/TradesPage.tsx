import React from 'react';
import { useOutletContext } from 'react-router-dom';
import Trades from '@/components/Trades';

interface TeamContext {
  teamId: string;
  isAdmin: boolean;
}

const TradesPage = () => {
  const { teamId, isAdmin } = useOutletContext<TeamContext>();
  
  return <Trades isAdmin={isAdmin} teamId={parseInt(teamId)} />;
};

export default TradesPage; 