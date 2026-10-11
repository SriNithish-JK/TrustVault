import { StrictMode, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { createBrowserRouter, RouterProvider, Navigate, Outlet, useMatches } from 'react-router-dom';
import { AuthProvider, RequireAuth } from '@/lib/auth';
import { applyTheme, initialTheme } from '@/lib/theme';
import { Layout } from '@/components/app/layout';
import { Toaster, DialogHost } from '@/components/app/kit';
import Landing from './pages/Landing';
import Privacy from './pages/Privacy';
import Login from './pages/Login';
import Reauth from './pages/Reauth';
import Dashboard from './pages/Dashboard';
import Documents from './pages/Documents';
import Access from './pages/Access';
import Shares from './pages/Shares';
import Activity from './pages/Activity';
import Security from './pages/Security';
import Review from './pages/Review';
import { StudentList, StudentRecord } from './pages/Records';
import Admin from './pages/Admin';
import PublicVerify from './pages/PublicVerify';
import SharedView from './pages/SharedView';
import './index.css';

applyTheme(initialTheme()); // before first paint: no flash of the wrong theme

const staff = ['verifier', 'admin'];
const only = (roles, page) => <RequireAuth roles={roles}>{page}</RequireAuth>;

// Every route names itself in `handle.title`; the browser tab shows "Page · TrustVault".
function PageTitle() {
  const title = useMatches().findLast((m) => m.handle?.title)?.handle.title;
  useEffect(() => { document.title = title ? `${title} · TrustVault` : 'TrustVault - secure document vault'; }, [title]);
  return null;
}

function Root() {
  return (
    <AuthProvider>
      <PageTitle />
      <Outlet />
      <Toaster />
      <DialogHost />
    </AuthProvider>
  );
}

const router = createBrowserRouter([{
  element: <Root />,
  children: [
    { path: '/welcome', element: <Landing />, handle: { title: 'Welcome' } },
    { path: '/privacy', element: <Privacy />, handle: { title: 'Privacy policy' } },
    { path: '/login', element: <Login mode="login" />, handle: { title: 'Sign in' } },
    { path: '/register', element: <Login mode="register" />, handle: { title: 'Create account' } },
    { path: '/reauth', element: <Reauth />, handle: { title: 'Confirm it is you' } },
    { path: '/verify', element: <PublicVerify />, handle: { title: 'Verify a document' } },
    { path: '/verify/:code', element: <PublicVerify />, handle: { title: 'Verify a document' } },
    { path: '/share/:token', element: <SharedView />, handle: { title: 'Shared document' } },
    {
      element: <RequireAuth><Layout /></RequireAuth>,
      children: [
        { index: true, element: <Dashboard />, handle: { title: 'Home' } },
        { path: 'documents', element: <Documents />, handle: { title: 'My documents' } },
        { path: 'access', element: only(['student'], <Access />), handle: { title: 'Access requests' } },
        { path: 'shares', element: <Shares />, handle: { title: 'Shared links' } },
        { path: 'activity', element: <Activity />, handle: { title: 'Activity log' } },
        { path: 'security', element: <Security />, handle: { title: 'Security' } },
        { path: 'review', element: only(staff, <Review />), handle: { title: 'Review queue' } },
        { path: 'records', element: only(staff, <StudentList />), handle: { title: 'Student records' } },
        { path: 'records/:id', element: only(staff, <StudentRecord />), handle: { title: 'Student record' } },
        { path: 'admin', element: only(['admin'], <Admin />), handle: { title: 'Admin' } },
      ],
    },
    { path: '*', element: <Navigate to="/" replace /> },
  ],
}]);

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
);
