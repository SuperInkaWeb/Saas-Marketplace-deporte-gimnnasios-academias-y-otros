import React, { useState, useEffect } from 'react';

import { ArrowLeft, Users, Building, TrendingUp, UserPlus, Loader2, ShieldCheck, Dumbbell, Star, type LucideIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/api-client';

// GET /analytics/platform/overview (getPlatformStats en analytics.service.ts).
interface PlatformStats {
  totalUsers: number;
  usersByRole: { role: string; count: number }[];
  totalGyms: number;
  totalRevenue: number;
  newUsersLast30Days: number;
}

const StatCard: React.FC<{ label: string; value: string | number; icon: LucideIcon; color?: string; subValue?: string }> = ({ label, value, icon: Icon, color = 'primary', subValue }) => {
  const colorMap: Record<string, string> = {
    primary: 'bg-primary/10 text-primary-light border-primary/20',
    secondary: 'bg-secondary/10 text-secondary-light border-secondary/20',
    accent: 'bg-accent/10 text-accent border-accent/20',
    green: 'bg-green-500/10 text-green-400 border-green-500/20',
  };
  const cls = colorMap[color] || colorMap.primary;

  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-md hover:bg-white/10 transition-all">
      <div className="flex items-center gap-3 mb-2">
        <div className={`p-2 rounded-lg ${cls}`}>
          <Icon className="w-5 h-5" />
        </div>
        <h3 className="font-bold text-slate-300">{label}</h3>
      </div>
      <p className="text-3xl font-extrabold text-white mt-2">{value}</p>
      {subValue && (
        <span className="inline-block mt-2 text-green-400 text-xs font-semibold px-2 py-0.5 bg-green-500/10 rounded-full">
          {subValue}
        </span>
      )}
    </div>
  );
};

const PlatformOverviewView: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<PlatformStats | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const { data } = await api.get('/analytics/platform/overview');
        setStats(data);
      } catch (error) {
        console.error('Error fetching platform stats:', error);
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
        <p className="text-slate-400">Cargando métricas de la plataforma...</p>
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

  const roleLabels: Record<string, string> = {
    ADMIN: 'Administradores',
    GYM_OWNER: 'Dueños de Gimnasios',
    TRAINER: 'Entrenadores',
    USER: 'Atletas / Usuarios'
  };

  const roleIcons: Record<string, LucideIcon> = {
    ADMIN: ShieldCheck,
    GYM_OWNER: Building,
    TRAINER: Star,
    USER: Dumbbell
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-20">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate(-1)} className="p-2 bg-white/5 rounded-full hover:bg-white/10 transition-colors">
          <ArrowLeft className="w-5 h-5 text-white" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <TrendingUp className="text-primary-light" />
            Resumen de Plataforma (SaaS)
          </h1>
          <p className="text-slate-400 text-sm">Vista global de usuarios, gimnasios y finanzas (Solo Super-Admin)</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          label="Total Usuarios" 
          value={stats.totalUsers} 
          icon={Users} 
          color="primary"
          subValue={`+${stats.newUsersLast30Days} en los últimos 30 días`}
        />
        <StatCard 
          label="Gimnasios Registrados" 
          value={stats.totalGyms} 
          icon={Building} 
          color="secondary" 
        />
        <StatCard 
          label="Ingresos Totales (SaaS)" 
          value={formatCurrency(stats.totalRevenue)} 
          icon={TrendingUp} 
          color="green" 
        />
        <StatCard 
          label="Nuevos Usuarios (Mes)" 
          value={stats.newUsersLast30Days} 
          icon={UserPlus} 
          color="accent" 
        />
      </div>

      <div className="bg-white/5 border border-white/10 rounded-3xl p-6 backdrop-blur-xl mt-8">
        <h3 className="text-xl font-bold text-white mb-6">Distribución de Usuarios</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.usersByRole.map((roleInfo) => {
            const Icon = roleIcons[roleInfo.role] || Users;
            return (
              <div key={roleInfo.role} className="bg-slate-800/50 p-4 rounded-xl border border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="bg-white/10 p-2 rounded-lg text-slate-300">
                    <Icon className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-slate-400 text-xs font-semibold">{roleLabels[roleInfo.role] || roleInfo.role}</p>
                    <p className="text-white font-bold text-xl">{roleInfo.count}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default PlatformOverviewView;
