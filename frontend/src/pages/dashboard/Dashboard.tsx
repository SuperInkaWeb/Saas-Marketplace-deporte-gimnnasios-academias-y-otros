import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/auth-context';
import { useNavigate } from 'react-router-dom';
import api from '../../api/api-client';
import {
  Users,
  Dumbbell,
  Calendar,
  TrendingUp,
  Clock,
  AlertCircle,
  ShoppingBag,
  Trophy,
  CreditCard,
  ArrowRight,
  Star,
  Activity,
  CheckCircle2,
} from 'lucide-react';
import { motion } from 'framer-motion';
import RecommendationsPanel from '../../components/ai/RecommendationsPanel';

interface StatCardProps {
  label: string;
  value: string | number;
  icon: any;
  trend?: string;
  color?: string;
  delay?: number;
}

const StatCard: React.FC<StatCardProps> = ({ label, value, icon: Icon, trend, color = 'primary', delay = 0 }) => {
  const colorMap: Record<string, string> = {
    primary: 'bg-primary/10 text-primary-light border-primary/20 group-hover:bg-primary/20',
    secondary: 'bg-secondary/10 text-secondary-light border-secondary/20 group-hover:bg-secondary/20',
    accent: 'bg-accent/10 text-accent border-accent/20 group-hover:bg-accent/20',
    green: 'bg-green-500/10 text-green-400 border-green-500/20 group-hover:bg-green-500/20',
  };
  const cls = colorMap[color] || colorMap.primary;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="glass-card p-6 border border-white/5 hover:border-white/15 transition-all group cursor-default"
    >
      <div className="flex justify-between items-start mb-4">
        <div className={`p-3 rounded-xl border transition-colors ${cls}`}>
          <Icon className="w-6 h-6" />
        </div>
        {trend && (
          <span className="text-xs font-bold text-green-400 bg-green-500/10 px-2 py-1 rounded-full border border-green-500/20">
            {trend}
          </span>
        )}
      </div>
      <h3 className="text-slate-400 text-sm font-medium">{label}</h3>
      <p className="text-3xl font-bold text-white mt-1 tracking-tight">{value}</p>
    </motion.div>
  );
};

