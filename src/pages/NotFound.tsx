import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/Button';

export default function NotFound() {
  return (
    <div className="grid min-h-screen place-items-center px-6 text-center">
      <div>
        <h1 className="text-7xl font-extrabold gradient-text">404</h1>
        <p className="mt-4 text-muted">This page wandered off.</p>
        <Link to="/" className="mt-8 inline-block">
          <Button>Back home</Button>
        </Link>
      </div>
    </div>
  );
}
