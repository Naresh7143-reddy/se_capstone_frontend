import { useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import Editor from '@monaco-editor/react';
import { motion } from 'framer-motion';
import {
  ArrowLeft, Play, Send, ShieldAlert, Clock, CheckCircle2, XCircle, Sparkles,
} from 'lucide-react';
import api from '@/lib/api';
import { useExam } from '@/hooks/useExams';
import { useTheme } from '@/store/theme';
import { Button } from '@/components/ui/Button';
import { Spinner, FullPageSpinner } from '@/components/ui/Spinner';

const monacoLang: Record<string, string> = {
  python: 'python', java: 'java', cpp: 'cpp', javascript: 'javascript', c: 'c',
};
const LANG_LABEL: Record<string, string> = {
  python: 'Python', java: 'Java', cpp: 'C++', javascript: 'JavaScript', c: 'C',
};
const STARTER: Record<string, string> = {
  python: '# Write your solution\n',
  java: 'public class Main {\n    public static void main(String[] args) {\n        // Write your solution\n    }\n}\n',
  cpp: '#include <bits/stdc++.h>\nusing namespace std;\n\nint main() {\n    // Write your solution\n    return 0;\n}\n',
  javascript: '// Write your solution\n',
  c: '#include <stdio.h>\n\nint main() {\n    // Write your solution\n    return 0;\n}\n',
};

export default function TakeExam() {
  const { id } = useParams();
  const theme = useTheme((s) => s.theme);
  const { data: exam, isLoading } = useExam(id);

  const [active, setActive] = useState(0);
  // Per-language code storage:  key = `${questionId}::${language}`
  const [codes, setCodes] = useState<Record<string, string>>({});
  const [langByQ, setLangByQ] = useState<Record<string, string>>({});
  const [sampleResults, setSampleResults] = useState<Record<string, any>>({});
  const [submitResults, setSubmitResults] = useState<Record<string, any>>({});
  const [aiReview, setAiReview] = useState<Record<string, any>>({});
  const [submitted, setSubmitted] = useState<Record<string, boolean>>({});
  const [running, setRunning] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState<number | null>(null);

  // Proctoring
  const pasteByQ = useRef<Record<string, number>>({});
  const [blurCount, setBlurCount] = useState(0);
  const [warning, setWarning] = useState('');
  const curQidRef = useRef<string>('');

  const questions = exam?.questions || [];
  const q = questions[active];
  const langs = (q?.supported_languages?.length ? q.supported_languages : ['python', 'java', 'cpp']);
  const lang = (q && langByQ[q.id]) || langs[0] || 'python';
  const codeKey = q ? `${q.id}::${lang}` : '';
  const lsKey = q ? `exam:${id}:${q.id}:${lang}` : '';

  useEffect(() => { if (q) curQidRef.current = q.id; }, [q]);

  // Timer
  useEffect(() => { if (exam) setSecondsLeft(exam.duration_minutes * 60); }, [exam]);
  useEffect(() => {
    if (secondsLeft === null || secondsLeft <= 0) return;
    const t = setInterval(() => setSecondsLeft((s) => (s !== null ? s - 1 : s)), 1000);
    return () => clearInterval(t);
  }, [secondsLeft]);

  // Proctoring: tab/window switching
  useEffect(() => {
    const onHide = () => {
      if (document.hidden) {
        setBlurCount((c) => c + 1);
        setWarning('⚠️ You left the exam tab — this is recorded.');
        setTimeout(() => setWarning(''), 4000);
      }
    };
    const onBlur = () => setBlurCount((c) => c + 1);
    document.addEventListener('visibilitychange', onHide);
    window.addEventListener('blur', onBlur);
    return () => {
      document.removeEventListener('visibilitychange', onHide);
      window.removeEventListener('blur', onBlur);
    };
  }, []);

  // Initialise code for the current (question, language) from localStorage or starter.
  useEffect(() => {
    if (!codeKey) return;
    setCodes((prev) => {
      if (prev[codeKey] !== undefined) return prev;
      const saved = localStorage.getItem(lsKey);
      const starter = (q?.starter_code && lang === langs[0]) ? q.starter_code : STARTER[lang] || '';
      return { ...prev, [codeKey]: saved !== null ? saved : starter };
    });
  }, [codeKey, lsKey]); // eslint-disable-line

  if (isLoading) return <FullPageSpinner />;
  if (!exam || !q) {
    return <div className="grid min-h-screen place-items-center"><p className="text-muted">Exam not found.</p></div>;
  }

  const code = codes[codeKey] ?? '';
  const setCode = (v: string) => {
    setCodes((prev) => ({ ...prev, [codeKey]: v }));
    if (lsKey) localStorage.setItem(lsKey, v); // auto-save per language
  };

  const runSamples = async () => {
    setRunning(true);
    try {
      const tests = q.sample_test_cases || [];
      if (tests.length) {
        const res = await api.post('/api/run/tests', { code, language: lang, tests });
        setSampleResults((r) => ({ ...r, [q.id]: res.data }));
      } else {
        const res = await api.post('/api/run', { code, language: lang });
        setSampleResults((r) => ({ ...r, [q.id]: { plain: res.data } }));
      }
    } catch (e: any) {
      setSampleResults((r) => ({ ...r, [q.id]: { error: e?.response?.data?.error || e?.message } }));
    } finally {
      setRunning(false);
    }
  };

  const submit = async () => {
    setSubmitting(true);
    const pasteCount = pasteByQ.current[q.id] || 0;
    const flagged = pasteCount > 0 || blurCount > 0;
    const flag_reason = flagged
      ? [pasteCount > 0 ? 'paste detected' : '', blurCount > 0 ? 'left exam tab' : ''].filter(Boolean).join(' + ')
      : '';
    try {
      const res = await api.post(`/api/exams/${id}/submit`, {
        question_id: q.id, code, language: lang, paste_count: pasteCount, blur_count: blurCount, flagged, flag_reason,
      });
      setSubmitResults((r) => ({ ...r, [q.id]: res.data.data }));
      setSubmitted((s) => ({ ...s, [q.id]: true }));
    } catch (e: any) {
      setWarning(e?.response?.data?.error || 'Submit failed');
    } finally {
      setSubmitting(false);
    }
  };

  const aiEvaluate = async () => {
    setAiLoading(true);
    try {
      const res = await api.post('/api/ai/evaluate', {
        question: { title: q.title, description: q.description, constraints: q.constraints },
        code, language: lang, testResults: submitResults[q.id] || sampleResults[q.id],
      });
      setAiReview((r) => ({ ...r, [q.id]: res.data.review }));
    } catch (e: any) {
      setAiReview((r) => ({ ...r, [q.id]: { error: e?.response?.data?.error || 'AI review unavailable (set GROK_API_KEY).' } }));
    } finally {
      setAiLoading(false);
    }
  };

  const fmt = (s: number) => `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;
  const sr = sampleResults[q.id];
  const subRes = submitResults[q.id];
  const ai = aiReview[q.id];

  return (
    <div className="flex h-screen flex-col bg-bg">
      <header className="flex items-center justify-between gap-4 border-b border-border px-4 py-3">
        <div className="flex items-center gap-3">
          <Link to="/dashboard/exams"><Button size="sm" variant="ghost"><ArrowLeft size={16} /></Button></Link>
          <div>
            <h1 className="font-bold">{exam.title}</h1>
            <p className="text-xs text-muted">Question {active + 1} of {questions.length}</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5 text-sm">
            <ShieldAlert size={15} className={blurCount > 0 ? 'text-red-500' : 'text-green-500'} />
            <span className={blurCount > 0 ? 'text-red-500' : 'text-muted'}>Proctored {blurCount > 0 && `· ${blurCount} alert(s)`}</span>
          </div>
          {secondsLeft !== null && (
            <div className={`flex items-center gap-1.5 font-mono text-sm ${secondsLeft < 60 ? 'text-red-500' : ''}`}>
              <Clock size={15} /> {fmt(Math.max(0, secondsLeft))}
            </div>
          )}
        </div>
      </header>

      {warning && (
        <motion.div initial={{ y: -10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="bg-red-500/10 px-4 py-2 text-center text-sm text-red-500">{warning}</motion.div>
      )}

      <div className="grid flex-1 grid-cols-1 overflow-hidden lg:grid-cols-[320px_1fr]">
        {/* Prompt */}
        <div className="overflow-auto border-r border-border p-4">
          <div className="mb-4 flex flex-wrap gap-2">
            {questions.map((qq, i) => (
              <button key={qq.id} onClick={() => setActive(i)}
                className={`grid h-9 w-9 place-items-center rounded-lg text-sm font-semibold ${
                  i === active ? 'bg-primary text-primary-fg' : submitted[qq.id] ? 'bg-green-500/20 text-green-500' : 'border border-border text-muted'}`}>
                {i + 1}
              </button>
            ))}
          </div>
          <h2 className="text-lg font-bold">{q.title}</h2>
          <div className="mt-1 flex items-center gap-2 text-xs">
            <span className={`rounded-full px-2 py-0.5 ${q.difficulty === 'hard' ? 'bg-red-500/15 text-red-500' : q.difficulty === 'medium' ? 'bg-yellow-500/15 text-yellow-500' : 'bg-green-500/15 text-green-500'}`}>{q.difficulty}</span>
            <span className="text-muted">{q.points} pts</span>
          </div>
          <p className="mt-4 whitespace-pre-wrap text-sm text-muted">{q.description}</p>
          {(q as any).input_format && <Section title="Input format" body={(q as any).input_format} />}
          {(q as any).output_format && <Section title="Output format" body={(q as any).output_format} />}
          {(q as any).constraints && <Section title="Constraints" body={(q as any).constraints} />}
          {!!(q.sample_test_cases?.length) && (
            <div className="mt-4">
              <p className="text-xs font-semibold uppercase text-muted">Examples</p>
              {q.sample_test_cases.map((t: any, i: number) => (
                <div key={i} className="mt-2 rounded-lg border border-border p-2 text-xs">
                  <div><span className="text-muted">Input:</span> <code>{t.input}</code></div>
                  <div><span className="text-muted">Output:</span> <code>{t.expected}</code></div>
                </div>
              ))}
            </div>
          )}
          {submitted[q.id] && <p className="mt-4 flex items-center gap-1.5 text-sm text-green-500"><CheckCircle2 size={15} /> Submitted</p>}
        </div>

        {/* Editor */}
        <div className="flex flex-col overflow-hidden">
          <div className="flex items-center gap-2 border-b border-border px-4 py-2">
            <span className="text-xs text-muted">Language:</span>
            {langs.map((l: string) => (
              <button key={l} onClick={() => setLangByQ((m) => ({ ...m, [q.id]: l }))}
                className={`rounded-lg px-3 py-1 text-xs ${lang === l ? 'bg-primary text-primary-fg' : 'border border-border text-muted'}`}>
                {LANG_LABEL[l] || l}
              </button>
            ))}
            <span className="ml-auto text-xs text-green-500">auto-saved per language</span>
          </div>

          <div className="flex-1 overflow-hidden">
            <Editor
              height="100%"
              language={monacoLang[lang] || 'plaintext'}
              path={codeKey /* separate model per question+language */}
              value={code}
              theme={theme === 'dark' ? 'vs-dark' : 'light'}
              onChange={(v) => setCode(v ?? '')}
              onMount={(editor) => {
                editor.onDidPaste(() => {
                  const qid = curQidRef.current;
                  pasteByQ.current[qid] = (pasteByQ.current[qid] || 0) + 1;
                  setWarning('⚠️ Paste detected — this submission will be flagged.');
                  setTimeout(() => setWarning(''), 4000);
                });
              }}
              options={{ fontSize: 14, minimap: { enabled: false }, automaticLayout: true, scrollBeyondLastLine: false, padding: { top: 12 } }}
            />
          </div>

          <div className="border-t border-border">
            <div className="flex items-center justify-between gap-2 px-4 py-2">
              <div className="text-xs">
                {subRes && (
                  <span className={subRes.flagged ? 'text-red-500' : 'text-green-500'}>
                    Score: {subRes.score}/{q.points}
                    {subRes.tests_total > 0 && ` · ${subRes.tests_passed}/${subRes.tests_total} hidden tests`}
                    {subRes.flagged && ' · FLAGGED'}
                  </span>
                )}
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={runSamples} disabled={running}>
                  {running ? <Spinner className="h-4 w-4" /> : <><Play size={15} /> Run samples</>}
                </Button>
                <Button size="sm" onClick={submit} disabled={submitting}>
                  {submitting ? <Spinner className="h-4 w-4" /> : <><Send size={15} /> Submit</>}
                </Button>
                {submitted[q.id] && (
                  <Button size="sm" variant="ghost" onClick={aiEvaluate} disabled={aiLoading}>
                    {aiLoading ? <Spinner className="h-4 w-4" /> : <><Sparkles size={15} /> AI review</>}
                  </Button>
                )}
              </div>
            </div>

            <div className="h-32 overflow-auto bg-surface/40 px-4 py-2 text-sm">
              {sr?.plain && <pre className="font-mono">{sr.plain.output || sr.plain.stderr || '(no output)'}</pre>}
              {sr?.error && <p className="text-red-500">{sr.error}</p>}
              {sr?.results && (
                <div className="space-y-1">
                  <p className="text-xs text-muted">{sr.passed}/{sr.total} sample tests passed</p>
                  {sr.results.map((r: any, i: number) => (
                    <div key={i} className="flex items-center gap-2 font-mono text-xs">
                      {r.passed ? <CheckCircle2 size={13} className="text-green-500" /> : <XCircle size={13} className="text-red-500" />}
                      <span className="text-muted">in:</span> {r.input || '∅'} <span className="text-muted">exp:</span> {r.expected} <span className="text-muted">got:</span> {r.output}
                    </div>
                  ))}
                </div>
              )}
              {ai && (
                <div className="mt-2 rounded-lg border border-border p-2 text-xs">
                  {ai.error ? <p className="text-red-500">{ai.error}</p> : (
                    <>
                      <p className="font-semibold text-primary">AI Review · Final score: {ai.final_score}</p>
                      <p>Quality: {ai.code_quality_score}/10 · Time: {ai.time_complexity} · Space: {ai.space_complexity}</p>
                      <p className="text-muted">{ai.feedback_summary}</p>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Section({ title, body }: { title: string; body: string }) {
  return (
    <div className="mt-4">
      <p className="text-xs font-semibold uppercase text-muted">{title}</p>
      <p className="mt-1 whitespace-pre-wrap text-sm">{body}</p>
    </div>
  );
}