const QuickAction: React.FC<{ label: string; icon: any; to: string; desc: string }> = ({ label, icon: Icon, to, desc }) => {
  const navigate = useNavigate();
  return (
    <motion.button
      whileHover={{ x: 4 }}
      onClick={() => navigate(to)}
      className="glass-card p-4 flex items-center gap-4 border-white/5 hover:border-primary/30 transition-all w-full text-left group"
    >
      <div className="bg-primary/10 p-2.5 rounded-xl group-hover:bg-primary/20 transition-colors">
        <Icon className="text-primary-light w-5 h-5" />
      </div>
      <div className="flex-grow">
        <p className="text-white font-bold text-sm">{label}</p>
        <p className="text-slate-500 text-xs">{desc}</p>
      </div>
      <ArrowRight className="w-4 h-4 text-slate-600 group-hover:text-primary-light transition-colors flex-shrink-0" />
    </motion.button>
  );
};

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const { data } = await api.get('/auth/stats');
        setStats(data);
      } catch (err) {
        console.error('Error fetching stats:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, []);

  const isOwner = user?.role === 'GYM_OWNER' || user?.role === 'ADMIN';
  const isTrainer = user?.role === 'TRAINER';

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="border-primary border-t-2 rounded-full w-14 h-14 animate-spin" />
          <p className="text-slate-400 text-sm">Cargando tu dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row md:items-center justify-between gap-4"
      >
        <div>
          <h1 className="text-3xl font-bold text-white">
            Hola, {user?.name.split(' ')[0]} 👋
          </h1>
          <p className="text-slate-400 mt-1">
            {isOwner
              ? 'Panel de administración de tu negocio deportivo.'
              : isTrainer
              ? 'Panel de gestión para entrenadores.'
              : 'Hoy es un excelente día para superarte.'}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-white/5 border border-white/10 px-4 py-2 rounded-xl">
            <div className={`w-2 h-2 rounded-full ${isOwner ? 'bg-primary-light' : 'bg-green-400'} animate-pulse`} />
            <span className="text-slate-300 text-sm font-medium capitalize">
              {user?.role.toLowerCase().replace('_', ' ')}
            </span>
          </div>
        </div>
      </motion.header>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {isOwner ? (
          <>
            <StatCard label="Mis Gimnasios" value={stats?.gyms ?? 0} icon={Dumbbell} color="primary" trend="+Activos" delay={0.05} />
            <StatCard label="Miembros Totales" value={stats?.members ?? 0} icon={Users} color="secondary" delay={0.1} />
            <StatCard label="Ingresos Generados" value={`$${(stats?.revenue ?? 0).toLocaleString('es-CO')}`} icon={TrendingUp} color="green" trend="Total" delay={0.15} />
            <StatCard label="Clases Activas" value={stats?.classes ?? 0} icon={Calendar} color="accent" delay={0.2} />
          </>
        ) : (
          <>
            <StatCard label="Clases Reservadas" value={stats?.reservations ?? 0} icon={Calendar} color="primary" delay={0.05} />
            <StatCard label="Gimnasios Disponibles" value={stats?.gyms ?? 0} icon={Dumbbell} color="secondary" delay={0.1} />
            <StatCard label="Puntos Reward" value={(stats?.points ?? 0).toLocaleString()} icon={Star} color="accent" trend="🏅 Activo" delay={0.15} />
            <StatCard label="Meses Activo" value={stats?.months ?? 1} icon={Clock} color="green" delay={0.2} />
          </>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Actividades Recientes */}
        <section className="lg:col-span-2 space-y-5">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Activity className="w-5 h-5 text-primary-light" /> Actividades Recientes
          </h2>
          <div className="space-y-3">
            {stats?.activities && stats.activities.length > 0 ? (
              stats.activities.map((act: any, i: number) => (
                <motion.div
                  key={act.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.07 }}
                  className="glass-card p-4 flex items-center gap-4 border-white/5 hover:border-primary/20 transition-all"
                >
                  <div className="bg-primary/10 p-2.5 rounded-xl flex-shrink-0">
                    <CheckCircle2 className="text-primary-light w-5 h-5" />
                  </div>
                  <div className="flex-grow min-w-0">
                    <h4 className="text-white font-bold text-sm truncate">{act.title}</h4>
                    <p className="text-slate-400 text-xs truncate">{act.description}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-slate-500 text-[10px] uppercase font-bold">
                      {new Date(act.date).toLocaleDateString('es-CO', { day: 'numeric', month: 'short' })}
                    </p>
                    <span className="text-primary-light text-[10px] font-bold bg-primary/10 px-2 py-0.5 rounded-full">
                      {act.type === 'RESERVATION' ? 'Reserva' : act.type}
                    </span>
                  </div>
                </motion.div>
              ))
            ) : (
              <div className="glass-card p-12 flex flex-col items-center justify-center text-center opacity-60">
                <AlertCircle className="text-slate-600 w-12 h-12 mb-4" />
                <p className="text-slate-400">Aún no tienes actividad registrada.</p>
                <p className="text-slate-500 text-sm mt-1">Empieza explorando el Marketplace o reserva una clase.</p>
              </div>
            )}
          </div>
        </section>

        {/* Panel derecho */}
        <section className="space-y-6">
          {/* Membresía / KPI */}
          {isOwner ? (
            <div className="bg-gradient-to-br from-primary/20 via-slate-800 to-slate-900 p-6 rounded-3xl border border-primary/20 relative overflow-hidden">
              <div className="absolute inset-0 opacity-5 bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-primary to-transparent pointer-events-none" />
              <div className="relative z-10">
                <span className="text-white/40 text-xs font-semibold uppercase tracking-wider">Rendimiento</span>
                <h3 className="text-4xl font-extrabold text-white mt-1">${(stats?.revenue ?? 0).toLocaleString('es-CO')}</h3>
                <p className="text-slate-400 mt-1 text-sm">Ingresos totales registrados</p>
                <div className="mt-4 flex items-center gap-2">
                  <Users className="w-4 h-4 text-primary-light" />
                  <span className="text-slate-300 text-sm">{stats?.members ?? 0} atletas activos</span>
                </div>
              </div>
            </div>
          ) : isTrainer ? (
            <div className="bg-gradient-to-br from-accent/20 to-slate-900 p-6 rounded-3xl border border-accent/20 relative overflow-hidden group">
              <div className="relative z-10">
                <span className="text-white/40 text-xs font-semibold uppercase tracking-wider">Perfil Coach</span>
                <h3 className="text-2xl font-extrabold text-white mt-1">Gestión de Clases</h3>
                <p className="text-slate-500 mt-3 text-sm">Organiza tus sesiones, gestiona participantes y lidera eventos exclusivos.</p>
                <button
                  onClick={() => window.location.href = '/classes'}
                  className="bg-accent hover:bg-accent-light text-white w-full py-2.5 mt-5 text-sm rounded-xl font-bold transition-all shadow-lg active:scale-95"
                >
                  <Calendar className="w-4 h-4 inline mr-2" />
                  Administrar Clases
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-gradient-to-br from-slate-800 to-slate-900 p-6 rounded-3xl border border-white/5 relative overflow-hidden group">
              <div className="relative z-10">
                <span className="text-white/40 text-xs font-semibold uppercase tracking-wider">Membresía Activa</span>
                <h3 className="text-2xl font-extrabold text-white mt-1">
                  {stats?.reservations > 0 ? 'Plan Activo' : 'Sin Plan'}
                </h3>
                <p className="text-slate-500 mt-3 text-sm">
                  {stats?.reservations > 0 ? `${stats.reservations} clases reservadas en total.` : 'Suscríbete para empezar a reservar.'}
                </p>
                <button
                  onClick={() => window.location.href = '/memberships'}
                  className="btn-primary w-full py-2.5 mt-5 text-sm active:scale-95"
                >
                  <CreditCard className="w-4 h-4 inline mr-2" />
                  {stats?.reservations > 0 ? 'Gestionar Plan' : 'Ver Planes'}
                </button>
              </div>
            </div>
          )}

          {/* Acciones Rápidas */}
          <div>
            <h2 className="text-lg font-bold text-white mb-3">Accesos Rápidos</h2>
            <div className="space-y-2">
              <QuickAction label="Ver Clases" icon={Calendar} to="/classes" desc="Reserva tu próxima sesión" />
              <QuickAction label="Explorar Tienda" icon={ShoppingBag} to="/marketplace" desc="Equipamiento deportivo" />
              <QuickAction label="Próximos Eventos" icon={Trophy} to="/events" desc="Torneos y masterclasses" />
              {isOwner && <QuickAction label="Mis Gimnasios" icon={Dumbbell} to="/gyms" desc="Administrar establecimientos" />}
            </div>
          </div>
        </section>
      </div>

      {/* AI Recommendations Panel */}
      <RecommendationsPanel />
    </div>
  );
};

export default Dashboard;
