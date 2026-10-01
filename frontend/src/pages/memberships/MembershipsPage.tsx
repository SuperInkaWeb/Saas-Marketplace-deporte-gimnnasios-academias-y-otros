import React, { useState, useEffect } from 'react';
import api from '../../api/api-client';
import { useAuth } from '../../context/auth-context';
import { 
  CreditCard, 
  CheckCircle2, 
  ShieldCheck, 
  Zap, 
  Crown, 
  Loader2, 
  Calendar,
  Users,
  DollarSign,
  Search,
  Trash2,
  Edit,
  Plus,
  TrendingUp,
  Sliders,
  Database
} from 'lucide-react';
import { motion } from 'framer-motion';
import { AddPlanModal } from '../../components/gyms/AddPlanModal';

const formatDate = (dateStr: string) => {
  if (!dateStr) return 'N/A';
  const parts = dateStr.split('T')[0].split('-');
  if (parts.length === 3) {
    const year = parseInt(parts[0]);
    const month = parseInt(parts[1]) - 1;
    const day = parseInt(parts[2]);
    const dateObj = new Date(year, month, day);
    return dateObj.toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });
  }
  return new Date(dateStr).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });
};

// Componente Tarjeta de Plan Individual para Clientes
const PlanCard: React.FC<{ plan: any; onSubscribe: (id: string) => void }> = ({ plan, onSubscribe }) => (
  <motion.div 
    whileHover={{ scale: 1.02 }}
    className={`glass-card p-8 flex flex-col border-white/5 relative overflow-hidden transition-all ${
      plan.name === 'Premium Élite' ? 'ring-2 ring-primary-light/50 border-primary-light/20 shadow-2xl shadow-primary/20' : ''
    }`}
  >
    {plan.name === 'Premium Élite' && (
      <div className="absolute top-4 right-4 bg-primary-light text-white text-[10px] font-bold px-2 py-1 rounded-full uppercase">
        Más Popular
      </div>
    )}
    
    <div className="flex items-center gap-3 mb-6">
      <div className={`p-3 rounded-xl ${plan.name === 'Premium Élite' ? 'bg-primary/20 text-primary-light' : 'bg-white/5 text-slate-400'}`}>
        {plan.name === 'Premium Élite' ? <Crown /> : plan.name === 'Estándar' ? <Zap /> : <ShieldCheck />}
      </div>
      <div>
        <h3 className="text-xl font-bold text-white">{plan.name}</h3>
        <span className="text-[11px] text-slate-400 block mt-1 font-semibold tracking-wider uppercase">
          Plataforma Hercix
        </span>
      </div>
    </div>

    <div className="mb-6">
      <div className="flex items-baseline gap-1">
        <span className="text-4xl font-extrabold text-white">${Number(plan.price).toFixed(0)}</span>
        <span className="text-slate-500 text-sm">/ {plan.durationDays} días</span>
      </div>
      <p className="text-slate-400 text-sm mt-3">{plan.description || 'Acceso completo a las instalaciones.'}</p>
    </div>

    <ul className="space-y-4 mb-8 flex-grow">
      <li className="flex items-center gap-3 text-slate-300 text-sm">
        <CheckCircle2 className="w-4 h-4 text-primary-light" />
        <span>Acceso a {plan.maxClasses || 'ilimitadas'} clases</span>
      </li>
      <li className="flex items-center gap-3 text-slate-300 text-sm">
        <CheckCircle2 className="w-4 h-4 text-primary-light" />
        <span>Gimnasio: Toda la red Hercix</span>
      </li>
      {plan.includesMarketplace && (
        <li className="flex items-center gap-3 text-slate-300 text-sm">
          <CheckCircle2 className="w-4 h-4 text-primary-light" />
          <span>Descuento en tienda</span>
        </li>
      )}
    </ul>

    <button 
      onClick={() => onSubscribe(plan.id)}
      className={`w-full py-3 rounded-xl font-bold transition-all active:scale-95 ${
        plan.name === 'Premium Élite' ? 'btn-primary shadow-lg shadow-primary/30' : 'bg-white/5 hover:bg-white/10 text-white'
      }`}
    >
      Seleccionar Plan
    </button>
  </motion.div>
);

export const MembershipsPage: React.FC = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';

  // State
  const [plans, setPlans] = useState<any[]>([]);
  const [allMemberships, setAllMemberships] = useState<any[]>([]);
  const [gyms, setGyms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);
  
  // Client selection flow
