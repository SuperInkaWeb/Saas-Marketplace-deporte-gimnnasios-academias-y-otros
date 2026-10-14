import React, { useEffect, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ShieldCheck, LogIn, AlertCircle, LogOut } from 'lucide-react';
import { useAuth } from '../context/auth-context';

const AdminLoginPage: React.FC = () => {
  const { user, loading, login, logout } = useAuth();
  const navigate = useNavigate();
  const [denied, setDenied] = useState(false);

  // El contexto vuelve aquí con ?denied=role_mismatch cuando la cuenta no es Superadmin
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('denied') === 'role_mismatch') {
      setDenied(true);
      navigate('/login', { replace: true });
    }
  }, [navigate]);

  // Ya hay sesión de Superadmin: directo al panel
  if (!loading && user?.role === 'ADMIN') {
    return <Navigate to="/super-admin" replace />;
  }

  const hasOtherSession = !loading && !!user && user.role !== 'ADMIN';

  return (
    <div className="flex flex-col bg-background-darker min-h-screen items-center justify-center p-6 relative overflow-hidden">
      {/* Background glowing design */}
      <div className="absolute -top-40 -left-40 rounded-full w-[600px] h-[600px] bg-primary/10 blur-3xl"></div>
      <div className="absolute -bottom-40 -right-40 rounded-full w-[600px] h-[600px] bg-accent/10 blur-3xl"></div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="glass-card relative z-10 w-full max-w-md p-8 border border-white/10 text-center"
      >
        <img src="/hercix-logo.png" alt="Hercix" className="h-16 mx-auto object-contain mb-6" />

        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-tr from-primary to-secondary text-white shadow-lg shadow-primary/20">
          <ShieldCheck className="h-8 w-8" />
        </div>

        <h1 className="text-2xl font-extrabold text-white tracking-tight">Panel Superadmin</h1>
        <p className="text-slate-400 mt-2 text-sm">
          Acceso exclusivo para administradores de la plataforma Hercix.
        </p>

        {denied && (
          <div
            role="alert"
            className="mt-6 flex items-start gap-3 rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-left text-sm text-red-300"
          >
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <span>Esta cuenta no existe en el rol <strong>Superadmin</strong>. Este sitio es solo para administradores.</span>
          </div>
        )}

        {hasOtherSession && (
          <div className="mt-6 rounded-2xl border border-yellow-500/30 bg-yellow-500/10 px-4 py-3 text-left text-sm text-yellow-300">
            <p>Hay una sesión abierta con una cuenta que no es Superadmin ({user?.email}).</p>
            <button
              type="button"
              onClick={logout}
              className="mt-3 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-yellow-200 hover:text-white transition-colors"
            >
              <LogOut className="w-4 h-4" /> Cerrar sesión
            </button>
          </div>
        )}

        <button
          type="button"
          disabled={loading}
          onClick={() => login({ allowSignUp: false, portalRole: 'ADMIN' })}
          className="mt-8 w-full flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-primary to-secondary py-4 text-sm font-bold uppercase tracking-widest text-white shadow-lg shadow-primary/25 transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-50"
        >
          <LogIn className="w-4 h-4" /> Ingresar como Superadmin
        </button>

        <p className="mt-6 text-slate-500 text-[10px] uppercase tracking-widest font-bold">
          © 2026 HERCIX | ACCESO RESTRINGIDO
        </p>
      </motion.div>
    </div>
  );
};

export default AdminLoginPage;