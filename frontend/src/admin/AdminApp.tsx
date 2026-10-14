import { useEffect } from 'react';
import type { ReactNode } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import { AuthProvider, useAuth } from '../context/auth-context';
import ProtectedRoute from '../components/auth/ProtectedRoute';
import MainLayout from '../components/layout/MainLayout';
import AdminLoginPage from './AdminLoginPage';
import Dashboard from '../pages/dashboard/Dashboard';
import AnalyticsView from '../pages/dashboard/AnalyticsView';
import CRMView from '../pages/dashboard/CRMView';
import AdminHealthView from '../pages/dashboard/AdminHealthView';
import InvoicesView from '../pages/dashboard/InvoicesView';
import PlatformOverviewView from '../pages/dashboard/PlatformOverviewView';
import UsersManagementView from '../pages/dashboard/UsersManagementView';
import TicketsPage from '../pages/tickets/TicketsPage';
import GymsPage from '../pages/gyms/GymsPage';
import GymShowroom from '../pages/gyms/GymShowroom';
import ClassesPage from '../pages/classes/ClassesPage';
import EventsPage from '../pages/events/EventsPage';

/** Todas las páginas del sitio admin exigen el rol ADMIN (el backend lo vuelve a validar). */
const AdminPage = ({ children }: { children: ReactNode }) => (
  <ProtectedRoute allowedRoles={['ADMIN']}>
    <MainLayout>{children}</MainLayout>
  </ProtectedRoute>
);

const Spinner = () => (
  <div className="flex bg-background-darker h-screen items-center justify-center">
    <div className="flex flex-col items-center gap-4">
      <div className="border-primary border-t-2 rounded-full w-12 h-12 animate-spin"></div>
      <p className="text-slate-400 text-sm animate-pulse">Verificando sesión...</p>
    </div>
  </div>
);

// Al volver de Auth0 se aterriza en "/": si es ADMIN va al panel, si no, al login
const AdminHome = () => {
  const { user, loading } = useAuth();

  const isProcessingCallback =
    window.location.search.includes('code=') || window.location.search.includes('state=');

  if (loading || isProcessingCallback) return <Spinner />;
  if (user?.role === 'ADMIN') return <Navigate to="/super-admin" replace />;
  return <Navigate to="/login" replace />;
};

function AdminApp() {
  useEffect(() => {
    document.title = 'Hercix Admin';
  }, []);

  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<AdminHome />} />
          <Route path="/login" element={<AdminLoginPage />} />

          {/* Panel Superadmin */}
          <Route path="/super-admin" element={<AdminPage><Dashboard /></AdminPage>} />
          <Route path="/dashboard/platform-overview" element={<AdminPage><PlatformOverviewView /></AdminPage>} />
          <Route path="/dashboard/users" element={<AdminPage><UsersManagementView /></AdminPage>} />
          <Route path="/dashboard/tickets" element={<AdminPage><TicketsPage /></AdminPage>} />
          <Route path="/dashboard/invoices" element={<AdminPage><InvoicesView /></AdminPage>} />
          <Route path="/dashboard/admin-health" element={<AdminPage><AdminHealthView /></AdminPage>} />
          <Route path="/dashboard/analytics" element={<AdminPage><AnalyticsView /></AdminPage>} />
          <Route path="/dashboard/crm" element={<AdminPage><CRMView /></AdminPage>} />

          {/* Consulta de la plataforma */}
          <Route path="/gyms" element={<AdminPage><GymsPage /></AdminPage>} />
          <Route path="/gyms/:id" element={<AdminPage><GymShowroom /></AdminPage>} />
          <Route path="/classes" element={<AdminPage><ClassesPage /></AdminPage>} />
          <Route path="/events" element={<AdminPage><EventsPage /></AdminPage>} />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
      <Toaster position="top-right" richColors theme="dark" />
    </AuthProvider>
  );
}

export default AdminApp;