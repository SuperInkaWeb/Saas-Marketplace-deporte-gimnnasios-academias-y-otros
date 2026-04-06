import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/auth-context';
import api from '../../api/api-client';
import { LogIn, Mail, Lock, Loader2, Dumbbell } from 'lucide-react';
import { motion } from 'framer-motion';

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      const { data } = await api.post('/auth/login', { email, password });
      login(data.accessToken, data.user);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al iniciar sesión');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex bg-background-darker min-h-screen items-center justify-center p-4 relative overflow-hidden">
      {/* Background blobs for depth */}
      <div className="absolute -top-24 -left-24 rounded-full w-96 h-96 bg-primary/20 blur-3xl"></div>
      <div className="absolute -bottom-24 -right-24 rounded-full w-96 h-96 bg-accent/20 blur-3xl"></div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="glass-card w-full max-w-md p-8 relative z-10"
      >
        <div className="flex flex-col items-center mb-8">
          <div className="bg-primary/20 p-4 rounded-full mb-4 ring-1 ring-white/10">
            <Dumbbell className="text-primary-light w-10 h-10" />
          </div>
          <h1 className="font-bold text-3xl text-white">SportNexus</h1>
          <p className="text-slate-400 mt-2">Bienvenido de nuevo, atleta.</p>
        </div>

        {error && (
          <div className="bg-red-500/10 border-red-500/20 mb-6 p-4 border rounded-lg text-red-400 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="text-slate-300 text-sm font-medium ml-1">Email</label>
            <div className="relative">
              <Mail className="absolute top-1/2 left-3 -translate-y-1/2 text-slate-500 w-5 h-5" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-white/5 border-white/10 focus:border-primary-light w-full py-3 pr-4 pl-10 border rounded-xl text-white outline-none transition-all focus:ring-1 focus:ring-primary-light/50"
                placeholder="tu@email.com"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-slate-300 text-sm font-medium ml-1">Contraseña</label>
            <div className="relative">
              <Lock className="absolute top-1/2 left-3 -translate-y-1/2 text-slate-500 w-5 h-5" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="bg-white/5 border-white/10 focus:border-primary-light w-full py-3 pr-4 pl-10 border rounded-xl text-white outline-none transition-all focus:ring-1 focus:ring-primary-light/50"
                placeholder="••••••••"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="btn-primary w-full py-3 flex items-center justify-center gap-2 group relative overflow-hidden active:scale-[0.98]"
          >
            <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
            {isSubmitting ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                <LogIn className="w-5 h-5" />
                <span>Iniciar Sesión</span>
              </>
            )}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-white/5 text-center">
          <p className="text-slate-400 text-sm">
            ¿No tienes una cuenta?{' '}
            <Link to="/register" className="text-primary-light hover:underline font-medium">
              Regístrate gratis
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default LoginPage;
