import React from 'react';
import { useParams, Navigate } from 'react-router-dom';
import { useTeam } from '@/hooks/useTeams';

interface OwnerRouteProps {
  children: React.ReactNode;
}

const OwnerRoute: React.FC<OwnerRouteProps> = ({ children }) => {
  const { teamId } = useParams();
  const { data: team, isLoading } = useTeam(Number(teamId));
  const user = React.useMemo(() => {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  }, []);

  if (isLoading) {
    return (
  <div></div>
    )
  }
  if (!team?.data) return <Navigate to="/teams" replace />;
  if (team.data.owner_id !== Number(user?.id)) {
    return <Navigate to={`/team/${teamId}`} replace />;
  }
  return <>{children}</>;
};

export default OwnerRoute; 