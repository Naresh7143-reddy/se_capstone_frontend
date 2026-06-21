import { useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import Editor from '@monaco-editor/react';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Play,
  Send,
  ShieldAlert,
  Clock,
  CheckCircle2,
} from 'lucide-react';
import api from '@/lib/api';
import { useExam } from '@/hooks/useExams';
import { useTheme } from '@/store/theme';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { FullPageSpinner } from '@/components/ui/Spinner';

const monacoLang: Record<string, string> = {
  python: 'python', javascript: 'javascript', java: 'java', cpp: 'cpp', c: 'c',
};

export default function TakeExam() {
  const { id } = useParams();
  const theme = useTheme((s) => s.theme);
  const { data: exam, isLoading } = useExam(id);

  const [active, setActive] = useState(0);
  const [codes, setCodes] = useState<Record<string, string>>({});
  const [results, setResults] = useState<Record<string, any>>({});
  const [submitted, setSubmitted] = useState<Record<string, boolean>>({});
  const [running, setRunning] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState<number | null>(null);

  // Proctoring counters
  const pasteCounts = useRef<Record<string, number>>({});
  const [blurCount, setBlurCount] = useState(0);
  const [warning, setWarning] = useState('');

  const questions = exam?.questions || [];
  const q = questions[active];

  // Timer
  useEffect(() => {
    if (!exam) return;
    setSecondsLeft(exam.duration_minutes * 60);
  }, [exam]);

  useEffect(() => {
    if (secondsLeft === null) return;
    if (secondsLeft <= 0) return;
    const t = setInterval(() => setSecondsLeft((s) => (s !== null ? s - 1 : s)), 1000);
    return () => clearInterval(t);
  }, [secondsLeft]);

  // Proctoring: detect tab/window switching
  useEffect(() => {
    const onHide = () => {
      if (document.hidden) {
        setBlurCount((c) => c + 1);
        setWarning('⚠️ You left the exam tab — this is recorded.');
        setTimeout(() => setWarning(''), 4000);
      }
    };
    const onBlur = () => {
      setBlurCount((c) => c + 1);
    };
    document.addEventListener('visibilitychange', onHide);
    window.addEventListener('blur', onBlur);
    return () => {
      document.removeEventListener('visibilitychange', onHide);
      window.removeEventListener('blur', onBlur);
    };
  }, []);

  if (isLoading) return <FullPageSpinner />;
  if (!exam || !q) {
    return (
      <div className="grid min-h-screen place-items-center">
        <p className="text-muted">Exam not found.</p>
      </div>
    );
  }

  const code = codes[q.id] ?? q.starter_code ?? '';
  const setCode = (v: string) => setCodes((c) => ({ ...c, [q.id]: v }));

  const runCode = async () => {
    setRunning(true);
    try {
      const res = await api.post('/api/run', { code, language: q.language });
      setResults((r) => ({ ...r, [q.id]: res.data }));
    } catch (e: any) {
      setResults((r) => ({ ...r, [q.id]: { status: 'Error', output: e?.message } }));
    } finally {
      setRunning(false);
    }
  };

  const submit = async () => {
    setSubmitting(true);
    const pasteCount = pasteCounts.current[q.id] || 0;
    const flagged = pasteCount > 0 || blurCount > 0;
    const flag_reason = flagged
      ? [pasteCount > 0 ? 'paste detected' : '', blurCount > 0 ? 'left exam tab' : '']
          .filter(Boolean)
          .join(' + ')
      : '';
    try {
      const res = await api.post(`/api/exams/${id}/submit`, {
        question_id: q.id,
        code,
        language: q.language,
        paste_count: pasteCount,
        blur_count: blurCount,
        flagged,
        flag_reason,
      });
      setResults((r) => ({ ...r, [q.id]: { ...res.data.data, _submit: true } }));
      setSubmitted((s) => ({ ...s, [q.id]: true }));
    } catch (e: any) {
      setWarning(e?.response?.data?.error || 'Submit failed');
    } finally {
      setSubmitting(false);
    }
  };

  const fmt = (s: number) =>
    `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;
  const result = results[q.id];

  return (
    <div className="flex h-screen flex-col bg-bg">
      {/* Header */}
      <header className="flex items-center justify-between gap-4 border-b border-border px-4 py-3">
        <div className="flex items-center gap-3">
          <Link to="/dashboard/exams">
            <Button size="sm" variant="ghost"><ArrowLeft size={16} /></Button>
          </Link>
          <div>
            <h1 className="font-bold">{exam.title}</h1>
            <p className="text-xs text-muted">
              Question {active + 1} of {questions.length}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5 text-sm">
            <ShieldAlert size={15} className={blurCount > 0 ? 'text-red-500' : 'text-green-500'} />
            <span className={blurCount > 0 ? 'text-red-500' : 'text-muted'}>
              Proctored {blurCount > 0 && `· ${blurCount} alert(s)`}
            </span>
          </div>
          {secondsLeft !== null && (
            <div className={`flex items-center gap-1.5 font-mono text-sm ${secondsLeft < 60 ? 'text-red-500' : ''}`}>
              <Clock size={15} /> {fmt(Math.max(0, secondsLeft))}
            </div>
          )}
        </div>
      </header>

      {warning && (
        <motion.div
          initial={{ y: -10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="bg-red-500/10 px-4 py-2 text-center text-sm text-red-500"
        >
          {warning}
        </motion.div>
      )}

      <div className="grid flex-1 grid-cols-1 overflow-hidden lg:grid-cols-[300px_1fr]">
        {/* Question list + prompt */}
        <div className="overflow-auto border-r border-border p-4">
          <div className="mb-4 flex flex-wrap gap-2">
            {questions.map((qq, i) => (
              <button
                key={qq.id}
                onClick={() => setActive(i)}
                className={`grid h-9 w-9 place-items-center rounded-lg text-sm font-semibold ${
                  i === active
                    ? 'bg-primary text-primary-fg'
                    : submitted[qq.id]
                    ? 'bg-green-500/20 text-green-500'
                    : 'border border-border text-muted'
                }`}
              >
                {i + 1}
              </button>
            ))}
          </div>
          <h2 className="text-lg font-bold">{q.title}</h2>
          <div className="mt-1 flex items-center gap-2 text-xs">
            <span className={`rounded-full px-2 py-0.5 ${
              q.difficulty === 'hard' ? 'bg-red-500/15 text-red-500'
              : q.difficulty === 'medium' ? 'bg-yellow-500/15 text-yellow-500'
              : 'bg-green-500/15 text-green-500'
            }`}>{q.difficulty}</span>
            <span className="text-muted">{q.points} pts · {q.language}</span>
          </div>
          <p className="mt-4 whitespace-pre-wrap text-sm text-muted">{q.description}</p>
          {submitted[q.id] && (
            <p className="mt-4 flex items-center gap-1.5 text-sm text-green-500">
              <CheckCircle2 size={15} /> Submitted
            </p>
          )}
        </div>

        {/* Editor + run/submit */}
        <div className="flex flex-col overflow-hidden">
          <div className="flex-1 overflow-hidden">
            <Editor
              height="100%"
              language={monacoLang[q.language] || 'plaintext'}
              value={code}
              theme={theme === 'dark' ? 'vs-dark' : 'light'}
              onChange={(v) => setCode(v ?? '')}
              onMount={(editor) => {
                // Proctoring: count paste events in this question's editor.
                editor.onDidPaste(() => {
                  pasteCounts.current[q.id] = (pasteCounts.current[q.id] || 0) + 1;
                  setWarning('⚠️ Paste detected — this submission will be flagged.');
                  setTimeout(() => setWarning(''), 4000);
                });
              }}
              options={{
                fontSize: 14,
                minimap: { enabled: false },
                automaticLayout: true,
                scrollBeyondLastLine: false,
                padding: { top: 12 },
              }}
            />
          </div>

          <div className="border-t border-border">
            <div className="flex items-center justify-between gap-2 px-4 py-2">
              <div className="text-xs text-muted">
                {result && result.status && <>Status: <span className="font-semibold">{result.status}</span></>}
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={runCode} disabled={running}>
                  {running ? <Spinner className="h-4 w-4" /> : <><Play size={15} /> Run</>}
                </Button>
                <Button size="sm" onClick={submit} disabled={submitting}>
                  {submitting ? <Spinner className="h-4 w-4" /> : <><Send size={15} /> Submit</>}
                </Button>
              </div>
            </div>
            <pre className="h-28 overflow-auto bg-surface/40 px-4 py-2 font-mono text-sm">
              {result ? (result.output || result.stderr || result.compile_output || '(no output)') : '— Run to see output —'}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}
