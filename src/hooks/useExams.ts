import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';

export interface TestCase {
  input: string;
  expected: string;
}

export interface ExamQuestion {
  id: string;
  title: string;
  description: string;
  difficulty: 'easy' | 'medium' | 'hard';
  language: string;
  starter_code: string;
  points: number;
  position: number;
  input_format?: string;
  output_format?: string;
  constraints?: string;
  sample_test_cases?: TestCase[];
  hidden_test_cases?: TestCase[];
  supported_languages?: string[];
  tags?: string[];
}

export interface Exam {
  id: string;
  classroom_id: string;
  owner_id: string;
  title: string;
  duration_minutes: number;
  created_at: string;
  questions?: ExamQuestion[];
}

export function useClassroomExams(classroomId?: string) {
  return useQuery<Exam[]>({
    queryKey: ['exams', classroomId],
    enabled: !!classroomId,
    queryFn: async () => (await api.get(`/api/exams/classroom/${classroomId}`)).data,
  });
}

export function useExam(id?: string) {
  return useQuery<Exam>({
    queryKey: ['exam', id],
    enabled: !!id,
    queryFn: async () => (await api.get(`/api/exams/${id}`)).data,
  });
}

export interface ExamResults {
  exam: Exam;
  questions: ExamQuestion[];
  total_points: number;
  students: {
    user_id: string;
    name: string;
    email: string;
    submitted_count: number;
    total_score: number;
    flagged: boolean;
    submissions: Record<
      string,
      { status: string; score: number; flagged: boolean; flag_reason?: string }
    >;
  }[];
}

export function useExamResults(id?: string) {
  return useQuery<ExamResults>({
    queryKey: ['exam-results', id],
    enabled: !!id,
    refetchInterval: 5000, // live results
    queryFn: async () => (await api.get(`/api/exams/${id}/results`)).data,
  });
}
