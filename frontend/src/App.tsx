import { Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/auth-context';
import ProtectedRoute from './components/auth/ProtectedRoute';
import MainLayout from './components/layout/MainLayout';
import LandingPage from './pages/landing/LandingPage';
import { Toaster } from 'sonner';
import { lazyPage } from './lib/lazy-page';

// AUD-36: cada página se descarga recién cuando se abre (antes todo iba en un solo archivo de 2 MB).
// La Landing se carga de inmediato porque es lo primero que ve un visitante.
const LoginPage = lazyPage(() => import('./pages/auth/LoginPage'));
const AdminLoginPage = lazyPage(() => import('./pages/auth/AdminLoginPage'));
const RegisterPage = lazyPage(() => import('./pages/auth/RegisterPage'));
const Dashboard = lazyPage(() => import('./pages/dashboard/Dashboard'));
const GymsPage = lazyPage(() => import('./pages/gyms/GymsPage'));
const GymShowroom = lazyPage(() => import('./pages/gyms/GymShowroom'));
const ClassesPage = lazyPage(() => import('./pages/classes/ClassesPage'));
const MarketplacePage = lazyPage(() => import('./pages/marketplace/MarketplacePage'));
const MembershipsPage = lazyPage(() => import('./pages/memberships/MembershipsPage'));
const PaymentResultPage = lazyPage(() => import('./pages/payment/PaymentResultPage'));
const ProfessionalsPage = lazyPage(() => import('./pages/professionals/ProfessionalsPage'));
const MapSearchPage = lazyPage(() => import('./pages/discovery/MapSearchPage'));
const EventsPage = lazyPage(() => import('./pages/events/EventsPage'));
const AnalyticsView = lazyPage(() => import('./pages/dashboard/AnalyticsView'));
const CRMView = lazyPage(() => import('./pages/dashboard/CRMView'));
const HealthView = lazyPage(() => import('./pages/dashboard/HealthView'));
const CoachHealthView = lazyPage(() => import('./pages/dashboard/CoachHealthView'));
const OwnerHealthView = lazyPage(() => import('./pages/dashboard/OwnerHealthView'));
const AdminHealthView = lazyPage(() => import('./pages/dashboard/AdminHealthView'));
const InvoicesView = lazyPage(() => import('./pages/dashboard/InvoicesView'));
const PlatformOverviewView = lazyPage(() => import('./pages/dashboard/PlatformOverviewView'));
const UsersManagementView = lazyPage(() => import('./pages/dashboard/UsersManagementView'));
const TicketsPage = lazyPage(() => import('./pages/tickets/TicketsPage'));
const SportStorePage = lazyPage(() => import('./pages/store/SportStorePage'));

// Componente para la página de inicio. Si está autenticado, redirige al panel según su rol; si no, muestra la Landing Page de Hercix.
const HomeRoute = () => {
  const { user, loading } = useAuth();

  // If Auth0 callback params are in the URL, always show spinner
  // (prevents flash of Landing Page during the auth redirect flow)
  const isProcessingCallback = typeof window !== 'undefined' &&
    (window.location.search.includes('code=') || window.location.search.includes('state='));

  if (isProcessingCallback) {
    sessionStorage.setItem('justLoggedIn', 'true');
  }

  if (loading || isProcessingCallback) {
    return (
      <div className="flex bg-background-darker h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="border-primary border-t-2 rounded-full w-12 h-12 animate-spin"></div>
          <p className="text-slate-400 text-sm animate-pulse">Verificando sesión...</p>
        </div>
      </div>
    );
  }

  if (user) {
    const justLoggedIn = sessionStorage.getItem('justLoggedIn');
    if (justLoggedIn === 'true') {
      sessionStorage.removeItem('justLoggedIn');
      // Redireccionar al panel dedicado del Rol correspondiente
      if (user.role === 'ADMIN') return <Navigate to="/super-admin" replace />;
      if (user.role === 'GYM_OWNER') return <Navigate to="/owner-dashboard" replace />;
      if (user.role === 'TRAINER') return <Navigate to="/coach-dashboard" replace />;
      return <Navigate to="/dashboard" replace />;
    }
  }

  // Si no está logueado o viene a ver la web a propósito, mostrar la Landing Page de Hercix de inmediato
  return <LandingPage />;
};

const PageLoader = () => (
  <div className="flex bg-background-darker h-screen items-center justify-center">
    <div className="border-primary border-t-2 rounded-full w-12 h-12 animate-spin"></div>
  </div>
);

function App() {
  return (
    <AuthProvider>
      <Router>
        <Suspense fallback={<PageLoader />}>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<LoginPage />} />
          {/* Acceso del Superadmin: URL aparte, no enlazada desde la web pública */}
          <Route path="/admin" element={<AdminLoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          
          {/* 
              Página de Inicio / Landing Page o Redirección Automática
          */}
          <Route path="/" element={<HomeRoute />} />

          {/* Rutas con Protección de Rol estricta */}
          <Route path="/super-admin" element={<ProtectedRoute allowedRoles={['ADMIN']}><MainLayout><Dashboard /></MainLayout></ProtectedRoute>} />
          <Route path="/owner-dashboard" element={<ProtectedRoute allowedRoles={['GYM_OWNER']}><MainLayout><Dashboard /></MainLayout></ProtectedRoute>} />
          <Route path="/coach-dashboard" element={<ProtectedRoute allowedRoles={['TRAINER']}><MainLayout><Dashboard /></MainLayout></ProtectedRoute>} />
          <Route path="/dashboard" element={<ProtectedRoute allowedRoles={['USER']}><MainLayout><Dashboard /></MainLayout></ProtectedRoute>} />

          {/* Protected Routes inside MainLayout */}
          <Route element={<ProtectedRoute />}>
            <Route element={<MainLayout><AnalyticsView /></MainLayout>} path="/dashboard/analytics" />
            <Route element={<MainLayout><PlatformOverviewView /></MainLayout>} path="/dashboard/platform-overview" />
            <Route element={<MainLayout><CRMView /></MainLayout>} path="/dashboard/crm" />
            <Route element={<MainLayout><HealthView /></MainLayout>} path="/dashboard/health" />
            <Route element={<MainLayout><CoachHealthView /></MainLayout>} path="/dashboard/coach-health" />
            <Route element={<MainLayout><OwnerHealthView /></MainLayout>} path="/dashboard/owner-health" />
            <Route element={<MainLayout><AdminHealthView /></MainLayout>} path="/dashboard/admin-health" />
            <Route element={<MainLayout><InvoicesView /></MainLayout>} path="/dashboard/invoices" />
            <Route element={<MainLayout><UsersManagementView /></MainLayout>} path="/dashboard/users" />
            <Route element={<MainLayout><TicketsPage /></MainLayout>} path="/dashboard/tickets" />
            <Route element={<MainLayout><SportStorePage /></MainLayout>} path="/sport-store" />
            <Route element={<MainLayout><GymsPage /></MainLayout>} path="/gyms" />
            <Route element={<MainLayout><GymShowroom /></MainLayout>} path="/gyms/:id" />
            <Route element={<MainLayout><ClassesPage /></MainLayout>} path="/classes" />
            <Route element={<MainLayout><MarketplacePage /></MainLayout>} path="/marketplace" />
            <Route element={<MainLayout><ProfessionalsPage /></MainLayout>} path="/professionals" />
            <Route element={<MainLayout><MapSearchPage /></MainLayout>} path="/discovery" />
            <Route element={<MainLayout><EventsPage /></MainLayout>} path="/events" />
            <Route element={<MainLayout><MembershipsPage /></MainLayout>} path="/memberships" />
            <Route element={<MainLayout><PaymentResultPage /></MainLayout>} path="/payment/success" />
            <Route element={<MainLayout><PaymentResultPage /></MainLayout>} path="/payment/failure" />
            <Route element={<MainLayout><PaymentResultPage /></MainLayout>} path="/payment/pending" />
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        </Suspense>
      </Router>
      <Toaster position="top-right" richColors theme="dark" />
    </AuthProvider>
  );
}

export default App;
