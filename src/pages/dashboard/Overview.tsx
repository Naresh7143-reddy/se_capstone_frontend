import { motion } from 'framer-motion';
import { GraduationCap, FileCode2, Trophy, Activity } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';
import { useClassrooms } from '@/hooks/useClassrooms';
import { useProfile } from '@/hooks/useProfile';

function Bar({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex items-end gap-3">
      <div className="flex h-32 w-full items-end">
        <motion.div
          initial={{ height: 0 }}
          animate={{ height: `${value}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className="w-full rounded-t-lg bg-gradient-to-t from-primary to-accent"
        />
      </div>
      <span className="sr-only">{label}</span>
    </div>
  );
}

export default function Overview() {
  const { data: classrooms, isLoading } = useClassrooms();
  const { data: profile } = useProfile();

  const stats = [
    { label: 'Classrooms', value: classrooms?.length ?? 0, icon: GraduationCap },
    { label: 'Submissions', value: 0, icon: FileCode2 },
    { label: 'Best score', value: 100, icon: Trophy },
    { label: 'Active today', value: classrooms?.filter((c) => c.is_active).length ?? 0, icon: Activity },
  ];

  const weekly = [40, 65, 50, 80, 60, 95, 70];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold">Overview</h1>
        <p className="text-sm text-muted">
          {profile ? `Signed in as ${profile.email} · ${profile.role}` : 'Your activity at a glance'}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
          >
            <Card>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted">{s.label}</span>
                <s.icon size={18} className="text-primary" />
              </div>
              <div className="mt-2 text-3xl font-extrabold">
                {isLoading ? <Skeleton className="h-8 w-16" /> : s.value}
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <h3 className="font-bold">Weekly activity</h3>
          <p className="text-sm text-muted">Code submissions this week</p>
          <div className="mt-6 grid grid-cols-7 gap-3">
            {weekly.map((v, i) => (
              <Bar key={i} value={v} label={`day ${i + 1}`} />
            ))}
          </div>
          <div className="mt-2 grid grid-cols-7 gap-3 text-center text-xs text-muted">
            {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => (
              <span key={i}>{d}</span>
            ))}
          </div>
        </Card>

        <Card>
          <h3 className="font-bold">Recent classrooms</h3>
          <div className="mt-4 space-y-3">
            {isLoading ? (
              <>
                <Skeleton className="h-10" />
                <Skeleton className="h-10" />
                <Skeleton className="h-10" />
              </>
            ) : classrooms && classrooms.length ? (
              classrooms.slice(0, 4).map((c) => (
                <div key={c.id} className="flex items-center justify-between rounded-xl border border-border px-3 py-2">
                  <span className="text-sm font-medium">{c.name}</span>
                  <span className="rounded-md bg-primary/10 px-2 py-0.5 font-mono text-xs text-primary">
                    {c.code}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted">No classrooms yet.</p>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
