import React from 'react';
import { useOutletContext } from 'react-router-dom';
import Statistics from '@/components/Statistics';

interface TeamContext {
  teamId: string;
  isAdmin: boolean;
}

const StatisticsPage = () => {
  const { teamId, isAdmin } = useOutletContext<TeamContext>();
  
  return <Statistics isAdmin={isAdmin} teamId={parseInt(teamId)} />;
};

export default StatisticsPage; 