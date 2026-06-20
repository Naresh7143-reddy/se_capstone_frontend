import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { Card } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';

interface Submission {
  id: string;
  status: string;
  score: number;
  output: string;
  submitted_at: string;
}

export default function Submissions() {
  const { data, isLoading, error } = useQuery<Submission[]>({
    queryKey: ['submissions'],
    queryFn: async () => (await api.get('/api/submissions')).data,
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold">Submissions</h1>
        <p className="text-sm text-muted">Your code submission history.</p>
      </div>

      <Card className="overflow-hidden p-0">
        <div className="grid grid-cols-4 gap-4 border-b border-border px-5 py-3 text-xs font-semibold uppercase text-muted">
          <span>Status</span>
          <span>Score</span>
          <span className="col-span-1">Output</span>
          <span className="text-right">Date</span>
        </div>
        {isLoading ? (
          [...Array(4)].map((_, i) => (
            <div key={i} className="px-5 py-4"><Skeleton className="h-5" /></div>
          ))
        ) : error ? (
          <div className="px-5 py-6 text-sm text-red-500">
            Couldn't load submissions (backend may be waking up).
          </div>
        ) : data && data.length ? (
          data.map((s) => (
            <div key={s.id} className="grid grid-cols-4 items-center gap-4 border-b border-border px-5 py-4 text-sm last:border-0">
              <span
                className={`w-fit rounded-full px-2 py-0.5 text-xs ${
                  s.status === 'Accepted' ? 'bg-green-500/15 text-green-500' : 'bg-red-500/15 text-red-500'
                }`}
              >
                {s.status}
              </span>
              <span className="font-bold">{s.score}</span>
              <span className="truncate font-mono text-xs text-muted">{s.output}</span>
              <span className="text-right text-xs text-muted">
                {new Date(s.submitted_at).toLocaleString()}
              </span>
            </div>
          ))
        ) : (
          <div className="px-5 py-6 text-sm text-muted">No submissions yet.</div>
        )}
      </Card>
    </div>
  );
}
