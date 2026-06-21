import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, BarChart3, PencilLine, Clock } from 'lucide-react';
import { useAuth } from '@/store/auth';
import { useClassrooms } from '@/hooks/useClassrooms';
import { useClassroomExams } from '@/hooks/useExams';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';

export default function ExamsList() {
  const navigate = useNavigate();
  const user = useAuth((s) => s.user);
  const { data: classrooms } = useClassrooms();
  const [classroomId, setClassroomId] = useState('');

  const selected = classrooms?.find((c) => c.id === classroomId);
  const isOwner = !!selected && selected.instructor_id === user?.uid;
  const { data: exams, isLoading } = useClassroomExams(classroomId);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold">Exams</h1>
          <p className="text-sm text-muted">Create exams, take them, and view results.</p>
        </div>
        <Link to="/dashboard/exams/new">
          <Button><Plus size={16} /> Create exam</Button>
        </Link>
      </div>

      <Card>
        <label className="text-sm font-medium">Classroom</label>
        <select
          value={classroomId}
          onChange={(e) => setClassroomId(e.target.value)}
          className="mt-1.5 h-11 w-full rounded-xl border border-border bg-bg px-4 text-sm"
        >
          <option value="">Select a classroom…</option>
          {(classrooms || []).map((c) => (
            <option key={c.id} value={c.id}>{c.name} ({c.code})</option>
          ))}
        </select>
      </Card>

      {classroomId && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {isLoading ? (
            [...Array(3)].map((_, i) => (
              <Card key={i}><Skeleton className="h-5 w-32" /><Skeleton className="mt-3 h-4 w-20" /></Card>
            ))
          ) : exams && exams.length ? (
            exams.map((ex) => (
              <Card key={ex.id} className="flex h-full flex-col justify-between">
                <div>
                  <h3 className="text-lg font-bold">{ex.title}</h3>
                  <p className="mt-1 flex items-center gap-1 text-sm text-muted">
                    <Clock size={14} /> {ex.duration_minutes} min
                  </p>
                </div>
                <div className="mt-4 flex gap-2">
                  <Button size="sm" className="flex-1" onClick={() => navigate(`/exam/${ex.id}`)}>
                    <PencilLine size={15} /> Take
                  </Button>
                  {isOwner && (
                    <Button size="sm" variant="outline" onClick={() => navigate(`/exam/${ex.id}/results`)}>
                      <BarChart3 size={15} /> Results
                    </Button>
                  )}
                </div>
              </Card>
            ))
          ) : (
            <Card className="sm:col-span-2 lg:col-span-3 text-center">
              <p className="text-muted">No exams in this classroom yet.</p>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
