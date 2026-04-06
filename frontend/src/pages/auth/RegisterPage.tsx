import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../../api/api-client';
import { UserPlus, Mail, Lock, Loader2, User, Trophy, Store, Users } from 'lucide-react';
import { motion } from 'framer-motion';

const RegisterPage: React.FC = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('USER');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      await api.post('/auth/register', { name, email, password, role });
      navigate('/login', { state: { message: 'Registro exitoso. Por favor inicia sesión.' } });
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al registrarse');
    } finally {
      setIsSubmitting(false);
    }
  };

  const roles = [
    { id: 'USER', label: 'Atleta', icon: User, desc: 'Entrena y reserva clases' },
    { id: 'GYM_OWNER', label: 'Dueño', icon: Store, desc: 'Gestiona tu gimnasio' },
    { id: 'TRAINER', label: 'Coach', icon: Trophy, desc: 'Crea clases y entrena' },
  ];

  return (
    <div className="flex bg-background-darker min-h-screen items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute -top-24 -right-24 rounded-full w-96 h-96 bg-primary/20 blur-3xl"></div>
      <div className="absolute -bottom-24 -left-24 rounded-full w-96 h-96 bg-accent/20 blur-3xl"></div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="glass-card w-full max-w-2xl p-8 relative z-10"
      >
        <div className="text-center mb-8">
          <h1 className="font-bold text-3xl text-white">Únete a SportNexus</h1>
          <p className="text-slate-400 mt-2">Crea tu cuenta y empieza a transformar tu vida.</p>
        </div>

        {error && (
          <div className="bg-red-500/10 border-red-500/20 mb-6 p-4 border rounded-lg text-red-400 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="grid md:grid-cols-2 gap-8">
          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-slate-300 text-sm font-medium ml-1">Nombre Completo</label>
              <div className="relative">
                <Users className="absolute top-1/2 left-3 -translate-y-1/2 text-slate-500 w-5 h-5" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="bg-white/5 border-white/10 focus:border-primary-light w-full py-3 pr-4 pl-10 border rounded-xl text-white outline-none transition-all focus:ring-1 focus:ring-primary-light/50"
                  placeholder="Juan Pérez"
                />
              </div>
            </div>

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
          </div>

          <div className="space-y-4">
            <label className="text-slate-300 text-sm font-medium ml-1">¿Cuál es tu rol?</label>
            <div className="space-y-3">
              {roles.map((r) => (
                <div
                  key={r.id}
                  onClick={() => setRole(r.id)}
                  className={`p-4 rounded-xl border transition-all cursor-pointer flex items-center gap-4 ${
                    role === r.id
                      ? 'bg-primary/20 border-primary-light/50 ring-1 ring-primary-light/30'
                      : 'bg-white/5 border-white/10 hover:bg-white/10'
                  }`}
                >
                  <div className={`p-2 rounded-lg ${role === r.id ? 'bg-primary-light text-white' : 'bg-white/10 text-slate-400'}`}>
                    <r.icon className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-white font-medium text-sm">{r.label}</h3>
                    <p className="text-slate-400 text-xs">{r.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-primary w-full py-3 mt-4 flex items-center justify-center gap-2 relative overflow-hidden active:scale-[0.98]"
            >
              {isSubmitting ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <UserPlus className="w-5 h-5" />
                  <span>Crear Cuenta</span>
                </>
              )}
            </button>
          </div>
        </form>

        <div className="mt-8 pt-6 border-t border-white/5 text-center">
          <p className="text-slate-400 text-sm">
            ¿Ya tienes una cuenta?{' '}
            <Link to="/login" className="text-primary-light hover:underline font-medium">
              Inicia sesión aquí
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default RegisterPage;
