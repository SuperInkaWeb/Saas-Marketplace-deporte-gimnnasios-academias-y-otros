import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  Plus, 
  Trash2, 
  Activity,
  Users,
  Search,
  ChevronRight,
  Flame,
  Footprints,
  Scale
} from 'lucide-react';
import api from '../../api/api-client';
import { toast } from 'sonner';
import type { HealthMetric, HealthGoal } from '../../types/health';

// Atleta tomado de GET /users (findAll en users.service.ts). Ojo: ese endpoint no
// manda calorías, pasos, peso ni observación, así que esos campos llegan vacíos y la
// pantalla muestra sus valores por defecto (0 kcal, 0 pasos, 70 kg, "Sin observaciones").
interface AuditedAthlete {
  id: string;
  name: string;
  email: string;
  role: string;
  avatarUrl?: string | null;
  totalCaloriesBurned?: number;
  averageSteps?: number;
  weight?: number | null;
  lastObservation?: string | null;
}

interface METConfig {
  id: string;
  name: string;
  metValue: number;
  intensity: string;
  defaultDuration: number;
}

const AdminHealthView: React.FC = () => {
  const [mets, setMets] = useState<METConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);

  // Pestaña activa: met o athletes
  const [activeTab, setActiveTab] = useState<'met' | 'athletes'>('met');

  // Estados para auditar el historial de salud de atletas
  const [athletes, setAthletes] = useState<AuditedAthlete[]>([]);
  const [selectedAthlete, setSelectedAthlete] = useState<AuditedAthlete | null>(null);
  const [athleteMetrics, setAthleteMetrics] = useState<HealthMetric[]>([]);
  const [athleteGoal, setAthleteGoal] = useState<HealthGoal | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [filterType, setFilterType] = useState<string>('ALL');
  const [search, setSearch] = useState('');

  const [newMET, setNewMET] = useState({
    name: '',
    metValue: '',
    intensity: 'MEDIA',
    defaultDuration: '60'
  });

  useEffect(() => {
    fetchMETs();
  }, []);

  useEffect(() => {
    if (activeTab === 'athletes' && athletes.length === 0) {
      fetchAthletes();
    }
  }, [activeTab]);

  const fetchMETs = async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/health/admin/met');
      setMets(data);
    } catch (err) {
      console.error(err);
      toast.error('Error al cargar configuraciones MET');
    } finally {
      setLoading(false);
    }
  };

  const fetchAthletes = async () => {
    try {
      setLoading(true);
      // Admin: fetch all users and filter athletes (role USER)
      const { data } = await api.get<AuditedAthlete[]>('/users');
      const athletes = data.filter((u) => u.role === 'USER');
      setAthletes(athletes);
      if (athletes.length > 0) {
        setSelectedAthlete(athletes[0]);
        fetchAthleteDetails(athletes[0].id);
      }
    } catch (err) {
      console.error(err);
      toast.error('Error al cargar datos de atletas');
    } finally {
      setLoading(false);
    }
  };

  const fetchAthleteDetails = async (athleteId: string) => {
    try {
      setLoadingDetails(true);
      const [metricsRes, goalRes] = await Promise.all([
        api.get(`/health/metrics/${athleteId}`),
        api.get(`/health/goals/${athleteId}`),
      ]);
      setAthleteMetrics(metricsRes.data);
      setAthleteGoal(goalRes.data);
    } catch (err) {
      console.error('Error al cargar detalles del atleta:', err);
      setAthleteMetrics([]);
      setAthleteGoal(null);
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleSelectAthlete = (ath: AuditedAthlete) => {
    setSelectedAthlete(ath);
    fetchAthleteDetails(ath.id);
  };

  const formatLocalDate = (dateStr: string) => {
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

  const getMetricDisplayInfo = (m: HealthMetric) => {
    const targetSteps = athleteGoal?.targetSteps || 10000;
    const targetCalories = athleteGoal?.targetCalories || 600;
    const targetWater = athleteGoal?.targetWater || 8;

    switch (m.type) {
      case 'STEPS': {
        const stepsPercent = Math.round((m.value / targetSteps) * 100);
        return {
          label: 'Pasos Diarios',
          icon: <Footprints className="text-blue-400 w-4 h-4" />,
          badge: (
            <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold ${
              stepsPercent >= 100 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-blue-500/20 text-blue-400'
            }`}>
              {stepsPercent}% de meta ({targetSteps.toLocaleString()})
            </span>
          )
        };
      }
      case 'CALORIES_BURNED': {
        const calPercent = Math.round((m.value / targetCalories) * 100);
        return {
          label: 'Calorías Quemadas',
          icon: <Flame className="text-orange-400 w-4 h-4" />,
          badge: (
            <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold ${
              calPercent >= 100 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-orange-500/20 text-orange-400'
            }`}>
              {calPercent}% de meta ({targetCalories} kcal)
            </span>
          )
        };
      }
      case 'WATER': {
        const waterPercent = Math.round((m.value / targetWater) * 100);
        return {
          label: 'Hidratación Diaria',
          icon: <Activity className="text-cyan-400 w-4 h-4" />,
          badge: (
            <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold ${
              waterPercent >= 100 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-cyan-500/20 text-cyan-400'
            }`}>
              {waterPercent}% de meta ({targetWater} vasos)
            </span>
          )
        };
      }
      case 'WEIGHT':
        return {
          label: 'Peso Corporal',
          icon: <Scale className="text-emerald-400 w-4 h-4" />,
          badge: (
            <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-emerald-500/20 text-emerald-400">
              Control de peso
            </span>
          )
        };
      default:
        return {
          label: m.type,
          icon: <Activity className="text-slate-400 w-4 h-4" />,
          badge: (
            <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-slate-500/20 text-slate-400">
              Registro
            </span>
          )
        };
    }
  };

  const filteredAthletes = athletes.filter(ath =>
    ath.name.toLowerCase().includes(search.toLowerCase()) ||
    ath.email.toLowerCase().includes(search.toLowerCase())
  );

  const filteredMetrics = athleteMetrics.filter(m => filterType === 'ALL' || m.type === filterType);

  const handleAddMET = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMET.name || !newMET.metValue) return;

    try {
      await api.post('/health/admin/met', {
        name: newMET.name,
        metValue: parseFloat(newMET.metValue),
        intensity: newMET.intensity,
        defaultDuration: parseInt(newMET.defaultDuration)
      });
      toast.success('Configuración MET agregada con éxito');
      setNewMET({ name: '', metValue: '', intensity: 'MEDIA', defaultDuration: '60' });
      setShowAddForm(false);
      fetchMETs();
    } catch {
      toast.error('Error al agregar configuración MET');
    }
  };

  const handleDeleteMET = async (id: string) => {
    if (!window.confirm('¿Seguro que deseas eliminar esta actividad MET?')) return;
    try {
      await api.delete(`/health/admin/met/${id}`);
      toast.success('Actividad eliminada');
      fetchMETs();
    } catch {
      toast.error('Error al eliminar actividad');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-16">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent flex items-center gap-2">
          <ShieldCheck className="text-primary w-8 h-8" />
          Configuraciones y Auditoría de Salud
        </h1>
        <p className="text-slate-400">Gestiona la tabla maestra de actividades MET y audita el historial de registros de salud de los alumnos.</p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-white/10 gap-8">
        <button
          onClick={() => setActiveTab('met')}
          className={`pb-4 text-sm font-bold transition-all relative ${
            activeTab === 'met' 
              ? 'text-primary' 
              : 'text-slate-400 hover:text-white'
          }`}
        >
          Valores MET Globales
          {activeTab === 'met' && (
            <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-primary rounded-full" />
          )}
        </button>
        <button
          onClick={() => setActiveTab('athletes')}
          className={`pb-4 text-sm font-bold transition-all relative ${
            activeTab === 'athletes' 
              ? 'text-primary' 
              : 'text-slate-400 hover:text-white'
          }`}
        >
          Auditoría de Historial de Alumnos (Hercix Health)
          {activeTab === 'athletes' && (
            <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-primary rounded-full" />
          )}
        </button>
      </div>

      {activeTab === 'met' ? (
        <>
          <div className="flex justify-end">
            <button 
              onClick={() => setShowAddForm(!showAddForm)}
              className="flex items-center gap-2 bg-primary hover:bg-primary-light text-white px-6 py-3 rounded-xl font-bold transition-all shadow-lg shadow-primary/20"
            >
              <Plus className="w-5 h-5" />
              {showAddForm ? 'Ocultar Formulario' : 'Agregar Actividad'}
            </button>
          </div>

          {/* Add Form */}
          {showAddForm && (
            <form onSubmit={handleAddMET} className="bg-slate-900/50 backdrop-blur-xl border border-white/5 rounded-3xl p-8 grid grid-cols-1 md:grid-cols-4 gap-6 items-end animate-in slide-in-from-top-4 duration-300">
              <div>
                <label className="block text-xs font-bold text-slate-400 mb-2 uppercase tracking-wide">Nombre Actividad</label>
                <input 
                  type="text" 
                  required
                  placeholder="Ej: Spinning, Remo..."
                  className="w-full bg-slate-800 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm"
                  value={newMET.name}
                  onChange={(e) => setNewMET({...newMET, name: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 mb-2 uppercase tracking-wide">Valor MET</label>
                <input 
                  type="number" 
                  step="0.1"
                  required
                  placeholder="Ej: 7.5"
                  className="w-full bg-slate-800 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm"
                  value={newMET.metValue}
                  onChange={(e) => setNewMET({...newMET, metValue: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 mb-2 uppercase tracking-wide">Intensidad</label>
                <select 
                  className="w-full bg-slate-800 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm"
                  value={newMET.intensity}
                  onChange={(e) => setNewMET({...newMET, intensity: e.target.value})}
                >
                  <option value="ALTA">ALTA</option>
                  <option value="MEDIA">MEDIA</option>
                  <option value="BAJA">BAJA</option>
                </select>
              </div>
              <button 
                type="submit"
                className="w-full bg-emerald-500 hover:bg-emerald-400 text-white font-bold py-3.5 rounded-xl transition-all shadow-lg shadow-emerald-500/20 text-sm"
              >
                Guardar Configuración
              </button>
            </form>
          )}

          {/* MET configs Table */}
          <div className="bg-slate-900/50 backdrop-blur-xl border border-white/5 rounded-3xl overflow-hidden p-8">
            <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
              <Activity className="text-primary w-6 h-6" />
              Tabla Maestra de Actividades y Valores MET
            </h3>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-300">
                <thead className="bg-white/5 text-slate-400 font-bold uppercase text-xs">
                  <tr>
                    <th className="px-6 py-4 rounded-l-xl">Actividad</th>
                    <th className="px-6 py-4">Valor MET</th>
                    <th className="px-6 py-4">Intensidad</th>
                    <th className="px-6 py-4">Duración Defecto</th>
                    <th className="px-6 py-4 rounded-r-xl text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {mets.map((met) => (
                    <tr key={met.id} className="hover:bg-white/5 transition-all">
                      <td className="px-6 py-4 font-semibold text-white">{met.name}</td>
                      <td className="px-6 py-4">{met.metValue} MET</td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-[10px] font-bold ${
                          met.intensity === 'ALTA' ? 'bg-red-400/10 text-red-400' :
                          met.intensity === 'MEDIA' ? 'bg-orange-400/10 text-orange-400' :
                          'bg-purple-400/10 text-purple-400'
                        }`}>
                          {met.intensity}
                        </span>
                      </td>
                      <td className="px-6 py-4">{met.defaultDuration} min</td>
                      <td className="px-6 py-4 text-right">
                        <button 
                          onClick={() => handleDeleteMET(met.id)}
                          className="text-red-400 hover:text-red-300 p-2 hover:bg-red-400/10 rounded-xl transition-all"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Athlete Selector */}
          <div className="bg-slate-900/50 backdrop-blur-xl border border-white/5 rounded-3xl p-6 h-[600px] flex flex-col">
            <div className="relative mb-6">
              <Search className="absolute left-4 top-3.5 text-slate-500 w-4 h-4" />
              <input
                type="text"
                placeholder="Buscar atleta..."
                className="w-full bg-slate-800 border border-white/10 rounded-xl pl-11 pr-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
              {filteredAthletes.length > 0 ? (
                filteredAthletes.map((ath) => (
                  <button
                    key={ath.id}
                    onClick={() => handleSelectAthlete(ath)}
                    className={`w-full flex items-center justify-between p-4 rounded-2xl transition-all ${
                      selectedAthlete?.id === ath.id
                        ? 'bg-primary/20 border border-primary/30 text-white'
                        : 'bg-white/5 border border-transparent text-slate-400 hover:bg-white/10'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {ath.avatarUrl ? (
                        <img src={ath.avatarUrl} alt={ath.name} className="w-10 h-10 rounded-full object-cover" />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center font-bold text-white uppercase">
                          {ath.name[0]}
                        </div>
                      )}
                      <div className="text-left">
                        <h4 className="font-bold text-sm text-white">{ath.name}</h4>
                        <p className="text-xs text-slate-500">{ath.email}</p>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 opacity-50" />
                  </button>
                ))
              ) : (
                <p className="text-slate-500 text-xs italic text-center mt-12">No se encontraron atletas.</p>
              )}
            </div>
          </div>

          {/* Right Columns: Athlete Profile Details */}
          <div className="lg:col-span-2 space-y-6">
            {selectedAthlete ? (
              <>
                {/* Profile Card */}
                <div className="bg-slate-900/50 backdrop-blur-xl border border-white/5 rounded-3xl p-8">
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                    <div className="flex items-center gap-4">
                      {selectedAthlete.avatarUrl ? (
                        <img src={selectedAthlete.avatarUrl} alt={selectedAthlete.name} className="w-16 h-16 rounded-full object-cover" />
                      ) : (
                        <div className="w-16 h-16 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center font-bold text-2xl text-white uppercase">
                          {selectedAthlete.name[0]}
                        </div>
                      )}
                      <div>
                        <h2 className="text-2xl font-bold">{selectedAthlete.name}</h2>
                        <p className="text-slate-400 text-sm">Auditoría del historial de rendimiento y salud</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 bg-primary/10 text-primary-light font-bold px-4 py-2 rounded-full text-xs border border-primary/20">
                      <ShieldCheck className="w-4 h-4" /> Cuenta Auditada
                    </div>
                  </div>

                  {/* Grid of stats */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="p-5 bg-white/5 border border-white/5 rounded-2xl flex items-center gap-4">
                      <div className="p-3 bg-orange-500/10 rounded-xl">
                        <Flame className="text-orange-500 w-6 h-6" />
                      </div>
                      <div>
                        <p className="text-xs text-slate-400 uppercase font-bold tracking-wider">Calorías Quemadas</p>
                        <h4 className="text-xl font-bold mt-1">{Math.round(selectedAthlete.totalCaloriesBurned || 0)} kcal</h4>
                      </div>
                    </div>

                    <div className="p-5 bg-white/5 border border-white/5 rounded-2xl flex items-center gap-4">
                      <div className="p-3 bg-blue-500/10 rounded-xl">
                        <Footprints className="text-blue-500 w-6 h-6" />
                      </div>
                      <div>
                        <p className="text-xs text-slate-400 uppercase font-bold tracking-wider">Pasos Promedio</p>
                        <h4 className="text-xl font-bold mt-1">{(selectedAthlete.averageSteps || 0).toLocaleString()}</h4>
                      </div>
                    </div>

                    <div className="p-5 bg-white/5 border border-white/5 rounded-2xl flex items-center gap-4">
                      <div className="p-3 bg-emerald-500/10 rounded-xl">
                        <Scale className="text-emerald-400 w-6 h-6" />
                      </div>
                      <div>
                        <p className="text-xs text-slate-400 uppercase font-bold tracking-wider">Peso Corporal</p>
                        <h4 className="text-xl font-bold mt-1">{selectedAthlete.weight || 70} kg</h4>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Bitácora Histórica del Atleta */}
                <div className="bg-slate-900/50 backdrop-blur-xl border border-white/5 rounded-3xl p-8">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                    <div>
                      <h3 className="text-xl font-bold bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent flex items-center gap-2">
                        <Activity className="text-primary w-5 h-5" />
                        Bitácora Histórica de Salud
                      </h3>
                      <p className="text-slate-400 text-xs mt-1">Historial auditado de todos los datos ingresados por el alumno en Hercix Health</p>
                    </div>
                    {/* Filtros rápidos */}
                    <div className="flex flex-wrap items-center gap-2">
                      {[
                        { type: 'ALL', label: 'Todos' },
                        { type: 'STEPS', label: '🚶 Pasos' },
                        { type: 'CALORIES_BURNED', label: '🔥 Calorías' },
                        { type: 'WATER', label: '💧 Agua' },
                        { type: 'WEIGHT', label: '⚖️ Peso' }
                      ].map((btn) => (
                        <button
                          key={btn.type}
                          type="button"
                          onClick={() => setFilterType(btn.type)}
                          className={`px-3 py-1.5 rounded-xl text-[10px] font-bold transition-all border ${
                            filterType === btn.type
                              ? 'bg-primary border-primary text-white shadow-lg shadow-primary/25 scale-[1.03]'
                              : 'bg-slate-800/60 border-white/5 text-slate-400 hover:text-white hover:bg-slate-700/80'
                          }`}
                        >
                          {btn.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {loadingDetails ? (
                    <div className="flex justify-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-primary"></div>
                    </div>
                  ) : filteredMetrics.length > 0 ? (
                    <div className="overflow-x-auto max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead>
                          <tr className="border-b border-white/10 text-slate-400 uppercase tracking-wider font-extrabold">
                            <th className="py-3 px-3">Fecha</th>
                            <th className="py-3 px-3">Tipo</th>
                            <th className="py-3 px-3 text-right">Valor</th>
                            <th className="py-3 px-3 text-center">Progreso vs Meta</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                          {filteredMetrics.map((m) => {
                            const info = getMetricDisplayInfo(m);
                            return (
                              <tr key={m.id} className="hover:bg-white/5 transition-colors group">
                                <td className="py-3 px-3 text-slate-300 font-medium">
                                  {formatLocalDate(m.date)}
                                </td>
                                <td className="py-3 px-3">
                                  <div className="flex items-center gap-2">
                                    <div className="p-1 rounded bg-white/5 border border-white/10 text-white">
                                      {info.icon}
                                    </div>
                                    <span className="font-bold text-white">{info.label}</span>
                                  </div>
                                </td>
                                <td className="py-3 px-3 text-right font-mono font-bold text-white">
                                  {m.value.toLocaleString()} <span className="text-slate-500 text-[10px] font-sans font-normal ml-1">{m.unit}</span>
                                </td>
                                <td className="py-3 px-3">
                                  <div className="flex items-center justify-center">
                                    {info.badge}
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="text-center py-8 bg-white/5 rounded-2xl border border-white/5">
                      <Activity className="w-8 h-8 text-slate-600 mx-auto mb-2 animate-pulse" />
                      <p className="text-slate-400 font-bold text-sm">No hay registros para este filtro</p>
                      <p className="text-slate-500 text-[10px] mt-0.5">El atleta aún no ha ingresado novedades para esta métrica.</p>
                    </div>
                  )}
                </div>

                {/* Historial de Observaciones pasadas */}
                <div className="bg-slate-900/50 backdrop-blur-xl border border-white/5 rounded-3xl p-8">
                  <div className="flex items-center gap-3 mb-6">
                    <Users className="text-primary w-6 h-6" />
                    <h3 className="text-xl font-bold">Último Reporte del Coach</h3>
                  </div>

                  <div className="p-5 bg-slate-900 border border-white/5 rounded-2xl">
                    <p className="text-xs text-slate-400 uppercase font-bold tracking-wide mb-2">Observación Registrada:</p>
                    <p className="text-slate-300 italic">"{selectedAthlete.lastObservation || 'Sin observaciones registradas aún.'}"</p>
                  </div>
                </div>
              </>
            ) : (
              <div className="bg-slate-900/50 backdrop-blur-xl border border-white/5 rounded-3xl p-12 text-center">
                <Users className="text-slate-600 w-16 h-16 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-slate-400">Selecciona un atleta</h3>
                <p className="text-slate-500 text-sm mt-1">Podrás auditar su historial físico detallado.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminHealthView;
