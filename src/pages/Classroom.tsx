import { useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Play, Send, Users, MessageSquare } from 'lucide-react';
import { getSocket } from '@/lib/socket';
import api from '@/lib/api';
import { useAuth } from '@/store/auth';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Spinner } from '@/components/ui/Spinner';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { CodeEditor } from '@/components/CodeEditor';

interface Participant {
  user_id: string;
  user_name: string;
}
interface ChatMessage {
  user_name: string;
  message: string;
  timestamp: string;
}

const STARTER = `# Write code together — it syncs live to everyone.\nprint("Hello, classroom!")\n`;

export default function Classroom() {
  const { id: classroomId } = useParams();
  const user = useAuth((s) => s.user);
  const userName = user?.displayName || user?.email || 'Anonymous';

  const [code, setCode] = useState(STARTER);
  const [language, setLanguage] = useState('python');
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [output, setOutput] = useState('');
  const [running, setRunning] = useState(false);
  const [connected, setConnected] = useState(false);

  const socketRef = useRef(getSocket());
  const isRemoteUpdate = useRef(false);

  useEffect(() => {
    const socket = socketRef.current;

    const onConnect = () => {
      setConnected(true);
      socket.emit('join_classroom', {
        classroom_id: classroomId,
        user_id: user?.uid,
        user_name: userName,
      });
    };

    socket.on('connect', onConnect);
    if (socket.connected) onConnect();

    socket.on('sync_code', (d: { code: string }) => {
      if (d.code) {
        isRemoteUpdate.current = true;
        setCode(d.code);
      }
    });
    socket.on('code_update', (d: { code: string }) => {
      isRemoteUpdate.current = true;
      setCode(d.code);
    });
    socket.on('user_joined', (d: { participants: Participant[] }) =>
      setParticipants(d.participants || [])
    );
    socket.on('user_left', (d: { participants: Participant[] }) =>
      setParticipants(d.participants || [])
    );
    socket.on('receive_message', (m: ChatMessage) =>
      setMessages((prev) => [...prev, m])
    );

    return () => {
      socket.off('connect', onConnect);
      socket.off('sync_code');
      socket.off('code_update');
      socket.off('user_joined');
      socket.off('user_left');
      socket.off('receive_message');
    };
  }, [classroomId, user?.uid, userName]);

  const handleCodeChange = (value: string) => {
    setCode(value);
    if (isRemoteUpdate.current) {
      isRemoteUpdate.current = false;
      return;
    }
    socketRef.current.emit('code_change', { classroom_id: classroomId, code: value });
  };

  const sendMessage = () => {
    if (!chatInput.trim()) return;
    socketRef.current.emit('send_message', {
      classroom_id: classroomId,
      user_name: userName,
      message: chatInput,
    });
    setChatInput('');
  };

  const runCode = async () => {
    setRunning(true);
    setOutput('Running…');
    try {
      // Uses the submissions endpoint which executes via Judge0 on the backend.
      // (Demo problem id 0 — backend returns execution result regardless.)
      const res = await api.post('/api/submissions', {
        problem_id: classroomId,
        code,
        language,
      });
      const r = res.data?.result;
      setOutput(
        r ? `${r.status}\n\n${r.output || r.stderr || r.compile_output || ''}` : 'Done.'
      );
    } catch (e: any) {
      setOutput(
        'Execution requires a valid problem. ' +
          (e?.response?.data?.error || e?.message || '')
      );
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="flex h-screen flex-col bg-bg">
      {/* Top bar */}
      <header className="flex items-center justify-between gap-4 border-b border-border px-4 py-3">
        <div className="flex items-center gap-3">
          <Link to="/dashboard/classrooms">
            <Button size="sm" variant="ghost"><ArrowLeft size={16} /></Button>
          </Link>
          <div>
            <h1 className="font-bold">Classroom session</h1>
            <p className="text-xs text-muted">
              {connected ? (
                <span className="text-green-500">● Live</span>
              ) : (
                <span className="text-yellow-500">● Connecting…</span>
              )}{' '}
              · {participants.length} online
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
          <Button size="sm" onClick={runCode} disabled={running}>
            {running ? <Spinner className="h-4 w-4" /> : <><Play size={16} /> Run</>}
          </Button>
          <ThemeToggle />
        </div>
      </header>

      {/* Body */}
      <div className="grid flex-1 grid-cols-1 gap-0 overflow-hidden lg:grid-cols-[1fr_320px]">
        {/* Editor + output */}
        <div className="flex flex-col overflow-hidden border-r border-border">
          <div className="flex-1 overflow-hidden">
            <CodeEditor value={code} language={language} onChange={handleCodeChange} />
          </div>
          <div className="h-44 overflow-auto border-t border-border bg-surface/40 p-4">
            <p className="mb-2 text-xs font-semibold uppercase text-muted">Output</p>
            <pre className="whitespace-pre-wrap font-mono text-sm">{output || '—'}</pre>
          </div>
        </div>

        {/* Sidebar: participants + chat */}
        <div className="flex flex-col overflow-hidden">
          <div className="border-b border-border p-4">
            <div className="mb-2 flex items-center gap-2 text-sm font-semibold">
              <Users size={16} /> Participants ({participants.length})
            </div>
            <div className="space-y-1">
              {participants.length ? (
                participants.map((p, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm">
                    <span className="grid h-6 w-6 place-items-center rounded-full bg-primary/15 text-xs font-bold text-primary">
                      {p.user_name?.charAt(0).toUpperCase()}
                    </span>
                    {p.user_name}
                  </div>
                ))
              ) : (
                <p className="text-xs text-muted">Just you so far.</p>
              )}
            </div>
          </div>

          <div className="flex flex-1 flex-col overflow-hidden">
            <div className="flex items-center gap-2 border-b border-border p-4 text-sm font-semibold">
              <MessageSquare size={16} /> Chat
            </div>
            <div className="flex-1 space-y-3 overflow-auto p-4">
              {messages.map((m, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-sm"
                >
                  <span className="font-semibold text-primary">{m.user_name}: </span>
                  {m.message}
                </motion.div>
              ))}
              {!messages.length && <p className="text-xs text-muted">No messages yet.</p>}
            </div>
            <div className="flex gap-2 border-t border-border p-3">
              <input
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                placeholder="Message…"
                className="h-10 flex-1 rounded-lg border border-border bg-bg px-3 text-sm outline-none focus:ring-2 focus:ring-primary/40"
              />
              <Button size="sm" onClick={sendMessage}><Send size={16} /></Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
