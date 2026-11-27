import React, { useState, useEffect } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { ArrowLeft, TrendingUp, Users, Calendar, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/api-client';
import { useAuth } from '../../context/auth-context';
import { toast } from 'sonner';
import type { Gym } from '../../types/gym';

// GET /analytics/gym/:gymId/dashboard (ver analytics.service.ts del backend).
// Si no hay gimnasios, la pantalla guarda solo { hasGyms: false }.
interface GymAnalytics {
  hasGyms?: boolean;
  activeMembers?: number;
  monthlyRecurringRevenue: number;
  totalClasses?: number;
  reservationsCount: number;
  retentionRate: number;
  mrrGrowth: number;
  chartData?: { name: string; MRR: number; attendees: number; newMembers: number }[];
}

const AnalyticsView: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [gyms, setGyms] = useState<Gym[]>([]);
  const [selectedGymId, setSelectedGymId] = useState<string>('');
  const [stats, setStats] = useState<GymAnalytics | null>(null);

  const fetchAnalytics = async (gymId: string) => {
    try {
      setLoading(true);
      const { data: analyticsData } = await api.get(`/analytics/gym/${gymId}/dashboard`);
      setStats(analyticsData);
    } catch (error) {
      console.error('Error fetching analytics:', error);
      toast.error('Error al cargar la analítica del gimnasio');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const fetchGyms = async () => {
      if (!user) return;
      try {
        setLoading(true);
        // Admin ve todos los gimnasios; Dueño solo los suyos
        const url = user.role === 'ADMIN' ? '/gyms' : `/gyms?ownerId=${user.id}`;
        const { data } = await api.get<Gym[]>(url);
        setGyms(data);
        
        if (data && data.length > 0) {
          setSelectedGymId(data[0].id);
          const { data: analyticsData } = await api.get(`/analytics/gym/${data[0].id}/dashboard`);
          setStats(analyticsData);
        } else {
          setStats({ hasGyms: false } as GymAnalytics);
        }
      } catch (error) {
        console.error('Error fetching gyms or analytics:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchGyms();
  }, [user]);

  const handleGymChange = async (gymId: string) => {
    setSelectedGymId(gymId);
    await fetchAnalytics(gymId);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
        <Loader2 className="w-10 h-10 text-primary-light animate-spin" />
        <p className="text-slate-400">Calculando métricas avanzadas...</p>
      </div>
    );
  }

  // Onboarding screen if no gyms exist on the platform
  if (stats && stats.hasGyms === false) {
    const isAdmin = user?.role === 'ADMIN';
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center max-w-md mx-auto space-y-6 animate-in fade-in duration-500">
        <div className="w-20 h-20 bg-primary/10 rounded-[2rem] flex items-center justify-center text-primary-light border border-primary/20 shadow-xl shadow-primary/5">
          <TrendingUp className="w-10 h-10 animate-pulse" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-black text-white tracking-tight">
            {isAdmin ? 'Sin Gimnasios en la Plataforma' : 'Sin Negocios Registrados'}
          </h2>
          <p className="text-slate-400 text-sm leading-relaxed">
            {isAdmin
              ? 'Aún no hay gimnasios registrados en la plataforma. Cuando los dueños registren sus negocios, verás la analítica aquí.'
              : 'Para poder calcular tu analítica avanzada (MRR, retención de atletas, y clases asistidas), primero necesitas registrar al menos un gimnasio en la plataforma.'}
          </p>
        </div>
        {!isAdmin && (
          <button 
            onClick={() => navigate('/gyms')} 
            className="btn-primary px-8 py-3.5 font-bold rounded-2xl active:scale-95 transition-transform flex items-center gap-2 shadow-lg shadow-primary/20"
          >
            Registrar mi primer gimnasio
          </button>
        )}
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="text-center mt-20">
        <h2 className="text-xl text-white">No se pudo cargar la analítica.</h2>
        <button onClick={() => navigate(-1)} className="mt-4 text-primary-light underline">Volver</button>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-20">
      {/* Header and Gym Selector */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="p-2 bg-white/5 rounded-full hover:bg-white/10 transition-colors">
            <ArrowLeft className="w-5 h-5 text-white" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-white">Analítica Avanzada</h1>
            <p className="text-slate-400 text-sm">Resumen de rendimiento de tu gimnasio</p>
          </div>
        </div>

        {gyms.length > 1 && (
          <div className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-2xl px-4 py-2 self-start md:self-auto">
            <span className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Sede:</span>
            <select
              value={selectedGymId}
              onChange={(e) => handleGymChange(e.target.value)}
              className="bg-transparent text-sm font-bold text-white outline-none cursor-pointer pr-2"
            >
              {gyms.map((g) => (
                <option key={g.id} value={g.id} className="bg-slate-900 text-white">
                  {g.name}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-md">
          <div className="flex items-center gap-3 text-primary-light mb-2">
            <TrendingUp />
            <h3 className="font-bold">MRR Actual</h3>
          </div>
          <p className="text-3xl font-extrabold text-white">{formatCurrency(stats.monthlyRecurringRevenue)}</p>
          <span className="text-green-400 text-xs font-semibold px-2 py-0.5 bg-green-500/10 rounded-full">
            {stats.mrrGrowth >= 0 ? `+${stats.mrrGrowth}%` : `${stats.mrrGrowth}%`} vs mes anterior
          </span>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-md">
          <div className="flex items-center gap-3 text-secondary-light mb-2">
            <Users />
            <h3 className="font-bold">Retención Activa</h3>
          </div>
          <p className="text-3xl font-extrabold text-white">{stats.retentionRate}%</p>
          <span className="text-green-400 text-xs font-semibold px-2 py-0.5 bg-green-500/10 rounded-full">Calculado a 30 días</span>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-md">
          <div className="flex items-center gap-3 text-accent transition-colors mb-2">
            <Calendar />
            <h3 className="font-bold">Clases Asistidas</h3>
          </div>
          <p className="text-3xl font-extrabold text-white">{stats.reservationsCount}</p>
        </div>
      </div>

      <div className="bg-white/5 border border-white/10 rounded-3xl p-6 backdrop-blur-xl h-[400px]">
        <h3 className="text-xl font-bold text-white mb-6">Crecimiento de MRR (6 Meses)</h3>
        <ResponsiveContainer width="100%" height="85%">
          <AreaChart data={stats.chartData || []} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="colorMRR" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
            <XAxis dataKey="name" stroke="#64748b" />
            <YAxis stroke="#64748b" tickFormatter={(value) => `$${value/1000}k`} />
            <Tooltip 
              contentStyle={{ backgroundColor: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
              itemStyle={{ color: '#fff' }}
              formatter={(value) => [formatCurrency(value as number), 'MRR']}
            />
            <Area type="monotone" dataKey="MRR" stroke="#818cf8" fillOpacity={1} fill="url(#colorMRR)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default AnalyticsView;
