import { useQuery, useMutation, UseMutateFunction } from '@tanstack/react-query';
import { ScheduledMeeting, JoinMeetingPayload } from '@/types/meetings';

const API_BASE = '/api/meetings';

const meetingsService = {
  getScheduled: async (): Promise<ScheduledMeeting[]> => {
    const response = await fetch(`${API_BASE}/scheduled`);
    if (!response.ok) throw new Error('Error al cargar reuniones');
    return response.json();
  },

  joinMeeting: async (payload: JoinMeetingPayload): Promise<{ roomUrl: string }> => {
    const response = await fetch(`${API_BASE}/join`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!response.ok) throw new Error('Error al unirse a la reunión');
    return response.json();
  },
};

interface UseMeetingsReturn {
  scheduledMeetings: ScheduledMeeting[];
  isLoadingScheduled: boolean;
  scheduledError: Error | null;
  refetchScheduled: () => void;
  joinMeeting: UseMutateFunction<{ roomUrl: string }, Error, JoinMeetingPayload>;
  isJoining: boolean;
}

export function useMeetings(): UseMeetingsReturn {
  const scheduledQuery = useQuery({
    queryKey: ['meetings', 'scheduled'],
    queryFn: meetingsService.getScheduled,
  });

  const joinMutation = useMutation({
    mutationFn: meetingsService.joinMeeting,
    onSuccess: (data) => {
      window.open(data.roomUrl, '_blank');
    },
    onError: (error) => {
      console.error('Error al unirse:', error);
    },
  });

  return {
    scheduledMeetings: scheduledQuery.data ?? [],
    isLoadingScheduled: scheduledQuery.isLoading,
    scheduledError: scheduledQuery.error,
    refetchScheduled: scheduledQuery.refetch,
    joinMeeting: joinMutation.mutate,
    isJoining: joinMutation.isPending,
  };
}


