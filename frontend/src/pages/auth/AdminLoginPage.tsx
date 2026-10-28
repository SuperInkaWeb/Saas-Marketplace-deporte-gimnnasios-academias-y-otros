import React, { useEffect } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/auth-context';
import { LogIn, ShieldCheck } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

/**
 * Acceso del Superadmin (rol ADMIN) en una URL aparte (/admin).
 * No se enlaza desde ninguna página pública. La protección real sigue siendo
 * Auth0 + el rol ADMIN validado en el backend; esto solo saca la opción del portal general.
 */
const AdminLoginPage: React.FC = () => {
  const { user, loading, login } = useAuth();
  const navigate = useNavigate();

  // Que los buscadores no indexen esta página
  useEffect(() => {
    const meta = document.createElement('meta');
    meta.name = 'robots';
    meta.content = 'noindex, nofollow';
    document.head.appendChild(meta);
    return () => {
      document.head.removeChild(meta);
    };
  }, []);

  // Rechazo al volver de Auth0 con una cuenta sin rol ADMIN: mensaje genérico
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('denied')) {
      toast.error('Acceso no autorizado.');
      navigate('/admin', { replace: true });
    }
  }, [navigate]);

  if (!loading && user?.role === 'ADMIN') {
    return <Navigate to="/super-admin" replace />;
  }

  return (
    <div className="flex flex-col bg-background-darker min-h-screen items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute -top-40 -left-40 rounded-full w-[600px] h-[600px] bg-purple-500/10 blur-3xl"></div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card w-full max-w-sm p-8 border border-white/10 relative z-10 text-center"
      >
        <img src="/hercix-logo.png" alt="Hercix" className="h-14 mx-auto object-contain mb-6" />
        <div className="w-12 h-12 mx-auto mb-4 rounded-2xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center">
          <ShieldCheck className="w-6 h-6 text-purple-300" />
        </div>
        <h1 className="text-2xl font-extrabold text-white tracking-tight">Administración</h1>
        <p className="text-slate-400 text-sm mt-2 mb-8">Acceso restringido al equipo de Hercix.</p>

        <button
          onClick={() => login({ allowSignUp: false, portalRole: 'ADMIN' })}
          disabled={loading}
          className="w-full flex justify-center items-center gap-2 py-3 rounded-xl font-bold btn-primary disabled:opacity-50"
        >
          <LogIn className="w-4 h-4" /> Ingresar
        </button>
      </motion.div>

      <p className="relative z-10 mt-8 text-slate-600 text-[10px] uppercase tracking-widest font-bold">
        © 2026 HERCIX
      </p>
    </div>
  );
};

export default AdminLoginPage;
