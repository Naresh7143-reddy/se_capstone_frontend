import { useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Plus, Trash2, Save, Library } from 'lucide-react';
import api from '@/lib/api';
import { useClassrooms } from '@/hooks/useClassrooms';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Spinner } from '@/components/ui/Spinner';
import { LibraryPicker } from '@/components/LibraryPicker';
import type { LibraryQuestion } from '@/hooks/useLibrary';

interface TC { input: string; expected: string }
interface QDraft {
  title: string;
  description: string;
  input_format: string;
  output_format: string;
  constraints: string;
  difficulty: 'easy' | 'medium' | 'hard';
  supported_languages: string[];
  points: number;
  sample_test_cases: TC[];
  hidden_test_cases: TC[];
  reference_solution: string;
}

const ALL_LANGS = ['python', 'java', 'cpp'];
const emptyQ = (): QDraft => ({
  title: '', description: '', input_format: '', output_format: '', constraints: '',
  difficulty: 'easy', supported_languages: ['python', 'java', 'cpp'], points: 10,
  sample_test_cases: [{ input: '', expected: '' }],
  hidden_test_cases: [{ input: '', expected: '' }],
  reference_solution: '',
});

const fromLibrary = (q: LibraryQuestion): QDraft => ({
  title: q.title,
  description: q.problem_statement,
  input_format: q.input_format || '',
  output_format: q.output_format || '',
  constraints: q.constraints || '',
  difficulty: q.difficulty,
  supported_languages: ['python', 'java', 'cpp'],
  points: q.default_points || 10,
  sample_test_cases: q.sample_test_cases?.length ? q.sample_test_cases : [{ input: '', expected: '' }],
  hidden_test_cases: q.hidden_test_cases?.length ? q.hidden_test_cases : [{ input: '', expected: '' }],
  reference_solution: '',
});

function Textarea({ label, value, onChange, placeholder, rows = 3 }: any) {
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium">{label}</label>
      <textarea
        value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} rows={rows}
        className="w-full resize-none rounded-xl border border-border bg-bg p-3 text-sm outline-none focus:ring-2 focus:ring-primary/40"
      />
    </div>
  );
}

function TestCaseEditor({ label, cases, onChange }: { label: string; cases: TC[]; onChange: (c: TC[]) => void }) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium">{label}</label>
        <button onClick={() => onChange([...cases, { input: '', expected: '' }])} className="text-xs text-primary">+ add</button>
      </div>
      {cases.map((tc, i) => (
        <div key={i} className="flex gap-2">
          <textarea value={tc.input} onChange={(e) => onChange(cases.map((c, idx) => idx === i ? { ...c, input: e.target.value } : c))}
            placeholder="stdin" rows={2} className="flex-1 resize-none rounded-lg border border-border bg-bg p-2 font-mono text-xs outline-none" />
          <textarea value={tc.expected} onChange={(e) => onChange(cases.map((c, idx) => idx === i ? { ...c, expected: e.target.value } : c))}
            placeholder="expected output" rows={2} className="flex-1 resize-none rounded-lg border border-border bg-bg p-2 font-mono text-xs outline-none" />
          {cases.length > 1 && (
            <button onClick={() => onChange(cases.filter((_, idx) => idx !== i))} className="text-muted hover:text-red-500"><Trash2 size={14} /></button>
          )}
        </div>
      ))}
    </div>
  );
}

