import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import type { TestCase } from './useExams';

export interface LibraryQuestion {
  id: string;
  title: string;
  problem_statement: string;
  input_format: string;
  output_format: string;
  constraints: string;
  difficulty: 'easy' | 'medium' | 'hard';
  tags: string[];
  sample_test_cases: TestCase[];
  hidden_test_cases: TestCase[];
  default_points: number;
}

export function useLibrary(search: string, difficulty: string, tag: string) {
  return useQuery<LibraryQuestion[]>({
    queryKey: ['library', search, difficulty, tag],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (difficulty) params.set('difficulty', difficulty);
      if (tag) params.set('tag', tag);
      return (await api.get(`/api/library?${params.toString()}`)).data;
    },
  });
}

export async function seedLibrary() {
  return (await api.post('/api/library/seed')).data;
}
