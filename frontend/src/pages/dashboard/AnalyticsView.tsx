import React, { useState, useEffect } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { ArrowLeft, TrendingUp, Users, Calendar, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/api-client';

const AnalyticsView: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // Primero obtener el gym del dueño
        const { data: gyms } = await api.get('/gyms'); // o /gyms si el backend filtra por auth token
        const ownerGyms = gyms.filter((g: any) => typeof g.ownerId === 'string' || g.ownerId); // Simplification, backend /gyms gives user gyms
        const gymId = ownerGyms.length > 0 ? ownerGyms[0].id : gyms[0]?.id;

        if (gymId) {
          const { data: analyticsData } = await api.get(`/analytics/gym/${gymId}/dashboard`);
          setStats(analyticsData);
        }
      } catch (error) {
        console.error('Error fetching analytics:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

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
      <div className="flex items-center gap-4">
        <button onClick={() => navigate(-1)} className="p-2 bg-white/5 rounded-full hover:bg-white/10 transition-colors">
          <ArrowLeft className="w-5 h-5 text-white" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-white">Analítica Avanzada</h1>
          <p className="text-slate-400 text-sm">Resumen de rendimiento de tu gimnasio</p>
        </div>
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
              formatter={(value: any) => [formatCurrency(value), 'MRR']}
            />
            <Area type="monotone" dataKey="MRR" stroke="#818cf8" fillOpacity={1} fill="url(#colorMRR)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default AnalyticsView;
