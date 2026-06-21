import { useState } from 'react';
import { motion } from 'framer-motion';
import { Search, X, Check, Library, Download } from 'lucide-react';
import { useLibrary, seedLibrary, type LibraryQuestion } from '@/hooks/useLibrary';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';

const TOPICS = ['Arrays', 'Strings', 'Linked Lists', 'Trees', 'Graphs', 'Dynamic Programming', 'Math', 'Hashing', 'Recursion', 'SQL'];

interface Props {
  onClose: () => void;
  onAdd: (questions: LibraryQuestion[]) => void;
}

export function LibraryPicker({ onClose, onAdd }: Props) {
  const [search, setSearch] = useState('');
  const [difficulty, setDifficulty] = useState('');
  const [tag, setTag] = useState('');
  const [selected, setSelected] = useState<Record<string, LibraryQuestion>>({});
  const [seeding, setSeeding] = useState(false);

  const { data, isLoading, refetch } = useLibrary(search, difficulty, tag);

  const toggle = (q: LibraryQuestion) =>
    setSelected((s) => {
      const next = { ...s };
      if (next[q.id]) delete next[q.id];
      else next[q.id] = q;
      return next;
    });

  const doSeed = async () => {
    setSeeding(true);
    try { await seedLibrary(); await refetch(); } finally { setSeeding(false); }
  };

  const count = Object.keys(selected).length;

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4" onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.96, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        onClick={(e) => e.stopPropagation()}
        className="flex h-[82vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-border bg-surface"
      >
        <div className="flex items-center justify-between border-b border-border px-5 py-3">
          <h3 className="flex items-center gap-2 font-bold"><Library size={18} className="text-primary" /> Question Library</h3>
          <button onClick={onClose} className="text-muted hover:text-fg"><X size={20} /></button>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2 border-b border-border p-3">
          <div className="flex flex-1 items-center gap-2 rounded-lg border border-border bg-bg px-3">
            <Search size={15} className="text-muted" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by title…"
              className="h-9 flex-1 bg-transparent text-sm outline-none" />
          </div>
          <select value={difficulty} onChange={(e) => setDifficulty(e.target.value)} className="h-9 rounded-lg border border-border bg-bg px-2 text-sm">
            <option value="">All difficulty</option><option value="easy">Easy</option><option value="medium">Medium</option><option value="hard">Hard</option>
          </select>
          <select value={tag} onChange={(e) => setTag(e.target.value)} className="h-9 rounded-lg border border-border bg-bg px-2 text-sm">
            <option value="">All topics</option>
            {TOPICS.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>

        {/* List */}
        <div className="flex-1 overflow-auto p-3">
          {isLoading ? (
            <div className="grid place-items-center py-10"><Spinner className="h-6 w-6" /></div>
          ) : data && data.length ? (
            <div className="space-y-2">
              {data.map((q) => {
                const on = !!selected[q.id];
                return (
                  <button key={q.id} onClick={() => toggle(q)}
                    className={`flex w-full items-start gap-3 rounded-xl border p-3 text-left transition ${on ? 'border-primary bg-primary/5' : 'border-border hover:bg-bg'}`}>
                    <span className={`mt-0.5 grid h-5 w-5 place-items-center rounded ${on ? 'bg-primary text-primary-fg' : 'border border-border'}`}>
                      {on && <Check size={13} />}
                    </span>
                    <div className="flex-1">
                      <div className="font-semibold">{q.title}</div>
                      <p className="line-clamp-1 text-xs text-muted">{q.problem_statement}</p>
                      <div className="mt-1 flex flex-wrap gap-1">
                        <span className={`rounded-full px-2 py-0.5 text-[10px] ${q.difficulty === 'hard' ? 'bg-red-500/15 text-red-500' : q.difficulty === 'medium' ? 'bg-yellow-500/15 text-yellow-500' : 'bg-green-500/15 text-green-500'}`}>{q.difficulty}</span>
                        {(q.tags || []).map((t) => <span key={t} className="rounded-full bg-border/50 px-2 py-0.5 text-[10px] text-muted">{t}</span>)}
                        <span className="text-[10px] text-muted">· {q.default_points} pts</span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="grid place-items-center gap-3 py-10 text-center">
              <p className="text-sm text-muted">The library is empty.</p>
              <Button variant="outline" size="sm" onClick={doSeed} disabled={seeding}>
                {seeding ? <Spinner className="h-4 w-4" /> : <><Download size={15} /> Load sample library</>}
              </Button>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between border-t border-border px-5 py-3">
          <span className="text-sm text-muted">{count} selected</span>
          <Button disabled={count === 0} onClick={() => { onAdd(Object.values(selected)); onClose(); }}>
            Add {count > 0 ? `${count} ` : ''}question{count === 1 ? '' : 's'}
          </Button>
        </div>
      </motion.div>
    </motion.div>
  );
}
