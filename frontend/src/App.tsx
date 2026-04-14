import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/auth-context';
import ProtectedRoute from './components/auth/ProtectedRoute';
import MainLayout from './components/layout/MainLayout';
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import Dashboard from './pages/dashboard/Dashboard';
import GymsPage from './pages/gyms/GymsPage';
import ClassesPage from './pages/classes/ClassesPage';
import MarketplacePage from './pages/marketplace/MarketplacePage';
import MembershipsPage from './pages/memberships/MembershipsPage';
import ProfessionalsPage from './pages/professionals/ProfessionalsPage';
import MapSearchPage from './pages/discovery/MapSearchPage';
import EventsPage from './pages/events/EventsPage';
import AnalyticsView from './pages/dashboard/AnalyticsView';
import CRMView from './pages/dashboard/CRMView';
import WearablesView from './pages/dashboard/WearablesView';
import InvoicesView from './pages/dashboard/InvoicesView';
import { Toaster } from 'sonner';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/" element={<Navigate to="/login" replace />} />

          {/* Protected Routes inside MainLayout */}
          <Route element={<ProtectedRoute />}>
            <Route element={<MainLayout><Dashboard /></MainLayout>} path="/dashboard" />
            <Route element={<MainLayout><AnalyticsView /></MainLayout>} path="/dashboard/analytics" />
            <Route element={<MainLayout><CRMView /></MainLayout>} path="/dashboard/crm" />
            <Route element={<MainLayout><WearablesView /></MainLayout>} path="/dashboard/wearables" />
            <Route element={<MainLayout><InvoicesView /></MainLayout>} path="/dashboard/invoices" />
            <Route element={<MainLayout><GymsPage /></MainLayout>} path="/gyms" />
            <Route element={<MainLayout><ClassesPage /></MainLayout>} path="/classes" />
            <Route element={<MainLayout><MarketplacePage /></MainLayout>} path="/marketplace" />
            <Route element={<MainLayout><ProfessionalsPage /></MainLayout>} path="/professionals" />
            <Route element={<MainLayout><MapSearchPage /></MainLayout>} path="/discovery" />
            <Route element={<MainLayout><EventsPage /></MainLayout>} path="/events" />
            <Route element={<MainLayout><MembershipsPage /></MainLayout>} path="/memberships" />
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
      <Toaster position="top-right" richColors theme="dark" />
    </AuthProvider>
  );
}

export default App;
