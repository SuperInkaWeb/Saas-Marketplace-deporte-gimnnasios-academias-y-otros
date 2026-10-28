import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth, ROLE_LABELS } from '../../context/auth-context';
import type { Role } from '../../context/auth-context';
import { Building2, Dumbbell, Users, LogIn, ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

interface PortalCard {
  title: string;
  icon: React.ElementType;
  desc: string;
  color: string;
  accent: string;
  image?: string;
  allowSignUp: boolean;
  portalRole: Role;
}

const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  // Si el backend/contexto cerró la sesión porque el perfil elegido no coincide con la cuenta
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('denied') === 'role_mismatch') {
      const role = params.get('role') as Role | null;
      const label = role && ROLE_LABELS[role] ? ROLE_LABELS[role] : 'seleccionado';
      toast.error(
        `Esta cuenta no tiene acceso al perfil ${label}. Ingresa con el perfil que corresponde a tu cuenta.`,
      );
      // Limpia la URL para que el aviso no se repita al recargar
      navigate('/login', { replace: true });
    }
  }, [navigate]);

  // El Superadmin (rol ADMIN) no aparece aquí: ingresa por la URL aparte /admin (AdminLoginPage).
  const roles: PortalCard[] = [
    {
      title: 'Dueño (Owner)',
      icon: Building2,
      desc: 'Administración de gimnasios, academias, ingresos y membresías.',
      color: 'from-primary/20 to-primary/10 border-primary/20 text-primary-lightHover',
      accent: 'bg-primary',
      image: '/assets/gym_owner_gateway.png',
      allowSignUp: false,
      portalRole: 'GYM_OWNER',
    },
    {
      title: 'Coach / Entrenador',
      icon: Dumbbell,
      desc: 'Gestión de clases, rutinas, alumnos y perfiles profesionales.',
      color: 'from-accent/20 to-accent/10 border-accent/20 text-accentHover',
      accent: 'bg-accent',
      image: '/assets/coach_gateway.png',
      allowSignUp: false,
      portalRole: 'TRAINER',
    },
    {
      title: 'Atleta / Usuario',
      icon: Users,
      desc: 'Reservas de clases, wearables de salud y compras en el marketplace.',
      color: 'from-green-500/20 to-green-600/10 border-green-500/20 text-green-400Hover',
      accent: 'bg-green-500',
      image: '/assets/athlete_gateway.png',
      allowSignUp: true,
      portalRole: 'USER',
    },
  ];

  return (
    <div className="flex flex-col bg-background-darker min-h-screen items-center justify-center p-6 relative overflow-hidden">
      {/* Back button */}
      <motion.button
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.4 }}
        onClick={() => navigate('/')}
        className="absolute top-6 left-6 z-20 flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-slate-300 hover:text-white hover:bg-white/10 hover:border-white/20 backdrop-blur-md transition-all duration-200 text-sm font-medium group"
      >
        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform duration-200" />
        Volver al inicio
      </motion.button>
      {/* Background glowing design */}
      <div className="absolute -top-40 -left-40 rounded-full w-[600px] h-[600px] bg-primary/10 blur-3xl"></div>
      <div className="absolute -bottom-40 -right-40 rounded-full w-[600px] h-[600px] bg-accent/10 blur-3xl"></div>

      {/* Header Info */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center max-w-2xl mb-12 relative z-10"
      >
        <img src="/hercix-logo.png" alt="Hercix" className="h-20 mx-auto object-contain mb-4" />
        <h1 className="text-4xl font-extrabold text-white tracking-tight">Portal de Acceso Seguro</h1>
        <p className="text-slate-400 mt-2 text-base">
          Selecciona tu perfil de acceso para ingresar de manera encriptada a la suite Hercix Health.
        </p>
      </motion.div>

      {/* Interactive Gateway Cards Grid - 3 perfiles */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-6xl relative z-10 mb-8">
        {roles.map((r, i) => {
          const Icon = r.icon;
          return (
            <motion.div
              key={r.title}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1, duration: 0.5 }}
              whileHover={{ y: -5, scale: 1.02 }}
              onClick={() => login({ allowSignUp: r.allowSignUp, portalRole: r.portalRole })}
              className={`glass-card p-5 border border-white/5 bg-gradient-to-br ${r.color.split(' ')[0]} ${r.color.split(' ')[1]} hover:border-white/20 transition-all cursor-pointer group flex flex-col justify-between`}
            >
              <div>
                {/* Image Container with Lucide Icon Badge Overlay */}
                <div className="relative w-full h-40 rounded-2xl overflow-hidden mb-4 border border-white/10">
                  {r.image ? (
                    <img
                      src={r.image}
                      alt={r.title}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-purple-900/60 via-slate-900 to-slate-950 flex items-center justify-center group-hover:scale-110 transition-transform duration-500">
                      <Icon className="w-16 h-16 text-purple-300/40" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-slate-950/10 to-transparent"></div>

                  {/* Badge floating */}
                  <div className="absolute top-3 right-3 bg-slate-950/60 backdrop-blur-md border border-white/10 px-2.5 py-1 rounded-full text-[9px] uppercase font-bold text-slate-300">
                    Ingreso Seguro
                  </div>

                  {/* Icon floating */}
                  <div className="absolute bottom-3 left-3 p-2.5 rounded-xl bg-slate-950/60 backdrop-blur-md border border-white/10 text-white">
                    <Icon className="w-5 h-5" />
                  </div>
                </div>

                <h3 className="text-xl font-bold text-white group-hover:text-primary-light transition-colors">{r.title}</h3>
                <p className="text-slate-400 text-xs mt-2 leading-relaxed">{r.desc}</p>
              </div>

              <div className="mt-5 flex items-center gap-2 text-xs font-bold text-primary-light opacity-0 group-hover:opacity-100 transition-opacity">
                <span>Ingresar ahora</span>
                <LogIn className="w-3.5 h-3.5" />
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Footer Branding */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="relative z-10 text-center border-t border-white/5 pt-6 w-full max-w-md"
      >
        <p className="text-slate-500 text-[10px] uppercase tracking-widest font-bold">
          © 2026 HERCIX | TODOS LOS DERECHOS RESERVADOS
        </p>
      </motion.div>
    </div>
  );
};

export default LoginPage;
