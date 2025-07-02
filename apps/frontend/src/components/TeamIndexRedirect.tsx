import React from "react";
import { useParams, Navigate } from "react-router-dom";
import { useTeam } from "@/hooks/useTeams";

const TeamIndexRedirect: React.FC = () => {
  const { teamId } = useParams();
  const { data: team, isLoading } = useTeam(Number(teamId));
  const user = React.useMemo(() => {
    const userStr = localStorage.getItem("user");
    return userStr ? JSON.parse(userStr) : null;
  }, []);

  if (isLoading) return null; // Ou um loading, se preferir

  // Sempre redireciona para wall (Home)
  return <Navigate to="wall" replace />;
};

export default TeamIndexRedirect;