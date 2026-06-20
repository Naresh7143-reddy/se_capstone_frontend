import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { useAuth } from '@/store/auth';

export interface Profile {
  id: string;
  email: string;
  name: string;
  role: string;
  created_at: string;
}

export function useProfile() {
  const user = useAuth((s) => s.user);
  return useQuery<Profile>({
    queryKey: ['profile', user?.uid],
    enabled: !!user,
    queryFn: async () => (await api.get('/api/auth/me')).data,
  });
}
