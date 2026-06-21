import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AppProviders } from '@/providers/AppProviders';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { DashboardLayout } from '@/components/DashboardLayout';
import { FullPageSpinner } from '@/components/ui/Spinner';

const Landing = lazy(() => import('@/pages/Landing'));
const Login = lazy(() => import('@/pages/Login'));
const Register = lazy(() => import('@/pages/Register'));
const Compiler = lazy(() => import('@/pages/Compiler'));
const Overview = lazy(() => import('@/pages/dashboard/Overview'));
const Classrooms = lazy(() => import('@/pages/dashboard/Classrooms'));
const Submissions = lazy(() => import('@/pages/dashboard/Submissions'));
const SettingsPage = lazy(() => import('@/pages/dashboard/SettingsPage'));
const ExamsList = lazy(() => import('@/pages/dashboard/ExamsList'));
const CreateExam = lazy(() => import('@/pages/dashboard/CreateExam'));
const TakeExam = lazy(() => import('@/pages/TakeExam'));
const ExamResults = lazy(() => import('@/pages/ExamResults'));
const Room = lazy(() => import('@/pages/Room'));
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
            <Route path="/compiler" element={<Compiler />} />

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
              <Route path="exams" element={<ExamsList />} />
              <Route path="exams/new" element={<CreateExam />} />
              <Route path="settings" element={<SettingsPage />} />
            </Route>

            <Route
              path="/exam/:id"
              element={<ProtectedRoute><TakeExam /></ProtectedRoute>}
            />
            <Route
              path="/exam/:id/results"
              element={<ProtectedRoute><ExamResults /></ProtectedRoute>}
            />

            <Route
              path="/classroom/:id"
              element={
                <ProtectedRoute>
                  <Room />
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
