import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { motion } from 'framer-motion';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { Code2 } from 'lucide-react';
import { auth } from '@/lib/firebase';
import api from '@/lib/api';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { ThemeToggle } from '@/components/ui/ThemeToggle';

interface FormValues {
  name: string;
  email: string;
  password: string;
}

export default function Register() {
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm<FormValues>();

  const onSubmit = async (data: FormValues) => {
    setError('');
    setLoading(true);
    try {
      const cred = await createUserWithEmailAndPassword(auth, data.email, data.password);
      await updateProfile(cred.user, { displayName: data.name });
      // Create the profile row in the backend (Supabase) via our API.
      try {
        await api.post('/api/auth/register', { name: data.name });
      } catch {
        /* non-fatal: profile can be created later */
      }
      navigate('/dashboard');
    } catch (e: any) {
      setError(e?.message?.replace('Firebase:', '').trim() || 'Sign up failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative grid min-h-screen place-items-center px-6">
      <div className="pointer-events-none absolute inset-0 gradient-bg opacity-50" />
      <div className="absolute right-6 top-6"><ThemeToggle /></div>
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="relative w-full max-w-md"
      >
        <Card className="glass">
          <Link to="/" className="mb-6 flex items-center justify-center gap-2 text-xl font-extrabold">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-primary text-primary-fg">
              <Code2 size={18} />
            </span>
            Code<span className="gradient-text">Sync</span>
          </Link>
          <h1 className="text-center text-2xl font-bold">Create your account</h1>
          <p className="mb-6 mt-1 text-center text-sm text-muted">Start coding together in seconds</p>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Input
              id="name"
              label="Full name"
              placeholder="Ada Lovelace"
              error={errors.name?.message}
              {...register('name', { required: 'Name is required' })}
            />
            <Input
              id="email"
              label="Email"
              type="email"
              placeholder="you@example.com"
              error={errors.email?.message}
              {...register('email', { required: 'Email is required' })}
            />
            <Input
              id="password"
              label="Password"
              type="password"
              placeholder="At least 6 characters"
              error={errors.password?.message}
              {...register('password', {
                required: 'Password is required',
                minLength: { value: 6, message: 'Minimum 6 characters' },
              })}
            />
            {error && <p className="text-sm text-red-500">{error}</p>}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? <Spinner className="h-4 w-4" /> : 'Create account'}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-muted">
            Already have an account?{' '}
            <Link to="/login" className="font-semibold text-primary">Log in</Link>
          </p>
        </Card>
      </motion.div>
    </div>
  );
}
