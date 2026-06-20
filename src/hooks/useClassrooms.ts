import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';

export interface Classroom {
  id: string;
  name: string;
  code: string;
  instructor_id: string;
  is_active: boolean;
  created_at: string;
}

export function useClassrooms() {
  return useQuery<Classroom[]>({
    queryKey: ['classrooms'],
    queryFn: async () => (await api.get('/api/classrooms')).data,
  });
}

export function useCreateClassroom() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (name: string) =>
      (await api.post('/api/classrooms', { name })).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['classrooms'] }),
  });
}

export function useJoinClassroom() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (code: string) =>
      (await api.post(`/api/classrooms/join/${code}`)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['classrooms'] }),
  });
}
