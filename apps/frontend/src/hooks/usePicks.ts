import { useQuery } from '@tanstack/react-query';
import { getTeamFuturePicks, TeamFuturePicks } from '@/services/pickService';

export function useTeamFuturePicks(teamId?: number) {
  return useQuery({
    queryKey: ['teamFuturePicks', teamId],
    queryFn: () => {
      if (!teamId) return Promise.resolve(null);
      return getTeamFuturePicks(teamId).then(res => res.data);
    },
    enabled: !!teamId,
  });
} 