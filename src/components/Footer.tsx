import { Code2 } from 'lucide-react';

export function Footer() {
  return (
    <footer className="mt-24 border-t border-border">
      <div className="mx-auto max-w-6xl px-6 py-12">
        <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
          <div className="flex items-center gap-2 font-extrabold">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-primary text-primary-fg">
              <Code2 size={16} />
            </span>
            Code<span className="gradient-text">Sync</span>
          </div>
          <p className="text-sm text-muted">
            Real-time collaborative learning, built for modern classrooms.
          </p>
          <p className="text-sm text-muted">
            © {new Date().getFullYear()} CodeSync. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
