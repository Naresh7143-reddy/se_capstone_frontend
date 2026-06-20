import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Code2, LogOut } from 'lucide-react';
import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useAuth } from '@/store/auth';
import { ThemeToggle } from './ui/ThemeToggle';
import { Button } from './ui/Button';

export function Navbar() {
  const user = useAuth((s) => s.user);
  const navigate = useNavigate();

  return (
    <motion.header
      initial={{ y: -24, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.4 }}
      className="sticky top-0 z-50"
    >
      <div className="mx-auto mt-4 flex max-w-6xl items-center justify-between gap-4 rounded-2xl glass px-5 py-3">
        <Link to="/" className="flex items-center gap-2 font-extrabold text-lg">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-primary text-primary-fg">
            <Code2 size={18} />
          </span>
          <span>
            Code<span className="gradient-text">Sync</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-6 text-sm text-muted md:flex">
          <Link to="/compiler" className="hover:text-fg transition">Compiler</Link>
          <a href="/#features" className="hover:text-fg transition">Features</a>
          <a href="/#pricing" className="hover:text-fg transition">Pricing</a>
          <a href="/#faq" className="hover:text-fg transition">FAQ</a>
        </nav>

        <div className="flex items-center gap-2">
          <ThemeToggle />
          {user ? (
            <>
              <Button size="sm" variant="outline" onClick={() => navigate('/dashboard')}>
                Dashboard
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={async () => {
                  await signOut(auth);
                  navigate('/');
                }}
              >
                <LogOut size={16} />
              </Button>
            </>
          ) : (
            <>
              <Button size="sm" variant="ghost" onClick={() => navigate('/login')}>
                Log in
              </Button>
              <Button size="sm" onClick={() => navigate('/register')}>
                Get started
              </Button>
            </>
          )}
        </div>
      </div>
    </motion.header>
  );
}
