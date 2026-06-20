import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AppProviders } from '@/providers/AppProviders';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { DashboardLayout } from '@/components/DashboardLayout';
import { FullPageSpinner } from '@/components/ui/Spinner';

const Landing = lazy(() => import('@/pages/Landing'));
const Login = lazy(() => import('@/pages/Login'));
const Register = lazy(() => import('@/pages/Register'));
const Overview = lazy(() => import('@/pages/dashboard/Overview'));
const Classrooms = lazy(() => import('@/pages/dashboard/Classrooms'));
const Submissions = lazy(() => import('@/pages/dashboard/Submissions'));
const SettingsPage = lazy(() => import('@/pages/dashboard/SettingsPage'));
const Classroom = lazy(() => import('@/pages/Classroom'));
const NotFound = lazy(() => import('@/pages/NotFound'));

export default function App() {
  return (
    <AppProviders>
      <BrowserRouter>
        <Suspense fallback={<FullPageSpinner />}>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <DashboardLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Overview />} />
              <Route path="classrooms" element={<Classrooms />} />
              <Route path="submissions" element={<Submissions />} />
              <Route path="settings" element={<SettingsPage />} />
            </Route>

            <Route
              path="/classroom/:id"
              element={
                <ProtectedRoute>
                  <Classroom />
                </ProtectedRoute>
              }
            />

            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </AppProviders>
  );
}
