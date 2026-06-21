import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, ShieldAlert, CheckCircle2, XCircle } from 'lucide-react';
import { useExamResults } from '@/hooks/useExams';
import { Card } from '@/components/ui/Card';
import { FullPageSpinner } from '@/components/ui/Spinner';

export default function ExamResults() {
  const { id } = useParams();
  const { data, isLoading, error } = useExamResults(id);

  if (isLoading) return <FullPageSpinner />;
  if (error || !data) {
    return (
      <div className="mx-auto max-w-4xl p-6">
        <Link to="/dashboard/exams" className="text-sm text-primary">← Back to exams</Link>
        <Card className="mt-4">
          <p className="text-red-500">
            {(error as any)?.response?.data?.error || 'Could not load results (owner only).'}
          </p>
        </Card>
      </div>
    );
  }

  const { exam, questions, total_points, students } = data;
  const submittedCount = students.filter((s) => s.submitted_count > 0).length;
  const flaggedCount = students.filter((s) => s.flagged).length;

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-6">
      <div>
        <Link to="/dashboard/exams" className="flex items-center gap-1 text-sm text-primary">
          <ArrowLeft size={14} /> Back to exams
        </Link>
        <h1 className="mt-2 text-2xl font-extrabold">{exam.title} — Results</h1>
        <p className="text-sm text-muted">Live results · updates automatically</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-4">
        <Card><div className="text-sm text-muted">Students</div><div className="text-3xl font-extrabold">{students.length}</div></Card>
        <Card><div className="text-sm text-muted">Submitted</div><div className="text-3xl font-extrabold text-green-500">{submittedCount}</div></Card>
        <Card><div className="text-sm text-muted">Not submitted</div><div className="text-3xl font-extrabold">{students.length - submittedCount}</div></Card>
        <Card><div className="text-sm text-muted">Flagged</div><div className="text-3xl font-extrabold text-red-500">{flaggedCount}</div></Card>
      </div>

      <Card className="overflow-x-auto p-0">
        <table className="w-full min-w-[640px] text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs uppercase text-muted">
              <th className="px-4 py-3">Student</th>
              <th className="px-4 py-3">Status</th>
              {questions.map((q, i) => (
                <th key={q.id} className="px-3 py-3 text-center" title={q.title}>Q{i + 1}</th>
              ))}
              <th className="px-4 py-3 text-right">Score</th>
              <th className="px-4 py-3">Integrity</th>
            </tr>
          </thead>
          <tbody>
            {students.map((s) => (
              <tr key={s.user_id} className={`border-b border-border ${s.flagged ? 'bg-red-500/5' : ''}`}>
                <td className="px-4 py-3">
                  <div className="font-medium">{s.name}</div>
                  {s.email && <div className="text-xs text-muted">{s.email}</div>}
                </td>
                <td className="px-4 py-3">
                  {s.submitted_count > 0 ? (
                    <span className="inline-flex items-center gap-1 text-green-500"><CheckCircle2 size={14} /> {s.submitted_count}/{questions.length}</span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-muted"><XCircle size={14} /> Not started</span>
                  )}
                </td>
                {questions.map((q) => {
                  const sub = s.submissions[q.id];
                  return (
                    <td key={q.id} className="px-3 py-3 text-center">
                      {!sub ? (
                        <span className="text-muted">—</span>
                      ) : sub.flagged ? (
                        <span className="rounded bg-red-500/15 px-1.5 py-0.5 text-xs text-red-500" title={sub.flag_reason}>0 ⚠</span>
                      ) : (
                        <span className={sub.score > 0 ? 'text-green-500' : 'text-muted'}>{sub.score}</span>
                      )}
                    </td>
                  );
                })}
                <td className="px-4 py-3 text-right font-bold">
                  {s.total_score}<span className="text-muted">/{total_points}</span>
                </td>
                <td className="px-4 py-3">
                  {s.flagged ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-red-500/15 px-2 py-0.5 text-xs text-red-500">
                      <ShieldAlert size={12} /> Cheating
                    </span>
                  ) : s.submitted_count > 0 ? (
                    <span className="text-xs text-green-500">Clean</span>
                  ) : (
                    <span className="text-xs text-muted">—</span>
                  )}
                </td>
              </tr>
            ))}
            {students.length === 0 && (
              <tr><td colSpan={questions.length + 4} className="px-4 py-6 text-center text-muted">No students have joined this classroom yet.</td></tr>
            )}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
