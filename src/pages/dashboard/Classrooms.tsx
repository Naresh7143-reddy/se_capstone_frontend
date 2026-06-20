import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, LogIn, ArrowRight } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Skeleton } from '@/components/ui/Skeleton';
import { Spinner } from '@/components/ui/Spinner';
import {
  useClassrooms,
  useCreateClassroom,
  useJoinClassroom,
} from '@/hooks/useClassrooms';

export default function Classrooms() {
  const navigate = useNavigate();
  const { data, isLoading, error } = useClassrooms();
  const createMut = useCreateClassroom();
  const joinMut = useJoinClassroom();

  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [showCreate, setShowCreate] = useState(false);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold">Classrooms</h1>
          <p className="text-sm text-muted">Create a room to teach, or join one with a code.</p>
        </div>
        <Button onClick={() => setShowCreate((s) => !s)}>
          <Plus size={18} /> New classroom
        </Button>
      </div>

      <AnimatePresence>
        {showCreate && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <Card>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-3">
                  <h3 className="font-bold">Create classroom</h3>
                  <Input
                    placeholder="e.g. Python 101"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                  <Button
                    disabled={!name || createMut.isPending}
                    onClick={() =>
                      createMut.mutate(name, { onSuccess: () => setName('') })
                    }
                  >
                    {createMut.isPending ? <Spinner className="h-4 w-4" /> : 'Create'}
                  </Button>
                </div>
                <div className="space-y-3">
                  <h3 className="font-bold">Join classroom</h3>
                  <Input
                    placeholder="Enter 6-char code"
                    value={code}
                    onChange={(e) => setCode(e.target.value.toUpperCase())}
                    maxLength={6}
                  />
                  <Button
                    variant="outline"
                    disabled={!code || joinMut.isPending}
                    onClick={() =>
                      joinMut.mutate(code, { onSuccess: () => setCode('') })
                    }
                  >
                    {joinMut.isPending ? <Spinner className="h-4 w-4" /> : <><LogIn size={16} /> Join</>}
                  </Button>
                </div>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {error && (
        <Card>
          <p className="text-sm text-red-500">
            Couldn't load classrooms. The backend may be waking up (free tier) — try again in a moment.
          </p>
        </Card>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {isLoading ? (
          [...Array(3)].map((_, i) => (
            <Card key={i}>
              <Skeleton className="h-5 w-32" />
              <Skeleton className="mt-3 h-4 w-20" />
            </Card>
          ))
        ) : data && data.length ? (
          data.map((c) => (
            <motion.div key={c.id} whileHover={{ y: -4 }}>
              <Card className="flex h-full flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-bold">{c.name}</h3>
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs ${
                        c.is_active ? 'bg-green-500/15 text-green-500' : 'bg-muted/20 text-muted'
                      }`}
                    >
                      {c.is_active ? 'Active' : 'Ended'}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-muted">
                    Code: <span className="font-mono text-primary">{c.code}</span>
                  </p>
                </div>
                <Button
                  size="sm"
                  className="mt-4 w-full"
                  onClick={() => navigate(`/classroom/${c.id}`)}
                >
                  Open <ArrowRight size={16} />
                </Button>
              </Card>
            </motion.div>
          ))
        ) : (
          !error && (
            <Card className="sm:col-span-2 lg:col-span-3 text-center">
              <p className="text-muted">No classrooms yet. Create or join one above.</p>
            </Card>
          )
        )}
      </div>
    </div>
  );
}
