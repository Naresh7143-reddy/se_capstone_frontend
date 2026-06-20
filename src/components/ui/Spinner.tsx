import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/cn';

export function Spinner({ className }: { className?: string }) {
  return <Loader2 className={cn('animate-spin text-primary', className)} />;
}

export function FullPageSpinner() {
  return (
    <div className="grid min-h-screen place-items-center bg-bg">
      <Spinner className="h-8 w-8" />
    </div>
  );
}