const [payingPlanId, setPayingPlanId] = useState<string | null>(null);

  // Admin Dashboard Tabs & Filters
  const [activeTab, setActiveTab] = useState<'tracking' | 'plans_config'>('tracking');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [gymFilter, setGymFilter] = useState('ALL');

  // Modal control for Admin
  const [isAddPlanOpen, setIsAddPlanOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<any | null>(null);
  const [targetGymId, setTargetGymId] = useState<string>('');

  const fetchPlans = async () => {
    try {
      const { data } = await api.get('/memberships/plans');
      setPlans(data);
    } catch (err) {
      console.error('Error fetching plans:', err);
    }
  };

  const fetchAllMemberships = async () => {
    if (!isAdmin) return;
    try {
      const { data } = await api.get('/memberships/all');
      setAllMemberships(data);
    } catch (err) {
      console.error('Error fetching admin memberships:', err);
    }
  };

  const fetchGyms = async () => {
    if (!isAdmin) return;
    try {
      const { data } = await api.get('/gyms');
      setGyms(data);
      if (data.length > 0) {
        setTargetGymId(data[0].id);
      }
    } catch (err) {
      console.error('Error fetching gyms:', err);
    }
  };

  const loadData = async () => {
    setLoading(true);
    await Promise.all([
      fetchPlans(),
      fetchAllMemberships(),
      fetchGyms()
    ]);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, [isAdmin]);

const handleOpenPayMe = async (planId: string) => {
  if (payingPlanId) return; // evita doble clic
  setPayingPlanId(planId);
  try {
    const { data } = await api.post('/payments/mercadopago/membership-checkout', { planId });
    if (!data?.checkoutUrl) throw new Error('La respuesta no trae checkoutUrl');
    window.location.href = data.checkoutUrl;
  } catch (err) {
    console.error('Error iniciando checkout:', err);
    alert('No se pudo iniciar el pago con Mercado Pago.');
    setPayingPlanId(null);
  }
};

  // Admin Plan Management
  const handleEditPlan = (plan: any) => {
    setEditingPlan(plan);
    setTargetGymId(plan.gymId);
    setIsAddPlanOpen(true);
  };

  const handleDeletePlan = async (planId: string) => {
    if (!window.confirm('¿Seguro que deseas eliminar este plan de membresía? Se archivará para evitar nuevas suscripciones.')) return;
    try {
      await api.delete(`/memberships/plans/${planId}`);
      setMessage('Plan de membresía eliminado.');
      fetchPlans();
      setTimeout(() => setMessage(null), 3000);
    } catch (err) {
      alert('Error al eliminar el plan de membresía.');
    }
  };

  // Metrics Calculations for Admin
  const activeMembershipsCount = allMemberships.filter(m => m.status === 'ACTIVE').length;
  const expiredMembershipsCount = allMemberships.filter(m => m.status === 'EXPIRED').length;
  const totalRevenue = allMemberships.reduce((sum, m) => {
    const paymentSum = m.payments?.reduce((s: number, p: any) => p.status === 'COMPLETED' ? s + Number(p.amount) : s, 0) || 0;
    return sum + paymentSum;
  }, 0);
  const totalAthletesCount = new Set(allMemberships.map(m => m.userId)).size;

  // Filtered memberships for admin table
  const filteredMemberships = allMemberships.filter(m => {
    const athleteName = m.user?.name || '';
    const athleteEmail = m.user?.email || '';
    const gymName = m.plan?.gym?.name || '';
    const planName = m.plan?.name || '';
    
    const matchesSearch = 
      athleteName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      athleteEmail.toLowerCase().includes(searchQuery.toLowerCase()) ||
      gymName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      planName.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === 'ALL' || m.status === statusFilter;
    const matchesGym = gymFilter === 'ALL' || m.plan?.gymId === gymFilter;

    return matchesSearch && matchesStatus && matchesGym;
  });

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="text-primary w-12 h-12 animate-spin" />
      </div>
    );
  }

  // --- VISTA ADMINISTRADOR ---
  if (isAdmin) {
    return (
      <div className="space-y-8 animate-in fade-in duration-300">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-6">
          <div>
            <h1 className="text-3xl font-extrabold text-white flex items-center gap-3">
              <Sliders className="text-primary-light" /> Control de Membresías (Admin)
            </h1>
            <p className="text-slate-400 mt-2">Monitoreo global de ingresos, atletas, suscripciones y configuración de planes.</p>
          </div>
          {activeTab === 'plans_config' && (
            <button
              onClick={() => {
                setEditingPlan(null);
                if (gyms.length > 0) {
                  setTargetGymId(gyms[0].id);
                }
                setIsAddPlanOpen(true);
              }}
              className="btn-primary flex items-center gap-2"
            >
              <Plus className="w-5 h-5" /> Registrar Plan
            </button>
          )}
        </header>

        {message && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-xl text-emerald-400 text-center font-bold">
            {message}
          </motion.div>
        )}

        {/* METRICS DASHBOARD */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="glass-card p-6 border-white/5 flex items-center gap-4">
            <div className="p-3 bg-emerald-500/10 rounded-2xl text-emerald-400">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <div>
              <p className="text-slate-500 text-xs font-bold uppercase tracking-wider">Membresías Activas</p>
              <h3 className="text-2xl font-extrabold text-white mt-1">{activeMembershipsCount}</h3>
            </div>
          </div>

          <div className="glass-card p-6 border-white/5 flex items-center gap-4">
            <div className="p-3 bg-primary/10 rounded-2xl text-primary-light">
              <DollarSign className="w-8 h-8" />
            </div>
            <div>
              <p className="text-slate-500 text-xs font-bold uppercase tracking-wider">Recaudación Total</p>
              <h3 className="text-2xl font-extrabold text-white mt-1">${totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h3>
            </div>
          </div>

          <div className="glass-card p-6 border-white/5 flex items-center gap-4">
            <div className="p-3 bg-blue-500/10 rounded-2xl text-blue-400">
              <Users className="w-8 h-8" />
            </div>
            <div>
              <p className="text-slate-500 text-xs font-bold uppercase tracking-wider">Atletas Inscritos</p>
              <h3 className="text-2xl font-extrabold text-white mt-1">{totalAthletesCount}</h3>
            </div>
          </div>

          <div className="glass-card p-6 border-white/5 flex items-center gap-4">
            <div className="p-3 bg-orange-500/10 rounded-2xl text-orange-400">
              <TrendingUp className="w-8 h-8" />
            </div>
            <div>
              <p className="text-slate-500 text-xs font-bold uppercase tracking-wider">Membresías Expiradas</p>
              <h3 className="text-2xl font-extrabold text-white mt-1">{expiredMembershipsCount}</h3>
            </div>
          </div>
        </section>

        {/* TABS SELECTOR */}
        <div className="flex gap-4 border-b border-white/10 pb-2">
          <button
            onClick={() => setActiveTab('tracking')}
            className={`pb-2 px-1 font-extrabold text-sm transition-all border-b-2 ${
              activeTab === 'tracking'
                ? 'border-primary-light text-white'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            📋 Historial y Seguimiento
          </button>
          <button
            onClick={() => setActiveTab('plans_config')}
            className={`pb-2 px-1 font-extrabold text-sm transition-all border-b-2 ${
              activeTab === 'plans_config'
                ? 'border-primary-light text-white'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            ⚙️ Configuración de Planes
          </button>
        </div>

        {/* TAB 1: HISTORIAL Y SEGUIMIENTO */}
        {activeTab === 'tracking' && (
          <div className="space-y-6">
            {/* Filters */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="relative md:col-span-2">
                <Search className="absolute top-1/2 left-4 -translate-y-1/2 text-slate-500 w-5 h-5" />
                <input 
                  type="text"
                  placeholder="Buscar por atleta, gimnasio o plan..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-white/5 border-white/10 focus:border-primary-light w-full py-3.5 pr-4 pl-12 border rounded-2xl text-white outline-none transition-all"
                />
              </div>

              <div>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="bg-slate-900 border border-white/10 focus:border-primary-light w-full py-3.5 px-4 rounded-2xl text-white outline-none transition-all cursor-pointer"
                >
                  <option value="ALL">Todos los Estatus</option>
                  <option value="ACTIVE">Activo</option>
                  <option value="EXPIRED">Expirado</option>
                  <option value="CANCELLED">Cancelado</option>
                </select>
              </div>

              <div>
                <select
                  value={gymFilter}
                  onChange={(e) => setGymFilter(e.target.value)}
                  className="bg-slate-900 border border-white/10 focus:border-primary-light w-full py-3.5 px-4 rounded-2xl text-white outline-none transition-all cursor-pointer"
                >
                  <option value="ALL">Todos los Gimnasios</option>
                  {gyms.map(gym => (
                    <option key={gym.id} value={gym.id}>{gym.name}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Memberships Table */}
            {filteredMemberships.length > 0 ? (
              <div className="glass-card overflow-x-auto border-white/5 rounded-3xl">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-white/10 text-slate-400 text-xs font-bold uppercase bg-white/5">
                      <th className="py-4 px-6">Atleta</th>
                      <th className="py-4 px-6">Gimnasio</th>
                      <th className="py-4 px-6">Plan Adquirido</th>
                      <th className="py-4 px-6">Fecha Adquisición</th>
                      <th className="py-4 px-6">Acceso</th>
                      <th className="py-4 px-6">Pago</th>
                      <th className="py-4 px-6">Estatus</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 text-sm">
                    {filteredMemberships.map((m) => {
                      const totalPaid = m.payments?.reduce((s: number, p: any) => p.status === 'COMPLETED' ? s + Number(p.amount) : s, 0) || 0;
                      const hasPaid = m.payments?.some((p: any) => p.status === 'COMPLETED');
                      const txId = m.payments?.[0]?.gatewayTxId || 'N/A';
                      
                      return (
                        <tr key={m.id} className="hover:bg-white/5 transition-colors">
                          <td className="py-4 px-6">
                            <div className="font-extrabold text-white">{m.user?.name || 'Usuario'}</div>
                            <div className="text-xs text-slate-500">{m.user?.email}</div>
                          </td>
                          <td className="py-4 px-6 text-slate-300 font-medium">{m.plan?.gym?.name || 'N/A'}</td>
                          <td className="py-4 px-6">
                            <div className="font-bold text-white">{m.plan?.name}</div>
                            <div className="text-xs text-slate-500">${Number(m.plan?.price).toFixed(2)} / {m.plan?.durationDays} días</div>
                          </td>
                          <td className="py-4 px-6 text-slate-400">{formatDate(m.createdAt)}</td>
                          <td className="py-4 px-6">
                            <div className="flex items-center gap-1.5 text-xs text-slate-300">
                              <Calendar className="w-3.5 h-3.5 text-primary-light" />
                              <span>{formatDate(m.startedAt)} - {formatDate(m.expiresAt)}</span>
                            </div>
                          </td>
                          <td className="py-4 px-6">
                            <div className={`text-xs font-extrabold inline-block px-2.5 py-1 rounded-full ${
                              hasPaid ? 'bg-emerald-500/20 text-emerald-400' : 'bg-yellow-500/20 text-yellow-400'
                            }`}>
                              ${totalPaid.toFixed(2)} - {hasPaid ? 'Completado' : 'Pendiente'}
                            </div>
                            <div className="text-[10px] text-slate-500 mt-1">Tx: {txId}</div>
                          </td>
                          <td className="py-4 px-6">
                            <span className={`text-[10px] font-extrabold px-2.5 py-1 rounded-full uppercase tracking-wider ${
                              m.status === 'ACTIVE'
                                ? 'bg-emerald-500/20 text-emerald-400'
                                : m.status === 'EXPIRED'
                                ? 'bg-orange-500/20 text-orange-400'
                                : 'bg-red-500/20 text-red-400'
                            }`}>
                              {m.status === 'ACTIVE' ? 'Activa' : m.status === 'EXPIRED' ? 'Expirada' : 'Cancelada'}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="glass-card p-20 flex flex-col items-center justify-center text-center">
                <Database className="text-slate-700 w-16 h-16 mb-4" />
                <h3 className="text-white font-bold text-lg">No se encontraron membresías</h3>
                <p className="text-slate-500 text-sm mt-1">Intenta ajustando los filtros de búsqueda.</p>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: CONFIGURACIÓN DE PLANES */}
        {activeTab === 'plans_config' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {plans.map(plan => (
                <div key={plan.id} className="glass-card p-6 flex flex-col border-white/5 relative justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-[10px] bg-primary/20 text-primary-light font-extrabold px-2.5 py-1 rounded-full uppercase">
                        {plan.gym?.name || 'Hercix'}
                      </span>
                      <div className="flex gap-2">
                        <button 
                          onClick={() => handleEditPlan(plan)}
                          className="p-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition-colors"
                          title="Editar Plan"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button 
                          onClick={() => handleDeletePlan(plan.id)}
                          className="p-1.5 bg-red-500/10 hover:bg-red-500 text-red-400 hover:text-white rounded-lg transition-colors"
                          title="Eliminar Plan"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <h3 className="text-lg font-bold text-white">{plan.name}</h3>
                    <p className="text-slate-400 text-xs mt-1 min-h-[32px]">{plan.description || 'Sin descripción.'}</p>
                    
                    <div className="my-4 flex items-baseline gap-1">
                      <span className="text-2xl font-extrabold text-white">${Number(plan.price).toFixed(2)}</span>
                      <span className="text-slate-500 text-xs">/ {plan.durationDays} días</span>
                    </div>

                    <ul className="space-y-2 text-xs text-slate-300">
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-primary-light" />
                        <span>Clases: {plan.maxClasses || 'Ilimitadas'}</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-primary-light" />
                        <span>Marketplace: {plan.includesMarketplace ? 'Incluido' : 'No Incluido'}</span>
                      </li>
                    </ul>
                  </div>

                  <div className="mt-6 border-t border-white/5 pt-4 flex justify-between text-[11px] text-slate-500">
                    <span>Estado:</span>
                    <span className="text-emerald-400 font-bold uppercase">Activo</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Modal para Crear/Editar Planes */}
        {isAddPlanOpen && (
          <AddPlanModal 
            isOpen={isAddPlanOpen}
            onClose={() => {
              setIsAddPlanOpen(false);
              setEditingPlan(null);
            }}
            onSuccess={() => {
              fetchPlans();
              setMessage(editingPlan ? '¡Plan de membresía modificado con éxito!' : '¡Nuevo plan de membresía añadido con éxito!');
              setTimeout(() => setMessage(null), 3000);
              setEditingPlan(null);
            }}
            gymId={targetGymId}
            initialData={editingPlan}
          />
        )}
      </div>
    );
  }

  // --- VISTA CLIENTE / ATLETA ---
  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      <header className="text-center max-w-2xl mx-auto space-y-4 mb-12">
        <h1 className="text-4xl font-extrabold text-white tracking-tight">Planes de Membresía</h1>
        <p className="text-slate-400">Escoge el nivel que mejor se adapte a tu estilo de vida y objetivos fitness.</p>
      </header>

      {message && (
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="bg-primary/20 border border-primary-light/30 p-4 rounded-xl text-primary-light text-center font-bold">
          {message}
        </motion.div>
      )}

      {plans.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {plans.map(plan => (
            <PlanCard key={plan.id} plan={plan} onSubscribe={handleOpenPayMe} />
          ))}
        </div>
      ) : (
        <div className="glass-card p-20 flex flex-col items-center justify-center text-center">
          <CreditCard className="text-slate-700 w-16 h-16 mb-4" />
          <h2 className="text-white font-bold text-xl">No hay planes disponibles en este momento</h2>
        </div>
      )}

      {/* Benefits Section */}
      <section className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-10 border-t border-white/5 pt-20">
        <div className="flex flex-col items-center text-center space-y-4">
          <div className="p-4 bg-primary/10 rounded-full text-primary-light"><ShieldCheck className="w-8 h-8" /></div>
          <h3 className="text-white font-bold">Pagos Seguros</h3>
          <p className="text-slate-500 text-sm">Transacciones encriptadas de extremo a extremo.</p>
        </div>
        <div className="flex flex-col items-center text-center space-y-4">
          <div className="p-4 bg-secondary/10 rounded-full text-secondary-light"><Zap className="w-8 h-8" /></div>
          <h3 className="text-white font-bold">Acceso Instantáneo</h3>
          <p className="text-slate-500 text-sm">Activa tu membresía y empieza a entrenar al momento.</p>
        </div>
        <div className="flex flex-col items-center text-center space-y-4">
          <div className="p-4 bg-accent/10 rounded-full text-accent-light"><Calendar className="text-accent-light" /></div>
          <h3 className="text-white font-bold">Flexibilidad Total</h3>
          <p className="text-slate-500 text-sm">Cancela o cambia de plan en cualquier momento.</p>
        </div>
      </section>
    </div>
  );
};

export default MembershipsPage;