export default function CreateExam() {
  const navigate = useNavigate();
  const { data: classrooms } = useClassrooms();

  const [classroomId, setClassroomId] = useState('');
  const [title, setTitle] = useState('');
  const [duration, setDuration] = useState(60);
  const [questions, setQuestions] = useState<QDraft[]>([emptyQ()]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [showLibrary, setShowLibrary] = useState(false);

  const addFromLibrary = (libs: LibraryQuestion[]) =>
    setQuestions((qs) => {
      const mapped = libs.map(fromLibrary);
      // Drop a single empty starter question if present.
      const base = qs.length === 1 && !qs[0].title ? [] : qs;
      return [...base, ...mapped];
    });

  const update = (i: number, patch: Partial<QDraft>) =>
    setQuestions((qs) => qs.map((q, idx) => (idx === i ? { ...q, ...patch } : q)));

  const toggleLang = (i: number, l: string) => {
    const q = questions[i];
    const has = q.supported_languages.includes(l);
    update(i, { supported_languages: has ? q.supported_languages.filter((x) => x !== l) : [...q.supported_languages, l] });
  };

  const clean = (cs: TC[]) => cs.filter((c) => c.input !== '' || c.expected !== '');

  const save = async () => {
    setError('');
    if (!classroomId) return setError('Pick a classroom.');
    if (!title) return setError('Enter an exam title.');
    if (questions.some((q) => !q.title)) return setError('Every question needs a title.');
    setSaving(true);
    try {
      const payload = {
        classroom_id: classroomId, title, duration_minutes: duration,
        questions: questions.map((q) => ({
          ...q,
          language: q.supported_languages[0] || 'python',
          sample_test_cases: clean(q.sample_test_cases),
          hidden_test_cases: clean(q.hidden_test_cases),
        })),
      };
      const { data } = await api.post('/api/exams', payload);
      navigate(`/exam/${data.data.id}/results`);
    } catch (e: any) {
      setError(e?.response?.data?.error || e?.message || 'Failed to create exam');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold">Create exam</h1>
          <p className="text-sm text-muted">Add from the library or create custom. Hidden tests are used for scoring.</p>
        </div>
        <Button variant="outline" onClick={() => setShowLibrary(true)}>
          <Library size={16} /> Add from Library
        </Button>
      </div>

      <AnimatePresence>
        {showLibrary && (
          <LibraryPicker onClose={() => setShowLibrary(false)} onAdd={addFromLibrary} />
        )}
      </AnimatePresence>

      <Card className="space-y-4">
        <div className="space-y-1.5">
          <label className="text-sm font-medium">Classroom</label>
          <select value={classroomId} onChange={(e) => setClassroomId(e.target.value)}
            className="h-11 w-full rounded-xl border border-border bg-bg px-4 text-sm">
            <option value="">Select a classroom…</option>
            {(classrooms || []).map((c) => <option key={c.id} value={c.id}>{c.name} ({c.code})</option>)}
          </select>
        </div>
        <Input label="Exam title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Midterm — Arrays & Strings" />
        <Input label="Duration (minutes)" type="number" value={duration} onChange={(e) => setDuration(Number(e.target.value))} />
      </Card>

      {questions.map((q, i) => (
        <Card key={i} className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-bold">Question {i + 1}</h3>
            {questions.length > 1 && (
              <button onClick={() => setQuestions((qs) => qs.filter((_, idx) => idx !== i))} className="text-muted hover:text-red-500"><Trash2 size={16} /></button>
            )}
          </div>
          <Input label="Title" value={q.title} onChange={(e) => update(i, { title: e.target.value })} placeholder="Two Sum" />
          <Textarea label="Problem statement" value={q.description} onChange={(v: string) => update(i, { description: v })} placeholder="Describe the problem…" rows={4} />
          <div className="grid gap-3 sm:grid-cols-2">
            <Textarea label="Input format" value={q.input_format} onChange={(v: string) => update(i, { input_format: v })} rows={2} />
            <Textarea label="Output format" value={q.output_format} onChange={(v: string) => update(i, { output_format: v })} rows={2} />
          </div>
          <Textarea label="Constraints" value={q.constraints} onChange={(v: string) => update(i, { constraints: v })} rows={2} />

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Difficulty</label>
              <select value={q.difficulty} onChange={(e) => update(i, { difficulty: e.target.value as QDraft['difficulty'] })}
                className="h-11 w-full rounded-xl border border-border bg-bg px-3 text-sm">
                <option value="easy">Easy</option><option value="medium">Medium</option><option value="hard">Hard</option>
              </select>
            </div>
            <Input label="Points" type="number" value={q.points} onChange={(e) => update(i, { points: Number(e.target.value) })} />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium">Supported languages</label>
            <div className="flex gap-2">
              {ALL_LANGS.map((l) => (
                <button key={l} onClick={() => toggleLang(i, l)}
                  className={`rounded-lg px-3 py-1.5 text-xs ${q.supported_languages.includes(l) ? 'bg-primary text-primary-fg' : 'border border-border text-muted'}`}>
                  {l}
                </button>
              ))}
            </div>
          </div>

          <TestCaseEditor label="Sample test cases (shown to students)" cases={q.sample_test_cases} onChange={(c) => update(i, { sample_test_cases: c })} />
          <TestCaseEditor label="Hidden test cases (used for scoring)" cases={q.hidden_test_cases} onChange={(c) => update(i, { hidden_test_cases: c })} />
          <Textarea label="Reference solution (optional, faculty only)" value={q.reference_solution} onChange={(v: string) => update(i, { reference_solution: v })} placeholder="Model answer — never shown to students" rows={3} />
        </Card>
      ))}

      {error && <p className="text-sm text-red-500">{error}</p>}

      <div className="flex items-center justify-between">
        <Button variant="outline" onClick={() => setQuestions((qs) => [...qs, emptyQ()])}><Plus size={16} /> Add question</Button>
        <Button onClick={save} disabled={saving}>{saving ? <Spinner className="h-4 w-4" /> : <><Save size={16} /> Create exam</>}</Button>
      </div>
    </div>
  );
}
