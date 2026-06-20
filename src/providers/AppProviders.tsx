import { useEffect, type ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useAuth } from '@/store/auth';
import { useTheme, applyTheme } from '@/store/theme';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, refetchOnWindowFocus: false, staleTime: 30_000 },
  },
});

export function AppProviders({ children }: { children: ReactNode }) {
  const setUser = useAuth((s) => s.setUser);
  const setLoading = useAuth((s) => s.setLoading);
  const theme = useTheme((s) => s.theme);

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });
    return unsub;
  }, [setUser, setLoading]);

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
