import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Trash2, Save } from 'lucide-react';
import api from '@/lib/api';
import { useClassrooms } from '@/hooks/useClassrooms';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Spinner } from '@/components/ui/Spinner';

interface QDraft {
  title: string;
  description: string;
  difficulty: 'easy' | 'medium' | 'hard';
  language: string;
  points: number;
  starter_code: string;
}

const emptyQ = (): QDraft => ({
  title: '',
  description: '',
  difficulty: 'easy',
  language: 'python',
  points: 10,
  starter_code: '',
});

export default function CreateExam() {
  const navigate = useNavigate();
  const { data: classrooms } = useClassrooms();
  const owned = (classrooms || []).filter((c) => true); // owner check is server-side

  const [classroomId, setClassroomId] = useState('');
  const [title, setTitle] = useState('');
  const [duration, setDuration] = useState(60);
  const [questions, setQuestions] = useState<QDraft[]>([emptyQ()]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const update = (i: number, patch: Partial<QDraft>) =>
    setQuestions((qs) => qs.map((q, idx) => (idx === i ? { ...q, ...patch } : q)));

  const save = async () => {
    setError('');
    if (!classroomId) return setError('Pick a classroom.');
    if (!title) return setError('Enter an exam title.');
    if (questions.some((q) => !q.title)) return setError('Every question needs a title.');
    setSaving(true);
    try {
      const { data } = await api.post('/api/exams', {
        classroom_id: classroomId,
        title,
        duration_minutes: duration,
        questions,
      });
      navigate(`/exam/${data.data.id}/results`);
    } catch (e: any) {
      setError(e?.response?.data?.error || e?.message || 'Failed to create exam');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold">Create exam</h1>
        <p className="text-sm text-muted">Add coding questions from basic to hard.</p>
      </div>

      <Card className="space-y-4">
        <div className="space-y-1.5">
          <label className="text-sm font-medium">Classroom</label>
          <select
            value={classroomId}
            onChange={(e) => setClassroomId(e.target.value)}
            className="h-11 w-full rounded-xl border border-border bg-bg px-4 text-sm"
          >
            <option value="">Select a classroom…</option>
            {owned.map((c) => (
              <option key={c.id} value={c.id}>{c.name} ({c.code})</option>
            ))}
          </select>
        </div>
        <Input label="Exam title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Midterm — Arrays & Strings" />
        <Input
          label="Duration (minutes)"
          type="number"
          value={duration}
          onChange={(e) => setDuration(Number(e.target.value))}
        />
      </Card>

      {questions.map((q, i) => (
        <Card key={i} className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-bold">Question {i + 1}</h3>
            {questions.length > 1 && (
              <button
                onClick={() => setQuestions((qs) => qs.filter((_, idx) => idx !== i))}
                className="text-muted hover:text-red-500"
              >
                <Trash2 size={16} />
              </button>
            )}
          </div>
          <Input label="Title" value={q.title} onChange={(e) => update(i, { title: e.target.value })} placeholder="Reverse a string" />
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Description</label>
            <textarea
              value={q.description}
              onChange={(e) => update(i, { description: e.target.value })}
              placeholder="Describe the problem, input/output, constraints…"
              className="h-24 w-full resize-none rounded-xl border border-border bg-bg p-3 text-sm outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Difficulty</label>
              <select
                value={q.difficulty}
                onChange={(e) => update(i, { difficulty: e.target.value as QDraft['difficulty'] })}
                className="h-11 w-full rounded-xl border border-border bg-bg px-3 text-sm"
              >
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Language</label>
              <select
                value={q.language}
                onChange={(e) => update(i, { language: e.target.value })}
                className="h-11 w-full rounded-xl border border-border bg-bg px-3 text-sm"
              >
                {['python', 'javascript', 'java', 'cpp', 'c'].map((l) => (
                  <option key={l} value={l}>{l}</option>
                ))}
              </select>
            </div>
            <Input
              label="Points"
              type="number"
              value={q.points}
              onChange={(e) => update(i, { points: Number(e.target.value) })}
            />
          </div>
        </Card>
      ))}

      {error && <p className="text-sm text-red-500">{error}</p>}

      <div className="flex items-center justify-between">
        <Button variant="outline" onClick={() => setQuestions((qs) => [...qs, emptyQ()])}>
          <Plus size={16} /> Add question
        </Button>
        <Button onClick={save} disabled={saving}>
          {saving ? <Spinner className="h-4 w-4" /> : <><Save size={16} /> Create exam</>}
        </Button>
      </div>
    </div>
  );
}
