import { useTheme } from '@/store/theme';
import { useAuth } from '@/store/auth';
import { useProfile } from '@/hooks/useProfile';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const user = useAuth((s) => s.user);
  const { data: profile } = useProfile();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold">Settings</h1>
        <p className="text-sm text-muted">Manage your account and preferences.</p>
      </div>

      <Card>
        <h3 className="font-bold">Profile</h3>
        <dl className="mt-4 space-y-3 text-sm">
          <div className="flex justify-between">
            <dt className="text-muted">Name</dt>
            <dd className="font-medium">{user?.displayName || profile?.name || '—'}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted">Email</dt>
            <dd className="font-medium">{user?.email}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted">Role</dt>
            <dd className="font-medium capitalize">{profile?.role || 'student'}</dd>
          </div>
        </dl>
      </Card>

      <Card>
        <h3 className="font-bold">Appearance</h3>
        <p className="mt-1 text-sm text-muted">Choose your theme.</p>
        <div className="mt-4 flex gap-3">
          <Button variant={theme === 'light' ? 'primary' : 'outline'} size="sm" onClick={() => setTheme('light')}>
            Light
          </Button>
          <Button variant={theme === 'dark' ? 'primary' : 'outline'} size="sm" onClick={() => setTheme('dark')}>
            Dark
          </Button>
        </div>
      </Card>
    </div>
  );
}
