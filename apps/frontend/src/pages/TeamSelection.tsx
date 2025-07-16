import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Users } from 'lucide-react';
import { useMyTeams } from '@/hooks/useTeams';
import { teamService } from '@/services/teamService';
import { useAuth } from '@/contexts/AuthContext';

const TeamSelection = () => {
  // Mock data - será substituído por dados reais do usuário
  const { data: userTeams, isLoading, error } = useMyTeams();
  const { updateUserTeam } = useAuth();

  useEffect(() => {
    teamService.getMyTeams()
  }, []);

  const handleTeamSelection = (teamId: string | number, teamData: any) => {
    updateUserTeam(teamId, teamData);
  };

  // Verificar se está carregando
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900">Carregando times...</h2>
        </div>
      </div>
    );
  }

  // Verificar se há erro
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-red-600">Erro ao carregar times</h2>
          <p className="text-gray-600 mt-2">Tente novamente mais tarde</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Selecione seu Time
          </h1>
          <p className="text-gray-600">
            Escolha qual time você gostaria de gerenciar
          </p>
        </div>

        <div className="space-y-4">
          {userTeams?.data?.map((team) => (
            <Card key={team.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <img src={`/images/${team.logo_path}`} alt="logo" className="w-12 h-12"/>
                  {team.name}
                </CardTitle>
                {/* <CardDescription>{team.abbreviation}</CardDescription> */}
              </CardHeader>
              <CardContent>
                <Link to={`/team/${team.id}/wall`} onClick={() => handleTeamSelection(team.id, team)}>
                  <Button className="w-full">
                    Gerenciar Time
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>

        {(!userTeams?.data || userTeams.data.length === 0) && (
          <div className="mt-8 text-center">
            <p className="text-sm text-gray-500 mb-4">
              Você não tem times associados ainda.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default TeamSelection; 