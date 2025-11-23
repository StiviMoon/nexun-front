import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { MeetingHistory } from '@/types/meetings';

const API_BASE = '/api/meetings';

const historyService = {
  getHistory: async (): Promise<MeetingHistory[]> => {
    const response = await fetch(`${API_BASE}/history`);
    if (!response.ok) throw new Error('Error al cargar historial');
    return response.json();
  },
};

export function useMeetingHistory() {
  const [searchQuery, setSearchQuery] = useState('');

  const historyQuery = useQuery({
    queryKey: ['meetings', 'history'],
    queryFn: historyService.getHistory,
  });

  // Filtrar reuniones por búsqueda
  const filteredMeetings = useMemo(() => {
    const meetings = historyQuery.data ?? [];
    
    if (!searchQuery.trim()) return meetings;

    const query = searchQuery.toLowerCase();
    return meetings.filter(
      (meeting) =>
        meeting.title.toLowerCase().includes(query) ||
        meeting.hostName.toLowerCase().includes(query)
    );
  }, [historyQuery.data, searchQuery]);

  return {
    meetings: filteredMeetings,
    allMeetings: historyQuery.data ?? [],
    isLoading: historyQuery.isLoading,
    error: historyQuery.error,
    refetch: historyQuery.refetch,
    searchQuery,
    setSearchQuery,
  };
}