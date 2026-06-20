import { useState } from 'react';
import { Link, useLocation, useNavigate, Outlet } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  GraduationCap,
  FileCode2,
  Settings,
  LogOut,
  Code2,
  Menu,
  X,
} from 'lucide-react';
import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useAuth } from '@/store/auth';
import { ThemeToggle } from './ui/ThemeToggle';
import { cn } from '@/lib/cn';

const nav = [
  { to: '/dashboard', label: 'Overview', icon: LayoutDashboard },
  { to: '/dashboard/classrooms', label: 'Classrooms', icon: GraduationCap },
  { to: '/dashboard/submissions', label: 'Submissions', icon: FileCode2 },
  { to: '/dashboard/settings', label: 'Settings', icon: Settings },
];

export function DashboardLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const user = useAuth((s) => s.user);
  const [mobileOpen, setMobileOpen] = useState(false);

  const SidebarInner = (
    <div className="flex h-full flex-col gap-2 p-4">
      <Link to="/" className="mb-4 flex items-center gap-2 px-2 text-lg font-extrabold">
        <span className="grid h-9 w-9 place-items-center rounded-xl bg-primary text-primary-fg">
          <Code2 size={18} />
        </span>
        Code<span className="gradient-text">Sync</span>
      </Link>
      {nav.map((n) => {
        const active = location.pathname === n.to;
        return (
          <Link
            key={n.to}
            to={n.to}
            onClick={() => setMobileOpen(false)}
            className={cn(
              'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition',
              active ? 'bg-primary text-primary-fg' : 'text-muted hover:bg-surface hover:text-fg'
            )}
          >
            <n.icon size={18} />
            {n.label}
          </Link>
        );
      })}
      <div className="mt-auto">
        <button
          onClick={async () => {
            await signOut(auth);
            navigate('/');
          }}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-muted transition hover:bg-surface hover:text-fg"
        >
          <LogOut size={18} />
          Sign out
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-bg">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 hidden w-64 border-r border-border bg-surface/40 backdrop-blur md:block">
        {SidebarInner}
      </aside>

      {/* Mobile drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)}
              className="fixed inset-0 z-40 bg-black/50 md:hidden"
            />
            <motion.aside
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: 'spring', damping: 24, stiffness: 240 }}
              className="fixed inset-y-0 left-0 z-50 w-64 border-r border-border bg-surface md:hidden"
            >
              {SidebarInner}
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main */}
      <div className="md:pl-64">
        <header className="sticky top-0 z-30 flex items-center justify-between gap-4 border-b border-border bg-bg/80 px-6 py-4 backdrop-blur">
          <button
            className="md:hidden"
            onClick={() => setMobileOpen(true)}
            aria-label="Open menu"
          >
            <Menu size={22} />
          </button>
          <div className="hidden text-sm text-muted md:block">
            Welcome back, <span className="font-semibold text-fg">{user?.displayName || user?.email}</span>
          </div>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <span className="grid h-9 w-9 place-items-center rounded-full bg-primary/15 text-sm font-bold text-primary">
              {(user?.displayName || user?.email || '?').charAt(0).toUpperCase()}
            </span>
          </div>
        </header>
        <main className="p-6">
          <Outlet />
        </main>
      </div>

      {/* Mobile close hint */}
      {mobileOpen && (
        <button
          className="fixed right-4 top-4 z-50 md:hidden"
          onClick={() => setMobileOpen(false)}
          aria-label="Close menu"
        >
          <X size={22} />
        </button>
      )}
    </div>
  );
}
