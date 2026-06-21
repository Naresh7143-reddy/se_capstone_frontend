import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  Play,
  GitCommit,
  GitMerge,
  Check,
  X,
  Crown,
  DownloadCloud,
  History,
  Users,
  MessageSquare,
  Eye,
} from 'lucide-react';
import { getSocket } from '@/lib/socket';
import api from '@/lib/api';
import { useAuth } from '@/store/auth';
import { useClassrooms } from '@/hooks/useClassrooms';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { CodeEditor } from '@/components/CodeEditor';
import { CodeDiff } from '@/components/CodeDiff';
import { VideoCall } from '@/components/VideoCall';
import { Video } from 'lucide-react';

interface Member {
  user_id: string;
  user_name: string;
  is_owner: boolean;
}
interface Proposal {
  id: string;
  author_id: string;
  author_name: string;
  message: string;
  code: string;
  language: string;
  base_version: number;
  created_at: string;
}
interface Commit {
  id: string;
  author_name: string;
  message: string;
  version: number;
  timestamp: string;
}
interface ChatMessage {
  user_name: string;
  message: string;
  timestamp: string;
}

type Tab = 'proposals' | 'history' | 'members' | 'chat';

export default function Room() {
  const { id: roomId } = useParams();
  const user = useAuth((s) => s.user);
  const userName = user?.displayName || user?.email || 'Anonymous';

  const { data: classrooms } = useClassrooms();
  const classroom = useMemo(
    () => classrooms?.find((c) => c.id === roomId),
    [classrooms, roomId]
  );
  const isOwner = !!classroom && classroom.instructor_id === user?.uid;

  // Git state
  const [mainCode, setMainCode] = useState('');
  const [language, setLanguage] = useState('python');
  const [version, setVersion] = useState(0);
  const [history, setHistory] = useState<Commit[]>([]);
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [members, setMembers] = useState<Member[]>([]);

  // Working copy
  const [workingCode, setWorkingCode] = useState('');
  const initialized = useRef(false);

  // UI
  const [tab, setTab] = useState<Tab>('proposals');
  const [commitMsg, setCommitMsg] = useState('');
  const [showCommit, setShowCommit] = useState(false);
  const [reviewing, setReviewing] = useState<Proposal | null>(null);
  const [output, setOutput] = useState('');
  const [running, setRunning] = useState(false);
  const [toast, setToast] = useState('');
  const [connected, setConnected] = useState(false);
  const [inCall, setInCall] = useState(false);

  // Chat
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');

  const socketRef = useRef(getSocket());

  useEffect(() => {
    const socket = socketRef.current;

    const join = () => {
      setConnected(true);
      socket.emit('room:join', {
        room_id: roomId,
        user_id: user?.uid,
        user_name: userName,
        is_owner: isOwner,
      });
    };

    socket.on('connect', join);
    if (socket.connected) join();

    socket.on('room:state', (s: any) => {
      setMainCode(s.mainCode);
      setLanguage(s.language || 'python');
      setVersion(s.version);
      setHistory(s.history || []);
      setProposals(s.proposals || []);
      setMembers(s.members || []);
      if (!initialized.current) {
        setWorkingCode(s.mainCode);
        initialized.current = true;
      }
    });
    socket.on('room:members', (m: Member[]) => setMembers(m || []));
    socket.on('room:proposals', (p: Proposal[]) => setProposals(p || []));
    socket.on('room:merged', (d: any) => {
      setMainCode(d.mainCode);
      setLanguage(d.language || 'python');
      setVersion(d.version);
      setHistory(d.history || []);
      if (d.merged) {
        setToast(`Merged v${d.merged.version}: "${d.merged.message}" by ${d.merged.author_name}`);
        setTimeout(() => setToast(''), 5000);
      }
    });
    socket.on('receive_message', (m: ChatMessage) =>
      setMessages((prev) => [...prev, m])
    );

    return () => {
      socket.off('connect', join);
      socket.off('room:state');
      socket.off('room:members');
      socket.off('room:proposals');
      socket.off('room:merged');
      socket.off('receive_message');
    };
  }, [roomId, user?.uid, userName, isOwner]);

  const propose = () => {
    socketRef.current.emit('room:propose', {
      room_id: roomId,
      message: commitMsg || 'Update',
      code: workingCode,
      language,
    });
    setCommitMsg('');
    setShowCommit(false);
    setToast('Commit proposed — waiting for owner approval.');
    setTimeout(() => setToast(''), 4000);
    setTab('proposals');
  };

  const approve = (id: string) => {
    socketRef.current.emit('room:approve', { room_id: roomId, proposal_id: id });
    setReviewing(null);
  };
  const reject = (id: string) => {
    socketRef.current.emit('room:reject', { room_id: roomId, proposal_id: id });
    setReviewing(null);
  };

  const pullLatest = () => {
    setWorkingCode(mainCode);
    setToast(`Pulled main v${version} into your editor.`);
    setTimeout(() => setToast(''), 3000);
  };

  const runCode = async () => {
    setRunning(true);
    setOutput('Running…');
    try {
      const res = await api.post('/api/run', { code: workingCode, language });
      const r = res.data;
      setOutput(`${r.status}\n\n${r.output || r.stderr || r.compile_output || ''}`);
    } catch (e: any) {
      setOutput(e?.response?.data?.error || e?.message || 'Run failed');
    } finally {
      setRunning(false);
    }
  };

  const sendMessage = () => {
    if (!chatInput.trim()) return;
    socketRef.current.emit('send_message', {
      room_id: roomId,
      user_name: userName,
      message: chatInput,
    });
    setChatInput('');
  };

  const dirty = workingCode !== mainCode;

  return (
    <div className="flex h-screen flex-col bg-bg">
      {/* Top bar */}
      <header className="flex items-center justify-between gap-4 border-b border-border px-4 py-3">
        <div className="flex items-center gap-3">
          <Link to="/dashboard/classrooms">
            <Button size="sm" variant="ghost"><ArrowLeft size={16} /></Button>
          </Link>
          <div>
            <h1 className="flex items-center gap-2 font-bold">
              {classroom?.name || 'Room'}
              {isOwner && (
                <span className="inline-flex items-center gap-1 rounded-full bg-yellow-500/15 px-2 py-0.5 text-xs text-yellow-500">
                  <Crown size={12} /> Owner
                </span>
              )}
            </h1>
            <p className="text-xs text-muted">
              {connected ? <span className="text-green-500">● Live</span> : <span className="text-yellow-500">● Connecting…</span>}
              {' '}· <span className="font-mono">main</span> @ v{version} · {members.length} online
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="h-9 rounded-lg border border-border bg-surface px-3 text-sm"
          >
            {['python', 'javascript', 'java', 'cpp', 'c'].map((l) => (
              <option key={l} value={l}>{l}</option>
            ))}
          </select>
          <Button size="sm" variant="outline" onClick={pullLatest} title="Reset your editor to main">
            <DownloadCloud size={16} /> Pull
          </Button>
          <Button size="sm" variant="outline" onClick={runCode} disabled={running}>
            {running ? <Spinner className="h-4 w-4" /> : <><Play size={16} /> Run</>}
          </Button>
          <Button size="sm" onClick={() => setShowCommit((s) => !s)}>
            <GitCommit size={16} /> Propose commit
          </Button>
          <Button
            size="sm"
            variant={inCall ? 'primary' : 'outline'}
            onClick={() => setInCall((c) => !c)}
          >
            <Video size={16} /> {inCall ? 'Leave call' : 'Join call'}
          </Button>
          <ThemeToggle />
        </div>
      </header>

      {/* Commit bar */}
      <AnimatePresence>
        {showCommit && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden border-b border-border bg-surface/40"
          >
            <div className="flex items-center gap-2 px-4 py-3">
              <GitCommit size={16} className="text-primary" />
              <input
                value={commitMsg}
                onChange={(e) => setCommitMsg(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && propose()}
                placeholder="Commit message (e.g. 'fix loop bug')"
                className="h-10 flex-1 rounded-lg border border-border bg-bg px-3 text-sm outline-none focus:ring-2 focus:ring-primary/40"
              />
              <Button size="sm" onClick={propose}>Propose</Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Video call bar */}
      <AnimatePresence>
        {inCall && roomId && (
          <VideoCall roomId={roomId} userName={userName} onLeave={() => setInCall(false)} />
        )}
      </AnimatePresence>

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ y: -10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute left-1/2 top-20 z-50 -translate-x-1/2 rounded-xl glass px-4 py-2 text-sm shadow-lg"
          >
            {toast}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Body */}
      <div className="grid flex-1 grid-cols-1 overflow-hidden lg:grid-cols-[1fr_360px]">
        {/* Editor + output */}
        <div className="flex flex-col overflow-hidden border-r border-border">
          <div className="flex items-center justify-between border-b border-border px-4 py-1.5 text-xs text-muted">
            <span>your working copy {dirty && <span className="text-yellow-500">• modified</span>}</span>
            <span>diff from main: {dirty ? 'changed' : 'in sync'}</span>
          </div>
          <div className="flex-1 overflow-hidden">
            <CodeEditor value={workingCode} language={language} onChange={setWorkingCode} />
          </div>
          <div className="h-40 overflow-auto border-t border-border bg-surface/40 p-4">
            <p className="mb-2 text-xs font-semibold uppercase text-muted">Output</p>
            <pre className="whitespace-pre-wrap font-mono text-sm">{output || '—'}</pre>
          </div>
        </div>

        {/* Sidebar */}
        <div className="flex flex-col overflow-hidden">
          {/* Tabs */}
          <div className="flex border-b border-border text-sm">
            {([
              ['proposals', `PRs (${proposals.length})`, GitMerge],
              ['history', 'History', History],
              ['members', 'People', Users],
              ['chat', 'Chat', MessageSquare],
            ] as [Tab, string, any][]).map(([key, label, Icon]) => (
              <button
                key={key}
                onClick={() => setTab(key)}
                className={`flex flex-1 items-center justify-center gap-1.5 py-3 ${
                  tab === key ? 'border-b-2 border-primary text-fg' : 'text-muted'
                }`}
              >
                <Icon size={15} /> {label}
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-auto p-4">
            {tab === 'proposals' && (
              <div className="space-y-3">
                {proposals.length === 0 && (
                  <p className="text-sm text-muted">No open proposals. Edit code and click “Propose commit”.</p>
                )}
                {proposals.map((p) => (
                  <div key={p.id} className="rounded-xl border border-border p-3">
                    <div className="flex items-center gap-2 text-sm font-semibold">
                      <GitCommit size={14} className="text-primary" />
                      {p.message}
                    </div>
                    <p className="mt-1 text-xs text-muted">
                      by {p.author_name} · base v{p.base_version}
                    </p>
                    <div className="mt-3 flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => setReviewing(p)}>
                        <Eye size={14} /> Review
                      </Button>
                      {isOwner && (
                        <>
                          <Button size="sm" onClick={() => approve(p.id)}>
                            <Check size={14} /> Approve
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => reject(p.id)}>
                            <X size={14} />
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {tab === 'history' && (
              <div className="space-y-3">
                {history.length === 0 && <p className="text-sm text-muted">No commits yet.</p>}
                {history.map((c) => (
                  <div key={c.id} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <span className="grid h-6 w-6 place-items-center rounded-full bg-primary/15 text-primary">
                        <GitCommit size={12} />
                      </span>
                      <span className="my-1 w-px flex-1 bg-border" />
                    </div>
                    <div className="pb-2">
                      <p className="text-sm font-medium">{c.message}</p>
                      <p className="text-xs text-muted">
                        v{c.version} · {c.author_name} · {new Date(c.timestamp).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {tab === 'members' && (
              <div className="space-y-2">
                {members.map((m, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm">
                    <span className="grid h-7 w-7 place-items-center rounded-full bg-primary/15 text-xs font-bold text-primary">
                      {m.user_name?.charAt(0).toUpperCase()}
                    </span>
                    {m.user_name}
                    {m.is_owner && <Crown size={13} className="text-yellow-500" />}
                  </div>
                ))}
              </div>
            )}

            {tab === 'chat' && (
              <div className="flex h-full flex-col">
                <div className="flex-1 space-y-3 overflow-auto">
                  {messages.map((m, i) => (
                    <div key={i} className="text-sm">
                      <span className="font-semibold text-primary">{m.user_name}: </span>
                      {m.message}
                    </div>
                  ))}
                  {!messages.length && <p className="text-xs text-muted">No messages yet.</p>}
                </div>
                <div className="mt-3 flex gap-2">
                  <input
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                    placeholder="Message…"
                    className="h-10 flex-1 rounded-lg border border-border bg-bg px-3 text-sm outline-none focus:ring-2 focus:ring-primary/40"
                  />
                  <Button size="sm" onClick={sendMessage}>Send</Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Review / diff modal */}
      <AnimatePresence>
        {reviewing && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4"
            onClick={() => setReviewing(null)}
          >
            <motion.div
              initial={{ scale: 0.96, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.96, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="flex h-[80vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl border border-border bg-surface"
            >
              <div className="flex items-center justify-between border-b border-border px-5 py-3">
                <div>
                  <h3 className="flex items-center gap-2 font-bold">
                    <GitMerge size={16} className="text-primary" /> {reviewing.message}
                  </h3>
                  <p className="text-xs text-muted">
                    by {reviewing.author_name} · diff: main v{version} → proposed
                  </p>
                </div>
                <button onClick={() => setReviewing(null)} className="text-muted hover:text-fg">
                  <X size={20} />
                </button>
              </div>
              <div className="flex-1 overflow-hidden">
                <CodeDiff original={mainCode} modified={reviewing.code} language={reviewing.language} />
              </div>
              {isOwner && (
                <div className="flex justify-end gap-2 border-t border-border px-5 py-3">
                  <Button variant="ghost" onClick={() => reject(reviewing.id)}>
                    <X size={16} /> Reject
                  </Button>
                  <Button onClick={() => approve(reviewing.id)}>
                    <Check size={16} /> Approve & merge
                  </Button>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
