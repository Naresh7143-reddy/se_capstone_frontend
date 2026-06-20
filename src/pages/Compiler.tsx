import { useState } from 'react';
import { motion } from 'framer-motion';
import { Play, Trash2 } from 'lucide-react';
import { Navbar } from '@/components/Navbar';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { CodeEditor } from '@/components/CodeEditor';
import api from '@/lib/api';

const STARTERS: Record<string, string> = {
  python: 'print("Hello, world!")\n',
  javascript: 'console.log("Hello, world!");\n',
  java: `public class Main {
  public static void main(String[] args) {
    System.out.println("Hello, world!");
  }
}\n`,
  cpp: `#include <iostream>
using namespace std;
int main() {
  cout << "Hello, world!" << endl;
  return 0;
}\n`,
  c: `#include <stdio.h>
int main() {
  printf("Hello, world!\\n");
  return 0;
}\n`,
};

const LANGUAGES = [
  { id: 'python', label: 'Python' },
  { id: 'javascript', label: 'JavaScript' },
  { id: 'java', label: 'Java' },
  { id: 'cpp', label: 'C++' },
  { id: 'c', label: 'C' },
];

interface RunResult {
  status: string;
  output: string;
  stderr: string;
  compile_output: string;
}

export default function Compiler() {
  const [language, setLanguage] = useState('python');
  const [code, setCode] = useState(STARTERS.python);
  const [input, setInput] = useState('');
  const [result, setResult] = useState<RunResult | null>(null);
  const [running, setRunning] = useState(false);

  const changeLanguage = (lang: string) => {
    setLanguage(lang);
    // Only reset to starter if the user hasn't customized much.
    if (Object.values(STARTERS).includes(code) || code.trim() === '') {
      setCode(STARTERS[lang]);
    }
  };

  const run = async () => {
    setRunning(true);
    setResult(null);
    try {
      const res = await api.post('/api/run', { code, language, input });
      setResult(res.data);
    } catch (e: any) {
      setResult({
        status: 'Error',
        output: '',
        stderr: e?.response?.data?.error || e?.message || 'Run failed',
        compile_output: '',
      });
    } finally {
      setRunning(false);
    }
  };

  const outputText =
    result &&
    (result.output ||
      result.stderr ||
      result.compile_output ||
      '(no output)');

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="mx-auto max-w-7xl px-4 py-8">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold">Online Compiler</h1>
            <p className="text-sm text-muted">
              Write code in 5 languages and run it instantly.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <select
              value={language}
              onChange={(e) => changeLanguage(e.target.value)}
              className="h-11 rounded-xl border border-border bg-surface px-4 text-sm"
            >
              {LANGUAGES.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.label}
                </option>
              ))}
            </select>
            <Button onClick={run} disabled={running}>
              {running ? <Spinner className="h-4 w-4" /> : <><Play size={16} /> Run</>}
            </Button>
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-[1.6fr_1fr]">
          {/* Editor */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="h-[560px] overflow-hidden rounded-2xl border border-border bg-surface/40"
          >
            <CodeEditor value={code} language={language} onChange={setCode} />
          </motion.div>

          {/* I/O */}
          <div className="flex flex-col gap-4">
            <div className="rounded-2xl border border-border bg-surface/40 p-4">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-sm font-semibold">Input (stdin)</span>
                <button
                  onClick={() => setInput('')}
                  className="text-muted hover:text-fg"
                  aria-label="Clear input"
                >
                  <Trash2 size={15} />
                </button>
              </div>
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Optional input passed to your program…"
                className="h-28 w-full resize-none rounded-lg border border-border bg-bg p-3 font-mono text-sm outline-none focus:ring-2 focus:ring-primary/40"
              />
            </div>

            <div className="flex-1 rounded-2xl border border-border bg-surface/40 p-4">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-sm font-semibold">Output</span>
                {result && (
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs ${
                      result.status === 'Accepted'
                        ? 'bg-green-500/15 text-green-500'
                        : 'bg-red-500/15 text-red-500'
                    }`}
                  >
                    {result.status}
                  </span>
                )}
              </div>
              <pre className="h-[300px] overflow-auto whitespace-pre-wrap rounded-lg bg-bg p-3 font-mono text-sm">
                {running ? 'Running…' : outputText || '— Run your code to see output —'}
              </pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
