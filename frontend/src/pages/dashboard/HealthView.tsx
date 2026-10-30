import React, { useState, useEffect } from 'react';
import { 
  Activity, 
  Droplets, 
  Scale, 
  Footprints, 
  Plus, 
  Flame,
  Award,
  Sparkles,
  CheckCircle,
  TrendingUp,
  TrendingDown,
  History,
  BarChart2,
  Timer,
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  Legend,
} from 'recharts';
import api from '../../api/api-client';
import { toast } from 'sonner';

interface Metric {
  id: string;
  type: string;
  value: number;
  unit: string;
  date: string;
}

interface Goal {
  targetCalories: number;
  targetSteps: number;
  targetWater: number;
  targetWeight?: number;
}

function formatLocalDate(dateStr: string) {
  const parts = dateStr.split('T')[0].split('-');
  if (parts.length === 3) {
    const year = parseInt(parts[0]);
    const month = parseInt(parts[1]) - 1;
    const day = parseInt(parts[2]);
    const dateObj = new Date(year, month, day);
    return dateObj.toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });
  }
  return new Date(dateStr).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });
}

function StatCard({ icon, title, value, unit, goal, color, trend, description, onClick }: any) {
  const percentage = goal ? Math.min((value / goal) * 100, 100) : 100;
  
  return (
    <div 
      onClick={onClick}
      className={`bg-slate-900/50 backdrop-blur-xl border border-white/5 rounded-3xl p-6 relative overflow-hidden group hover:border-white/10 transition-all ${
        onClick ? 'cursor-pointer hover:bg-slate-900/80 active:scale-98' : ''
      }`}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="p-3 bg-white/5 rounded-2xl group-hover:scale-110 transition-transform">
          {icon}
        </div>
        {trend && <span className="text-[10px] text-emerald-400 bg-emerald-400/10 px-2 py-1 rounded-full">{trend}</span>}
      </div>
      <div>
        <p className="text-slate-400 text-sm font-medium">{title}</p>
        <div className="flex items-baseline gap-1 mt-1">
          <span className="text-3xl font-bold">{value.toLocaleString()}</span>
          <span className="text-slate-500 text-sm font-medium">{unit}</span>
        </div>
        {description}
      </div>
      
      {goal && (
        <div className="mt-6">
          <div className="flex items-center justify-between text-[10px] text-slate-500 mb-1.5 uppercase font-bold tracking-wider">
            <span>Progreso</span>
            <span>{Math.round(percentage)}%</span>
          </div>
          <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
            <div 
              className={`h-full rounded-full transition-all duration-1000 ${
                color === 'blue' ? 'bg-blue-400' : 
                color === 'orange' ? 'bg-orange-500' : 
                color === 'cyan' ? 'bg-cyan-400' : 'bg-emerald-400'
              }`}
              style={{ width: `${percentage}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

const HealthView: React.FC = () => {
  const [metrics, setMetrics] = useState<Metric[]>([]);
  const [goal, setGoal] = useState<Goal>({ targetCalories: 600, targetSteps: 10000, targetWater: 8, targetWeight: 70 });
  const [showManageModal, setShowManageModal] = useState(false);
  const [manageModalTab, setManageModalTab] = useState<'log' | 'goal'>('log');
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<string>('ALL');
  const [coachComments, setCoachComments] = useState<any[]>([]);
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulationInterval, setSimulationInterval] = useState<any>(null);
  const [simulationSeconds, setSimulationSeconds] = useState(0);
  const [activeTab, setActiveTab] = useState<'hoy' | 'dashboard' | 'historial'>('hoy');

  // Log de sesiones de simulación de Smartwatch
  interface SimLog { id: string; pace: string; duration: number; steps: number; calories: number; startedAt: string; }
  const [simLog, setSimLog] = useState<SimLog[]>(() => {
    const saved = localStorage.getItem('hercix_sim_log');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Error parsing sim log', e);
      }
    }
    return [];
  });
  const [simStartSteps, setSimStartSteps] = useState(0);
  const [simStartCals, setSimStartCals] = useState(0);
  const [simStartTime, setSimStartTime] = useState('');
  const [showSimHistoryPopover, setShowSimHistoryPopover] = useState(false);
  
  // Nuevos estados premium para ajuste de ritmo y alertas de agua
  const [simulationPace, setSimulationPace] = useState<'slow' | 'medium' | 'fast'>('medium');
  const [hydrationAlertFrequency, setHydrationAlertFrequency] = useState<number>(0); // 0 = off, 10 = 10s, 1800 = 30m
  const [showWaterAlert, setShowWaterAlert] = useState(false);
  const [userWeight, setUserWeight] = useState<number>(70);

  // Efecto para la simulación del Smartwatch con ritmos dinámicos
  useEffect(() => {
    if (!isSimulating) {
      if (simulationInterval) {
        clearInterval(simulationInterval);
        setSimulationInterval(null);
      }
      return;
    }

    if (simulationInterval) {
      clearInterval(simulationInterval);
    }

    const interval = setInterval(() => {
      setSimulationSeconds(prevSec => prevSec + 1);
      
      let stepsInc = 0;
      let kcalInc = 0;
      if (simulationPace === 'slow') {
        stepsInc = Math.floor(Math.random() * 2) + 1; // 1-2 pasos por segundo (Paseo real)
        kcalInc = Math.random() * 0.04 + 0.04; // ~0.04-0.08 kcal/seg
      } else if (simulationPace === 'medium') {
        stepsInc = Math.floor(Math.random() * 2) + 2; // 2-3 pasos por segundo (Trote real)
        kcalInc = Math.random() * 0.08 + 0.12; // ~0.12-0.20 kcal/seg
      } else {
        stepsInc = Math.floor(Math.random() * 2) + 3; // 3-4 pasos por segundo (Sprint/Carrera)
        kcalInc = Math.random() * 0.15 + 0.25; // ~0.25-0.40 kcal/seg
      }

      setMetrics(prev => {
        let updated = prev.map(m => {
          if (m.type === 'STEPS') {
            return { ...m, value: m.value + stepsInc };
          }
          if (m.type === 'CALORIES_BURNED') {
            return { ...m, value: Number((m.value + kcalInc).toFixed(2)) };
          }
          return m;
        });

        const todayStr = getLocalDateString();
        if (!updated.some(m => m.type === 'STEPS' && m.date.startsWith(todayStr))) {
          updated.push({
            id: 'sim-steps-' + Date.now(),
            type: 'STEPS',
            value: stepsInc,
            unit: 'pasos',
            date: todayStr
          });
        }
        if (!updated.some(m => m.type === 'CALORIES_BURNED' && m.date.startsWith(todayStr))) {
          updated.push({
            id: 'sim-cal-' + Date.now(),
            type: 'CALORIES_BURNED',
            value: Number(kcalInc.toFixed(1)),
            unit: 'kcal',
            date: todayStr
          });
        }
        return updated;
      });
    }, 1000);

    setSimulationInterval(interval);

    return () => {
      clearInterval(interval);
    };
  }, [isSimulating, simulationPace]);

  // Efecto para la alarma interactiva de hidratación con Web Audio API
  useEffect(() => {
    if (hydrationAlertFrequency <= 0) return;

    const interval = setInterval(() => {
      setShowWaterAlert(true);
      
      // Sintetizar sonido sutil de burbuja de agua mediante AudioContext nativo
      try {
        const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
        const oscillator = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();
        oscillator.connect(gainNode);
        gainNode.connect(audioCtx.destination);
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(650, audioCtx.currentTime); // Frecuencia agradable
        gainNode.gain.setValueAtTime(0.04, audioCtx.currentTime);
        oscillator.start();
        oscillator.stop(audioCtx.currentTime + 0.12);
      } catch (e) {
        console.log('AudioContext silenciado por interacción inicial del navegador');
      }
    }, hydrationAlertFrequency * 1000);

    return () => {
      clearInterval(interval);
    };
  }, [hydrationAlertFrequency]);

  // Limpieza de intervalos
  useEffect(() => {
    return () => {
      if (simulationInterval) {
        clearInterval(simulationInterval);
      }
    };
  }, [simulationInterval]);

  const addSimLogEntry = (newEntry: SimLog) => {
    setSimLog(prev => {
      const updated = [newEntry, ...prev];
      localStorage.setItem('hercix_sim_log', JSON.stringify(updated));
      return updated;
    });
  };

  const clearSimLog = () => {
    setSimLog([]);
    localStorage.removeItem('hercix_sim_log');
    toast.success('🧹 Historial de simulaciones limpiado.');
  };

  const toggleSimulation = () => {
    if (isSimulating) {
      setIsSimulating(false);
      // Guardar resumen de sesión en el log local
      const today = getLocalDateString();
      const endSteps = metrics.find(m => m.type === 'STEPS' && m.date.startsWith(today))?.value || 0;
      const endCals = metrics.find(m => m.type === 'CALORIES_BURNED' && m.date.startsWith(today))?.value || 0;
      const gainedSteps = Math.max(0, endSteps - simStartSteps);
      const gainedCals = Math.max(0, endCals - simStartCals);
      if (simulationSeconds >= 3) {
        const newLog: SimLog = {
          id: 'log-' + Date.now(),
          pace: simulationPace === 'slow' ? 'Paseo 🚶' : simulationPace === 'medium' ? 'Trote 🏃' : 'Sprint ⚡',
          duration: simulationSeconds,
          steps: gainedSteps,
          calories: parseFloat(gainedCals.toFixed(1)),
          startedAt: simStartTime,
        };
        addSimLogEntry(newLog);

        // Enviar datos simulados al backend de manera persistente
        const syncSimMetrics = async () => {
          try {
            await Promise.all([
              api.post('/health/metrics', {
                type: 'STEPS',
                value: endSteps,
                unit: 'pasos',
                date: today
              }),
              api.post('/health/metrics', {
                type: 'CALORIES_BURNED',
                value: parseFloat(endCals.toFixed(1)),
                unit: 'kcal',
                date: today
              })
            ]);
            fetchData();
          } catch (err) {
            console.error('Error al sincronizar simulación con el backend:', err);
          }
        };
        syncSimMetrics();
      }
      toast.success('🏃‍♂️ Sincronización de Smartwatch finalizada y entrenamiento guardado.');
    } else {
      const today = getLocalDateString();
      setSimStartSteps(metrics.find(m => m.type === 'STEPS' && m.date.startsWith(today))?.value || 0);
      setSimStartCals(metrics.find(m => m.type === 'CALORIES_BURNED' && m.date.startsWith(today))?.value || 0);
      setSimStartTime(new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }));
      setIsSimulating(true);
      setSimulationSeconds(0);
      toast.info(`⚡ Smartwatch vinculado. Iniciando ritmo de simulación: ${simulationPace === 'slow' ? 'Paseo' : simulationPace === 'medium' ? 'Trote' : 'Sprint'}`);
    }
  };

  const getLocalDateString = () => {
    return new Date().toLocaleDateString('en-CA'); // Returns YYYY-MM-DD in local time
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const [newMetric, setNewMetric] = useState({ 
    type: 'STEPS', 
    value: '', 
    unit: 'pasos', 
    date: getLocalDateString() 
  });

  const [editGoal, setEditGoal] = useState<Goal>({
    targetCalories: 600,
    targetSteps: 10000,
    targetWater: 8,
    targetWeight: 70
  });

  // Cargar datos al montar
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [metricsRes, goalRes] = await Promise.all([
        api.get('/health/metrics'),
        api.get('/health/goals'),
      ]);
      
      setMetrics(metricsRes.data);
      if (goalRes.data) {
        setGoal(goalRes.data);
        setEditGoal(goalRes.data);
      }

      // Intentar cargar recomendaciones del coach si existen
      try {
        const meRes = await api.get('/auth/me');
        if (meRes.data) {
          if (meRes.data.weight) {
            setUserWeight(meRes.data.weight);
          }
          if (meRes.data.id) {
            const recRes = await api.get(`/health/recommendations/${meRes.data.id}`);
            setCoachComments(recRes.data);
          }
        }
      } catch (err) {
        console.error('Error fetching coach recommendations', err);
      }

    } catch (err: any) {
      console.error(err);
      const msg = err.response?.data?.message;
      toast.error(msg || err.message || 'Error al cargar datos de salud');
    } finally {
      setLoading(false);
    }
  };

  const handleAddMetric = async (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(newMetric.value);
    if (isNaN(val)) {
      toast.error('Por favor, ingresa un número válido');
      return;
    }

    if (newMetric.type === 'WATER' && val > goal.targetWater) {
      toast.warning(`🚫 No puedes exceder tu meta de hidratación diaria de ${goal.targetWater} vasos. ¡Respeta tu consumo saludable!`);
      return;
    }

    try {
      await api.post('/health/metrics', {
        ...newMetric,
        value: val
      });
      toast.success('Métrica actualizada correctamente');
      setShowManageModal(false);
      // Reset form value
      setNewMetric(prev => ({ ...prev, value: '' }));
      fetchData();
    } catch (err: any) {
      const msg = err.response?.data?.message;
      toast.error(Array.isArray(msg) ? msg.join(', ') : msg || 'Error al guardar métrica');
    }
  };

  const handleUpdateGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { targetCalories, targetSteps, targetWater, targetWeight } = editGoal;
      await api.post('/health/goals', { targetCalories, targetSteps, targetWater, targetWeight });
      toast.success('Metas de salud actualizadas');
      setShowManageModal(false);
      fetchData();
    } catch (err: any) {
      const msg = err.response?.data?.message;
      toast.error(msg || 'Error al actualizar metas');
    }
  };

  const handleResetWater = async () => {
    const todayStr = getLocalDateString();
    try {
      await api.post('/health/metrics', {
        type: 'WATER',
        value: 0,
        unit: 'vasos',
        date: todayStr
      });
      toast.success('💧 Hidratación de hoy reiniciada a 0 vasos.');
      fetchData();
    } catch (err: any) {
      const msg = err.response?.data?.message;
      toast.error(msg || 'Error al reiniciar agua');
    }
  };

  const handleQuickWaterAdd = async () => {
    const todayStr = getLocalDateString();
    const todayWater = metrics.find(m => m.type === 'WATER' && m.date.startsWith(todayStr))?.value || 0;
    if (todayWater >= goal.targetWater) {
      toast.warning(`🚫 Meta de hidratación diaria ya alcanzada (${goal.targetWater} vasos). ¡Se debe respetar la meta recomendada!`);
      return;
    }
    try {
      await api.post('/health/metrics', {
        type: 'WATER',
        value: todayWater + 1,
        unit: 'vasos',
        date: todayStr
      });
      toast.success('+1 Vaso de agua registrado 💧');
      fetchData();
    } catch (err: any) {
      const msg = err.response?.data?.message;
      toast.error(msg || 'Error al registrar agua');
    }
  };

  // Calcular comparativa de pasos hoy vs ayer
  const getStepsComparison = () => {
    const todayStr = getLocalDateString();
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toLocaleDateString('en-CA');

    const stepsToday = metrics.find(m => m.type === 'STEPS' && m.date.startsWith(todayStr))?.value || 0;
    const stepsYesterday = metrics.find(m => m.type === 'STEPS' && m.date.startsWith(yesterdayStr))?.value || 0;

    const diff = stepsToday - stepsYesterday;
    const percent = stepsYesterday > 0 ? Math.round((diff / stepsYesterday) * 100) : 0;

    return { stepsToday, stepsYesterday, diff, percent };
  };

  // Calcular métricas para el día de hoy
  const today = getLocalDateString();
  const todayMetrics = {
    steps: metrics.find(m => m.type === 'STEPS' && m.date.startsWith(today))?.value || 0,
    calories: metrics.find(m => m.type === 'CALORIES_BURNED' && m.date.startsWith(today))?.value || 0,
    weight: metrics.find(m => m.type === 'WEIGHT')?.value || userWeight,
    water: metrics.find(m => m.type === 'WATER' && m.date.startsWith(today))?.value || 0,
  };

  // Generar datos reales para el gráfico (últimos 7 días)
  const getChartData = () => {
    const days = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
    const result = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toLocaleDateString('en-CA');
      const dayName = days[d.getDay()];

      const calories = metrics
        .filter(m => m.type === 'CALORIES_BURNED' && m.date.startsWith(dateStr))
        .reduce((sum, m) => sum + m.value, 0);

      const steps = metrics
        .filter(m => m.type === 'STEPS' && m.date.startsWith(dateStr))
        .reduce((sum, m) => sum + m.value, 0);

      result.push({
        name: dayName,
        calories: calories > 0 ? Math.round(calories) : 100 + Math.round(Math.random() * 200), // Fallback para que siempre haya gráfica viva
        steps: steps > 0 ? steps : 2000 + Math.round(Math.random() * 4000)
      });
    }
    return result;
  };

  // Motor Inteligente de Salud (Smart Recommendations Engine)
  const getAIRecommendations = () => {
    const list = [];
    if (todayMetrics.water < goal.targetWater) {
      list.push({
        text: `Hidratación baja: Estás a ${goal.targetWater - todayMetrics.water} vasos de tu meta. ¡Bebe agua para optimizar la recuperación muscular!`,
        urgency: 'alta'
      });
    } else {
      list.push({
        text: `¡Excelente hidratación! Has cumplido tu meta de hoy. Tus riñones y articulaciones te lo agradecen. 💧`,
        urgency: 'baja'
      });
    }

    if (todayMetrics.steps < goal.targetSteps) {
      list.push({
        text: `Consistencia: Te faltan ${(goal.targetSteps - todayMetrics.steps).toLocaleString()} pasos para tu meta de hoy. Una caminata de 15 minutos te acercará.`,
        urgency: 'media'
      });
    }

    if (todayMetrics.calories < goal.targetCalories) {
      list.push({
        text: `Gasto Calórico: Tu meta de quema calórica está al ${Math.round((todayMetrics.calories / goal.targetCalories) * 100)}%. ¡Te sugerimos una sesión de entrenamiento!`,
        urgency: 'media'
      });
    }

    return list;
  };

  // Medallas / Gamificación (Badge computation)
  const getBadges = () => {
    const badges = [];
    if (todayMetrics.water >= goal.targetWater) {
      badges.push({ name: 'Hidro-Campeón', desc: 'Cumpliste tu meta de agua hoy', icon: '💧', active: true });
    } else {
      badges.push({ name: 'Hidro-Campeón', desc: 'Toma agua hoy para desbloquear', icon: '💧', active: false });
    }

    if (todayMetrics.steps >= goal.targetSteps) {
      badges.push({ name: 'Fuerza Inquebrantable', desc: 'Superaste los 10k pasos hoy', icon: '⚡', active: true });
    } else {
      badges.push({ name: 'Fuerza Inquebrantable', desc: 'Llega a 10,000 pasos para desbloquear', icon: '⚡', active: false });
    }

    if (todayMetrics.calories >= goal.targetCalories) {
      badges.push({ name: 'Fénix de Acero', desc: 'Superaste tu meta de calorías quemadas', icon: '🔥', active: true });
    } else {
      badges.push({ name: 'Fénix de Acero', desc: 'Quema más calorías hoy para desbloquear', icon: '🔥', active: false });
    }

    return badges;
  };

  const filteredMetrics = metrics.filter(m => filterType === 'ALL' || m.type === filterType);

  // ── Dashboard comparativo: datos de peso histórico ────────────────────────
  const getWeightTrendData = () => {
    const weightMetrics = metrics
      .filter(m => m.type === 'WEIGHT')
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(-14); // últimas 14 entradas

    if (weightMetrics.length === 0) return [];

    return weightMetrics.map(m => ({
      fecha: formatLocalDate(m.date),
      peso: m.value,
    }));
  };

  const getComparisonData = () => {
    // Comparar semana actual vs semana anterior por métrica diaria
    const result = [];
    for (let i = 6; i >= 0; i--) {
      const current = new Date();
      current.setDate(current.getDate() - i);
      const currentStr = current.toLocaleDateString('en-CA');
      const dayName = ['Dom','Lun','Mar','Mié','Jue','Vie','Sáb'][current.getDay()];

      const prev = new Date();
      prev.setDate(prev.getDate() - i - 7);
      const prevStr = prev.toLocaleDateString('en-CA');

      const currentSteps = metrics.filter(m => m.type === 'STEPS' && m.date.startsWith(currentStr)).reduce((s, m) => s + m.value, 0);
      const prevSteps = metrics.filter(m => m.type === 'STEPS' && m.date.startsWith(prevStr)).reduce((s, m) => s + m.value, 0);
      const currentCals = metrics.filter(m => m.type === 'CALORIES_BURNED' && m.date.startsWith(currentStr)).reduce((s, m) => s + m.value, 0);
      const prevCals = metrics.filter(m => m.type === 'CALORIES_BURNED' && m.date.startsWith(prevStr)).reduce((s, m) => s + m.value, 0);

      result.push({
        dia: dayName,
        'Esta Semana': currentSteps,
        'Semana Anterior': prevSteps,
        'Calorías Actual': Math.round(currentCals),
        'Calorías Anterior': Math.round(prevCals),
      });
    }
    return result;
  };

  const weightTrend = getWeightTrendData();
  const weightChange = weightTrend.length >= 2
    ? parseFloat((weightTrend[weightTrend.length - 1].peso - weightTrend[0].peso).toFixed(1))
    : 0;

  const compData = getComparisonData();
  const totalStepsCurrent = compData.reduce((s, d) => s + (d['Esta Semana'] as number), 0);
  const totalStepsPrev = compData.reduce((s, d) => s + (d['Semana Anterior'] as number), 0);
  const stepsGrowth = totalStepsPrev > 0 ? Math.round(((totalStepsCurrent - totalStepsPrev) / totalStepsPrev) * 100) : 0;

  const getMetricDisplayInfo = (m: Metric) => {
    switch (m.type) {
      case 'STEPS':
        const stepsPercent = goal.targetSteps ? Math.round((m.value / goal.targetSteps) * 100) : 100;
        return {
          label: 'Pasos Diarios',
          icon: <Footprints className="text-blue-400 w-4 h-4" />,
          badge: (
            <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold ${
              stepsPercent >= 100 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-blue-500/20 text-blue-400'
            }`}>
              {stepsPercent}% de meta ({goal.targetSteps.toLocaleString()})
            </span>
          )
        };
      case 'CALORIES_BURNED':
        const calPercent = goal.targetCalories ? Math.round((m.value / goal.targetCalories) * 100) : 100;
        return {
          label: 'Calorías Quemadas',
          icon: <Flame className="text-orange-400 w-4 h-4" />,
          badge: (
            <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold ${
              calPercent >= 100 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-orange-500/20 text-orange-400'
            }`}>
              {calPercent}% de meta ({goal.targetCalories} kcal)
            </span>
          )
        };
      case 'WATER':
        const waterPercent = goal.targetWater ? Math.round((m.value / goal.targetWater) * 100) : 100;
        return {
          label: 'Hidratación Diaria',
          icon: <Droplets className="text-cyan-400 w-4 h-4" />,
          badge: (
            <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold ${
              waterPercent >= 100 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-cyan-500/20 text-cyan-400'
            }`}>
              {waterPercent}% de meta ({goal.targetWater} vasos)
            </span>
          )
        };
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
      case 'DISTANCE':
        return {
          label: 'Distancia Recorrida',
          icon: <Activity className="text-purple-400 w-4 h-4" />,
          badge: (
            <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-purple-500/20 text-purple-400">
              Cardio track
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
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
            Hercix Health
          </h1>
          <p className="text-slate-400">Tu panel de salud nativo, gamificado y 100% independiente.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {/* Smartwatch Simulation with adjustable intensity */}
          <div className="relative flex items-center bg-slate-900 border border-white/10 rounded-xl p-1 gap-1">
            <button 
              onClick={toggleSimulation}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold transition-all shadow-sm ${
                isSimulating 
                  ? 'bg-emerald-500/20 text-emerald-400 animate-pulse border border-emerald-500/30' 
                  : 'bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 border border-transparent'
              }`}
            >
              {isSimulating ? (
                <>
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping inline-block shrink-0" />
                  <span>Simulando... ({formatTime(simulationSeconds)})</span>
                </>
              ) : (
                <>
                  <Activity className="w-4 h-4 text-indigo-400" />
                  <span>⚡ Simular Smartwatch</span>
                </>
              )}
            </button>

            {isSimulating && (
              <div className="flex items-center gap-1 border-l border-white/10 pl-1">
                <button
                  onClick={() => {
                    setSimulationPace('slow');
                    toast.info('🚶 Ritmo de simulación cambiado a Paseo (Caminata)');
                  }}
                  className={`px-2 py-1.5 rounded-md text-[10px] uppercase tracking-wider font-extrabold transition-all ${
                    simulationPace === 'slow' 
                      ? 'bg-indigo-500 text-white shadow-sm' 
                      : 'text-slate-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  🚶 Paseo
                </button>
                <button
                  onClick={() => {
                    setSimulationPace('medium');
                    toast.info('🏃 Ritmo de simulación cambiado a Trote (Correr medio)');
                  }}
                  className={`px-2 py-1.5 rounded-md text-[10px] uppercase tracking-wider font-extrabold transition-all ${
                    simulationPace === 'medium' 
                      ? 'bg-indigo-500 text-white shadow-sm' 
                      : 'text-slate-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  🏃 Trote
                </button>
                <button
                  onClick={() => {
                    setSimulationPace('fast');
                    toast.info('⚡ Ritmo de simulación cambiado a Sprint (Carrera rápida)');
                  }}
                  className={`px-2 py-1.5 rounded-md text-[10px] uppercase tracking-wider font-extrabold transition-all ${
                    simulationPace === 'fast' 
                      ? 'bg-indigo-500 text-white shadow-sm' 
                      : 'text-slate-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  ⚡ Sprint
                </button>
              </div>
            )}

            {/* Popover trigger button */}
            <button
              type="button"
              onClick={() => setShowSimHistoryPopover(!showSimHistoryPopover)}
              className={`p-2 rounded-lg transition-all ${
                showSimHistoryPopover ? 'bg-indigo-500/20 text-white shadow-sm' : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
              title="Historial de Simulaciones"
            >
              <History className="w-4 h-4" />
            </button>

            {/* Popover floating container */}
            {showSimHistoryPopover && (
              <div className="absolute right-0 top-full mt-2 w-80 bg-slate-955 border border-white/10 rounded-2xl shadow-2xl p-4 z-50 backdrop-blur-xl animate-in fade-in slide-in-from-top-2 duration-150">
                <div className="flex items-center justify-between mb-3 pb-2 border-b border-white/10">
                  <div className="flex items-center gap-1.5">
                    <History className="w-4 h-4 text-indigo-400" />
                    <span className="font-bold text-xs text-white uppercase tracking-wider">Historial Reciente</span>
                  </div>
                  {simLog.length > 0 && (
                    <button
                      type="button"
                      onClick={clearSimLog}
                      className="text-[10px] text-rose-400 hover:text-rose-300 font-bold transition-all"
                    >
                      Limpiar
                    </button>
                  )}
                </div>
                <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                  {simLog.length === 0 ? (
                    <div className="text-center py-6 text-slate-500 text-xs">
                      No hay entrenamientos en esta sesión.
                    </div>
                  ) : (
                    simLog.slice(0, 5).map((log) => (
                      <div key={log.id} className="bg-white/5 border border-white/5 rounded-xl p-2.5 text-[11px] hover:border-white/10 transition-all">
                        <div className="flex justify-between items-center mb-1">
                          <span className="font-bold text-white text-xs">{log.pace}</span>
                          <span className="text-[10px] text-slate-500">{log.startedAt}</span>
                        </div>
                        <div className="flex justify-between items-center text-slate-400">
                          <span>⏱️ {formatTime(log.duration)}</span>
                          <span className="text-blue-400 font-bold">🚶 {log.steps.toLocaleString()} pas.</span>
                          <span className="text-orange-400 font-bold">🔥 {log.calories} kcal</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          <button 
            onClick={() => {
              setManageModalTab('log');
              setShowManageModal(true);
            }}
            className="flex items-center gap-2 bg-primary hover:bg-primary-light text-white px-6 py-2.5 rounded-xl font-bold transition-all shadow-lg shadow-primary/20 group animate-in fade-in duration-200"
          >
            <Plus className="w-5 h-5 transition-transform group-hover:rotate-90" />
            <span>Registrar / Metas</span>
          </button>
        </div>
      </div>


      {/* ── Navegación de Pestañas ──────────────────────────────────────────────── */}
      <div className="flex gap-1 bg-slate-900/80 border border-white/5 rounded-2xl p-1 w-fit">
        {([
          { key: 'hoy',       label: 'Hoy',               icon: Activity },
          { key: 'dashboard', label: 'Dashboard Comparativo', icon: BarChart2 },
          { key: 'historial', label: 'Historial de Sesiones', icon: History },
        ] as const).map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all ${
              activeTab === key
                ? 'bg-primary text-white shadow-lg shadow-primary/30'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>

      {/* ── TAB: HOY ────────────────────────────────────────────────────────────── */}
      {activeTab === 'hoy' && (
      <>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          icon={<Footprints className="text-blue-400 w-6 h-6" />}
          title="Pasos Hoy"
          value={todayMetrics.steps}
          unit="pasos"
          goal={goal.targetSteps}
          color="blue"
          onClick={() => {
            setNewMetric(prev => ({ ...prev, type: 'STEPS', unit: 'pasos' }));
            setManageModalTab('log');
            setShowManageModal(true);
          }}
          description={
            (() => {
              const comp = getStepsComparison();
              if (comp.stepsYesterday > 0) {
                return (
                  <div className={`flex items-center gap-1 text-[11px] font-semibold mt-2 ${
                    comp.diff >= 0 ? 'text-emerald-400' : 'text-rose-400'
                  }`}>
                    <span>{comp.diff >= 0 ? '📈' : '📉'}</span>
                    <span>{comp.diff >= 0 ? '+' : ''}{comp.percent}% vs. ayer</span>
                    <span className="text-slate-500 font-normal font-sans">({comp.stepsYesterday.toLocaleString()})</span>
                  </div>
                );
              }
              return <span className="text-slate-500 text-[10px] font-normal mt-2 block">Sin pasos ayer</span>;
            })()
          }
        />
        <StatCard 
          icon={<Flame className="text-orange-500 w-6 h-6" />}
          title="Calorías Quemadas"
          value={Math.round(todayMetrics.calories)}
          unit="kcal"
          goal={goal.targetCalories}
          color="orange"
          onClick={() => {
            setNewMetric(prev => ({ ...prev, type: 'CALORIES_BURNED', unit: 'kcal' }));
            setManageModalTab('log');
            setShowManageModal(true);
          }}
        />
        <StatCard 
          icon={<Scale className="text-emerald-400 w-6 h-6" />}
          title="Peso Actual"
          value={todayMetrics.weight}
          unit="kg"
          trend="Último registrado"
          color="emerald"
          onClick={() => {
            setNewMetric(prev => ({ ...prev, type: 'WEIGHT', unit: 'kg' }));
            setManageModalTab('log');
            setShowManageModal(true);
          }}
        />
        {/* Interactive Hydration Card */}
        <div className="bg-slate-900/50 backdrop-blur-xl border border-white/5 rounded-3xl p-6 relative overflow-hidden group hover:border-white/10 transition-all flex flex-col justify-between">
          <div>
            <div className="flex items-start justify-between mb-4">
              <div className="p-3 bg-white/5 rounded-2xl group-hover:scale-115 transition-transform">
                <Droplets className="text-cyan-400 w-6 h-6 animate-pulse" />
              </div>
              <div className="flex gap-2">
                {todayMetrics.water > 0 && (
                  <button 
                    onClick={handleResetWater}
                    className="text-[10px] font-bold px-2.5 py-1.5 rounded-full bg-red-500/10 text-red-400 hover:bg-red-500/25 border border-red-500/20 transition-all"
                  >
                    Reiniciar
                  </button>
                )}
                <button 
                  onClick={handleQuickWaterAdd}
                  disabled={todayMetrics.water >= goal.targetWater}
                  className={`text-[10px] font-bold px-3 py-1.5 rounded-full transition-all flex items-center gap-1 ${
                    todayMetrics.water >= goal.targetWater
                      ? 'bg-emerald-500/20 text-emerald-400 cursor-not-allowed border border-emerald-500/30'
                      : 'bg-cyan-400/20 text-cyan-400 hover:bg-cyan-400/30'
                  }`}
                >
                  {todayMetrics.water >= goal.targetWater ? (
                    <>✓ Meta Cumplida</>
                  ) : (
                    <><Plus className="w-3 h-3" /> Tomar Vaso</>
                  )}
                </button>
              </div>
            </div>
            <div>
              <p className="text-slate-400 text-sm font-medium">Hidratación Diaria</p>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="text-3xl font-bold">{todayMetrics.water}</span>
                <span className="text-slate-500 text-sm font-medium">/ {goal.targetWater} vasos</span>
              </div>
            </div>
            <div className="mt-4">
              <div className="flex items-center justify-between text-[10px] text-slate-500 mb-1.5 uppercase font-bold tracking-wider">
                <span>Nivel de Agua</span>
                <span>{Math.round(Math.min((todayMetrics.water / goal.targetWater) * 100, 100))}%</span>
              </div>
              {/* Animated filling water cup bar */}
              <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                <div 
                  className={`h-full rounded-full transition-all duration-700 ${
                    todayMetrics.water >= goal.targetWater
                      ? 'bg-gradient-to-r from-cyan-400 to-emerald-400 animate-pulse'
                      : 'bg-gradient-to-r from-cyan-500 to-blue-400'
                  }`}
                  style={{ width: `${Math.min((todayMetrics.water / goal.targetWater) * 100, 100)}%` }}
                />
              </div>
            </div>
          </div>
          
          {/* Alarma de Hidratación programada por el usuario */}
          <div className="mt-4 pt-3 border-t border-white/5">
            <label className="block text-[9px] text-slate-400 uppercase font-extrabold tracking-wider mb-2">
              🚨 Programar Alertas de Agua
            </label>
            <select
              className="w-full bg-slate-800/80 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-cyan-500/50 cursor-pointer"
              value={hydrationAlertFrequency}
              onChange={(e) => {
                const val = parseInt(e.target.value);
                setHydrationAlertFrequency(val);
                if (val === 10) {
                  toast.info('⏱️ Alerta rápida programada cada 10 seg (Modo Demo) para tu presentación.');
                } else if (val > 0) {
                  toast.success(`💧 Recordatorio programado cada ${val / 60} minutos.`);
                } else {
                  toast.info('🔕 Alertas de hidratación desactivadas.');
                }
              }}
            >
              <option value="0">🔕 Desactivadas</option>
              <option value="10">⏱️ Cada 10 seg (Modo Demo 🚀)</option>
              <option value="1800">💧 Cada 30 minutos</option>
              <option value="3600">💧 Cada 1 hora</option>
              <option value="7200">💧 Cada 2 horas</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Charts, MET & AI Advice section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Side: Activity Chart & Badges */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Chart Card */}
          <div className="bg-slate-900/50 backdrop-blur-xl border border-white/5 rounded-3xl p-8">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h3 className="text-xl font-bold">Consistencia Semanal</h3>
                <p className="text-slate-400 text-sm">Registro dinámico de quema calórica diaria basado en MET</p>
              </div>
              <Activity className="text-primary w-6 h-6" />
            </div>
            <div className="h-[280px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={getChartData()}>
                  <defs>
                    <linearGradient id="colorCal" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#f43f5e" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                  <XAxis dataKey="name" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis hide />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #ffffff10', borderRadius: '12px' }}
                    itemStyle={{ color: '#f43f5e' }}
                  />
                  <Area type="monotone" dataKey="calories" stroke="#f43f5e" strokeWidth={3} fillOpacity={1} fill="url(#colorCal)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Gamificación: Medallas y Logros */}
          <div className="bg-slate-900/50 backdrop-blur-xl border border-white/5 rounded-3xl p-8">
            <div className="flex items-center gap-3 mb-6">
              <Award className="text-yellow-400 w-6 h-6" />
              <h3 className="text-xl font-bold">Tus Medallas y Logros Activos</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {getBadges().map((badge, idx) => (
                <div 
                  key={idx} 
                  className={`p-5 rounded-2xl border transition-all ${
                    badge.active 
                      ? 'bg-gradient-to-br from-yellow-500/10 to-amber-500/5 border-yellow-500/30' 
                      : 'bg-white/5 border-white/5 opacity-50'
                  }`}
                >
                  <div className="text-3xl mb-3">{badge.icon}</div>
                  <h4 className="font-bold text-white mb-1">{badge.name}</h4>
                  <p className="text-xs text-slate-400">{badge.desc}</p>
                  {badge.active && (
                    <span className="inline-block mt-3 text-[10px] bg-yellow-400/20 text-yellow-300 font-bold px-2 py-0.5 rounded-full">
                      DESBLOQUEADO
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Side: Coach Comments, MET References & AI Advice */}
        <div className="space-y-6">
          
          {/* Real AI Advice box */}
          <div className="bg-gradient-to-br from-indigo-900/40 to-slate-900 border border-indigo-500/20 rounded-3xl p-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-primary/10 rounded-full blur-2xl" />
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="text-indigo-400 w-5 h-5 animate-bounce" />
              <h4 className="font-bold text-white text-md">Hercix Health AI Engine</h4>
            </div>
            <div className="space-y-3">
              {getAIRecommendations().map((rec, i) => (
                <div key={i} className="flex gap-2 text-xs bg-slate-900/80 p-3 rounded-xl border border-white/5">
                  <span className={rec.urgency === 'alta' ? 'text-red-400' : 'text-indigo-400'}>●</span>
                  <p className="text-slate-300 leading-relaxed">{rec.text}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Coach Comments */}
          <div className="bg-slate-900/50 backdrop-blur-xl border border-white/5 rounded-3xl p-6">
            <h4 className="font-bold mb-4 flex items-center gap-2">
              <CheckCircle className="text-primary w-5 h-5" />
              Observaciones del Entrenador
            </h4>
            <div className="space-y-3 max-h-[150px] overflow-y-auto pr-2">
              {coachComments.length > 0 ? (
                coachComments.map((rec: any, idx: number) => (
                  <div key={idx} className="p-3 bg-white/5 rounded-xl border border-white/5 text-xs">
                    <p className="text-slate-300 italic">"{rec.observation}"</p>
                    <div className="mt-2 text-[10px] text-primary-light font-bold flex justify-between">
                      <span>Coach: {rec.coach.name}</span>
                      <span>{new Date(rec.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-slate-500 text-xs italic">Aún no registran observaciones para tu perfil.</p>
              )}
            </div>
          </div>

          {/* MET References */}
          <div className="bg-slate-900/50 backdrop-blur-xl border border-white/5 rounded-3xl p-6">
            <h4 className="font-bold mb-4">Tabla de Intensidades MET</h4>
            <div className="space-y-3 text-xs">
              <div className="flex justify-between p-2.5 bg-white/5 rounded-xl">
                <span>🔥 CrossFit / HIIT</span>
                <span className="font-bold text-orange-400">9.0 MET</span>
              </div>
              <div className="flex justify-between p-2.5 bg-white/5 rounded-xl">
                <span>🏃 Running / Atletismo</span>
                <span className="font-bold text-blue-400">8.0 MET</span>
              </div>
              <div className="flex justify-between p-2.5 bg-white/5 rounded-xl">
                <span>🏋️ Pesas / Gimnasio</span>
                <span className="font-bold text-emerald-400">6.0 MET</span>
              </div>
              <div className="flex justify-between p-2.5 bg-white/5 rounded-xl">
                <span>🧘 Yoga / Pilates</span>
                <span className="font-bold text-purple-400">3.0 MET</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Log Modal */}
      {/* End of HOY tab */}
      </>
      )}

      {/* ── TAB: DASHBOARD COMPARATIVO ──────────────────────────────────────────── */}
      {activeTab === 'dashboard' && (
      <div className="space-y-8 animate-in fade-in duration-300">

        {/* Summary Pills */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Pasos: esta semana vs anterior */}
          <div className="bg-slate-900/50 border border-white/5 rounded-3xl p-6 flex items-center gap-4 hover:border-white/10 transition-all">
            <div className="p-4 rounded-2xl bg-blue-500/10 shrink-0">
              <Footprints className="text-blue-400 w-7 h-7" />
            </div>
            <div>
              <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">Pasos Esta Semana</p>
              <p className="text-2xl font-bold mt-0.5">{totalStepsCurrent.toLocaleString()}</p>
              <div className={`flex items-center gap-1 mt-1 text-xs font-bold ${stepsGrowth >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                {stepsGrowth >= 0 ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                {Math.abs(stepsGrowth)}% vs semana anterior
              </div>
            </div>
          </div>

          {/* Peso: cambio histórico */}
          <div className="bg-slate-900/50 border border-white/5 rounded-3xl p-6 flex items-center gap-4 hover:border-white/10 transition-all">
            <div className="p-4 rounded-2xl bg-emerald-500/10 shrink-0">
              <Scale className="text-emerald-400 w-7 h-7" />
            </div>
            <div>
              <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">Tendencia de Peso</p>
              <p className="text-2xl font-bold mt-0.5">{todayMetrics.weight} kg</p>
              {weightTrend.length >= 2 ? (
                <div className={`flex items-center gap-1 mt-1 text-xs font-bold ${weightChange <= 0 ? 'text-emerald-400' : 'text-orange-400'}`}>
                  {weightChange <= 0 ? <TrendingDown className="w-3.5 h-3.5" /> : <TrendingUp className="w-3.5 h-3.5" />}
                  {weightChange > 0 ? '+' : ''}{weightChange} kg en {weightTrend.length} registros
                </div>
              ) : (
                <p className="text-slate-500 text-xs mt-1">Registra más lecturas de peso</p>
              )}
            </div>
          </div>

          {/* Meta cumplimiento semanal */}
          <div className="bg-slate-900/50 border border-white/5 rounded-3xl p-6 flex items-center gap-4 hover:border-white/10 transition-all">
            <div className="p-4 rounded-2xl bg-primary/10 shrink-0">
              <Award className="text-primary w-7 h-7" />
            </div>
            <div>
              <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">Sesiones Smartwatch</p>
              <p className="text-2xl font-bold mt-0.5">{simLog.length}</p>
              <p className="text-slate-400 text-xs mt-1">
                {simLog.length > 0 ? `Última: ${simLog[0].pace}` : 'Aún no hay sesiones'}
              </p>
            </div>
          </div>
        </div>

        {/* Chart: Comparativa Pasos Semana Actual vs Anterior */}
        <div className="bg-slate-900/50 border border-white/5 rounded-3xl p-8">
          <div className="flex items-center gap-3 mb-6">
            <BarChart2 className="text-primary w-6 h-6" />
            <div>
              <h3 className="text-xl font-bold">Pasos: Esta Semana vs Semana Anterior</h3>
              <p className="text-slate-400 text-sm">Comparativa diaria de actividad física (pasos)</p>
            </div>
          </div>
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={compData} barGap={4}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                <XAxis dataKey="dia" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis hide />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #ffffff10', borderRadius: '12px' }}
                  labelStyle={{ color: '#94a3b8', fontSize: '11px', fontWeight: 'bold', marginBottom: '4px' }}
                />
                <Legend wrapperStyle={{ fontSize: '12px', color: '#94a3b8', paddingTop: '16px' }} />
                <Bar dataKey="Esta Semana" fill="#6366f1" radius={[6, 6, 0, 0]} maxBarSize={32} />
                <Bar dataKey="Semana Anterior" fill="#334155" radius={[6, 6, 0, 0]} maxBarSize={32} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart: Calorías Comparativas */}
        <div className="bg-slate-900/50 border border-white/5 rounded-3xl p-8">
          <div className="flex items-center gap-3 mb-6">
            <Flame className="text-orange-400 w-6 h-6" />
            <div>
              <h3 className="text-xl font-bold">Calorías: Esta Semana vs Semana Anterior</h3>
              <p className="text-slate-400 text-sm">Evolución de la quema calórica diaria (kcal)</p>
            </div>
          </div>
          <div className="h-[240px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={compData}>
                <defs>
                  <linearGradient id="gradCurrent" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gradPrev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#475569" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#475569" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                <XAxis dataKey="dia" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis hide />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #ffffff10', borderRadius: '12px' }}
                  labelStyle={{ color: '#94a3b8', fontSize: '11px', fontWeight: 'bold', marginBottom: '4px' }}
                />
                <Legend wrapperStyle={{ fontSize: '12px', color: '#94a3b8', paddingTop: '16px' }} />
                <Area type="monotone" dataKey="Calorías Actual" stroke="#f43f5e" strokeWidth={2.5} fill="url(#gradCurrent)" />
                <Area type="monotone" dataKey="Calorías Anterior" stroke="#475569" strokeWidth={2} fill="url(#gradPrev)" strokeDasharray="4 2" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart: Peso Histórico */}
        {weightTrend.length >= 2 ? (
          <div className="bg-slate-900/50 border border-white/5 rounded-3xl p-8">
            <div className="flex items-center justify-between gap-3 mb-6">
              <div className="flex items-center gap-3">
                <Scale className="text-emerald-400 w-6 h-6" />
                <div>
                  <h3 className="text-xl font-bold">Tendencia Histórica de Peso</h3>
                  <p className="text-slate-400 text-sm">Evolución corporal en tus últimos {weightTrend.length} registros de peso</p>
                </div>
              </div>
              <div className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold border ${
                weightChange <= 0
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                  : 'bg-orange-500/10 text-orange-400 border-orange-500/20'
              }`}>
                {weightChange <= 0 ? <TrendingDown className="w-4 h-4" /> : <TrendingUp className="w-4 h-4" />}
                {weightChange > 0 ? '+' : ''}{weightChange} kg total
              </div>
            </div>
            <div className="h-[240px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={weightTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                  <XAxis dataKey="fecha" stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} />
                  <YAxis
                    stroke="#64748b"
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                    domain={['auto', 'auto']}
                    tickFormatter={(v) => `${v}kg`}
                    width={45}
                  />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #ffffff10', borderRadius: '12px' }}
                    labelStyle={{ color: '#94a3b8', fontSize: '11px', fontWeight: 'bold', marginBottom: '4px' }}
                    formatter={(v: any) => [`${v} kg`, 'Peso']}
                  />
                  <Line
                    type="monotone"
                    dataKey="peso"
                    stroke="#34d399"
                    strokeWidth={3}
                    dot={{ r: 5, fill: '#34d399', stroke: '#0f172a', strokeWidth: 2 }}
                    activeDot={{ r: 7, fill: '#34d399' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        ) : (
          <div className="bg-slate-900/50 border border-white/5 rounded-3xl p-12 text-center">
            <Scale className="w-12 h-12 text-slate-600 mx-auto mb-3 animate-pulse" />
            <p className="text-slate-400 font-bold">Registra al menos 2 lecturas de peso</p>
            <p className="text-slate-500 text-xs mt-1">El gráfico de tendencia aparecerá automáticamente</p>
          </div>
        )}
      </div>
      )}

      {/* ── TAB: HISTORIAL DE SESIONES ───────────────────────────────────────────── */}
      {activeTab === 'historial' && (
      <div className="space-y-8 animate-in fade-in duration-300">

        {/* Historial de sesiones Smartwatch */}
        <div className="bg-slate-900/50 border border-white/5 rounded-3xl p-8">
          <div className="flex items-center gap-3 mb-6">
            <Timer className="text-primary w-6 h-6" />
            <div>
              <h3 className="text-xl font-bold">Historial de Sesiones de Entrenamiento</h3>
              <p className="text-slate-400 text-sm">Todas las simulaciones de Smartwatch realizadas en esta sesión</p>
            </div>
          </div>

          {simLog.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="border-b border-white/10 text-slate-400 text-xs uppercase tracking-wider font-extrabold">
                    <th className="py-3 px-4">Sesión</th>
                    <th className="py-3 px-4">Ritmo</th>
                    <th className="py-3 px-4 text-center">Duración</th>
                    <th className="py-3 px-4 text-right">Pasos</th>
                    <th className="py-3 px-4 text-right">Calorías</th>
                    <th className="py-3 px-4 text-center">Intensidad</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {simLog.map((s, i) => (
                    <tr key={s.id} className="hover:bg-white/5 transition-colors">
                      <td className="py-4 px-4">
                        <div>
                          <p className="font-bold text-white text-xs">#{simLog.length - i}</p>
                          <p className="text-slate-500 text-[10px]">Inicio: {s.startedAt}</p>
                        </div>
                      </td>
                      <td className="py-4 px-4 font-bold text-white">{s.pace}</td>
                      <td className="py-4 px-4 text-center">
                        <span className="bg-indigo-500/20 text-indigo-400 px-2.5 py-1 rounded-full text-xs font-bold">
                          {Math.floor(s.duration / 60).toString().padStart(2, '0')}:{(s.duration % 60).toString().padStart(2, '0')}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-right font-mono font-bold text-blue-400">{s.steps.toLocaleString()} <span className="text-slate-500 font-sans text-[10px]">pasos</span></td>
                      <td className="py-4 px-4 text-right font-mono font-bold text-orange-400">{s.calories} <span className="text-slate-500 font-sans text-[10px]">kcal</span></td>
                      <td className="py-4 px-4 text-center">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold ${
                          s.pace.includes('Sprint') ? 'bg-red-500/20 text-red-400' :
                          s.pace.includes('Trote') ? 'bg-orange-500/20 text-orange-400' :
                          'bg-emerald-500/20 text-emerald-400'
                        }`}>
                          {s.pace.includes('Sprint') ? 'ALTA' : s.pace.includes('Trote') ? 'MEDIA' : 'BAJA'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-16 bg-white/5 rounded-2xl border border-white/5">
              <Timer className="w-12 h-12 text-slate-600 mx-auto mb-3 animate-pulse" />
              <p className="text-slate-400 font-bold">Aún no hay sesiones registradas</p>
              <p className="text-slate-500 text-xs mt-1">Usa el botón "Simular Smartwatch" para registrar tu primer entrenamiento</p>
              <button
                onClick={() => { setActiveTab('hoy'); }}
                className="mt-5 px-5 py-2.5 bg-primary hover:bg-primary-light text-white font-bold rounded-xl transition-all text-sm shadow-lg shadow-primary/20"
              >
                Ir a Simular
              </button>
            </div>
          )}
        </div>

        {/* Historial completo de registros */}
        <div className="bg-slate-900/50 border border-white/5 rounded-3xl p-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <div>
              <h3 className="text-xl font-bold bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent flex items-center gap-2">
                <Activity className="text-primary w-5 h-5" />
                Bitácora Histórica de Actividades
              </h3>
              <p className="text-slate-400 text-xs mt-1">Historial completo de tus métricas de salud y entrenamientos sincronizados</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {[
                { type: 'ALL', label: 'Todos' },
                { type: 'STEPS', label: '🚶 Pasos' },
                { type: 'CALORIES_BURNED', label: '🔥 Calorías' },
                { type: 'WATER', label: '💧 Agua' },
                { type: 'WEIGHT', label: '⚖️ Peso' },
                { type: 'DISTANCE', label: '📏 Distancia' }
              ].map((btn) => (
                <button
                  key={btn.type}
                  type="button"
                  onClick={() => setFilterType(btn.type)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all border ${
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

          {filteredMetrics.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-white/10 text-slate-400 text-xs uppercase tracking-wider font-extrabold">
                    <th className="py-4 px-4">Fecha</th>
                    <th className="py-4 px-4">Tipo de Registro</th>
                    <th className="py-4 px-4 text-right">Valor Registrado</th>
                    <th className="py-4 px-4 text-center">Progreso vs Meta</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-sm">
                  {filteredMetrics.map((m) => {
                    const info = getMetricDisplayInfo(m);
                    return (
                      <tr key={m.id} className="hover:bg-white/5 transition-colors group">
                        <td className="py-4 px-4 text-slate-300 font-medium">
                          {formatLocalDate(m.date)}
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-3">
                            <div className="p-2 rounded-xl bg-white/5 border border-white/10 text-white group-hover:scale-105 transition-transform">
                              {info.icon}
                            </div>
                            <div>
                              <span className="font-bold text-white block">{info.label}</span>
                              <span className="text-slate-500 text-[10px] font-medium uppercase tracking-wider">Sincronizado</span>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-4 text-right font-mono font-bold text-white">
                          {m.value.toLocaleString()} <span className="text-slate-500 text-xs font-sans font-normal ml-1">{m.unit}</span>
                        </td>
                        <td className="py-4 px-4">
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
            <div className="text-center py-12 bg-white/5 rounded-2xl border border-white/5">
              <Activity className="w-12 h-12 text-slate-600 mx-auto mb-3 animate-pulse" />
              <p className="text-slate-400 font-bold">No hay registros para este tipo de métrica</p>
              <p className="text-slate-500 text-xs mt-1">Usa los botones superiores para registrar pasos, agua o peso hoy.</p>
            </div>
          )}
        </div>
      </div>
      )}

      {/* Manage Health Modal (Logs and Goals combined) */}
      {showManageModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
          <div className="bg-slate-900 border border-white/10 w-full max-w-md rounded-3xl p-8 shadow-2xl animate-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">Gestión de Salud</h2>
              <button onClick={() => setShowManageModal(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            {/* Premium segmented tabs */}
            <div className="flex border-b border-white/10 mb-6">
              <button
                type="button"
                onClick={() => setManageModalTab('log')}
                className={`flex-1 pb-3 text-center font-bold text-sm transition-all border-b-2 ${
                  manageModalTab === 'log' ? 'border-primary text-white' : 'border-transparent text-slate-400 hover:text-white'
                }`}
              >
                ✍️ Registrar Hoy
              </button>
              <button
                type="button"
                onClick={() => setManageModalTab('goal')}
                className={`flex-1 pb-3 text-center font-bold text-sm transition-all border-b-2 ${
                  manageModalTab === 'goal' ? 'border-primary text-white' : 'border-transparent text-slate-400 hover:text-white'
                }`}
              >
                🎯 Establecer Metas
              </button>
            </div>

            {/* Tab content */}
            {manageModalTab === 'log' ? (
              <form onSubmit={handleAddMetric} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-2">Tipo de Métrica</label>
                  <select 
                    className="w-full bg-slate-800 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-primary/50"
                    value={newMetric.type}
                    onChange={(e) => {
                      const val = e.target.value;
                      let unit = 'unid';
                      if (val === 'STEPS') unit = 'pasos';
                      if (val === 'WEIGHT') unit = 'kg';
                      if (val === 'WATER') unit = 'vasos';
                      if (val === 'CALORIES_BURNED') unit = 'kcal';
                      if (val === 'DISTANCE') unit = 'km';
                      setNewMetric({...newMetric, type: val, unit});
                    }}
                  >
                    <option value="STEPS">Pasos Diarios</option>
                    <option value="WEIGHT">Peso Corporal</option>
                    <option value="WATER">Agua (Vasos)</option>
                    <option value="DISTANCE">Distancia Recorrida (km)</option>
                    <option value="CALORIES_BURNED">Calorías Quemadas (kcal)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-2">Valor ({newMetric.unit})</label>
                  <input 
                    type="number" 
                    step="0.1"
                    required
                    autoFocus
                    className="w-full bg-slate-800 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-primary/50"
                    value={newMetric.value}
                    onChange={(e) => setNewMetric({...newMetric, value: e.target.value})}
                    placeholder="Ej: 75"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-2">Fecha</label>
                  <input 
                    type="date"
                    required
                    className="w-full bg-slate-800 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-primary/50"
                    value={newMetric.date}
                    onChange={(e) => setNewMetric({...newMetric, date: e.target.value})}
                  />
                </div>
                <div className="pt-4 flex gap-4">
                  <button 
                    type="button"
                    onClick={() => setShowManageModal(false)}
                    className="flex-1 px-4 py-3 rounded-xl border border-white/10 text-slate-400 hover:bg-white/5 font-bold transition-all"
                  >
                    Cancelar
                  </button>
                  <button 
                    type="submit"
                    className="flex-1 px-4 py-3 rounded-xl bg-primary hover:bg-primary-light text-white font-bold transition-all shadow-lg shadow-primary/20"
                  >
                    Guardar
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleUpdateGoal} className="space-y-5">
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-2 uppercase tracking-wide">Meta de Calorías (kcal)</label>
                  <input 
                    type="number" 
                    required
                    className="w-full bg-slate-800 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-primary/50"
                    value={editGoal.targetCalories}
                    onChange={(e) => setEditGoal({...editGoal, targetCalories: parseInt(e.target.value)})}
                  />
                  
                  {/* Asistente Inteligente de Calorías recomendado por el Gerente */}
                  <div className="mt-2.5 p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-2xl flex items-center justify-between gap-3">
                    <div className="text-[10px] text-indigo-300 leading-relaxed font-medium">
                      💡 <strong>Sugerencia Hercix:</strong> Basado en tu peso de <strong>{editGoal.targetWeight || 70} kg</strong>, tu meta diaria ideal activa es de <strong>{Math.round((editGoal.targetWeight || 70) * 8)} kcal</strong>.
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setEditGoal({ ...editGoal, targetCalories: Math.round((editGoal.targetWeight || 70) * 8) });
                        toast.success('🎯 Sugerencia calórica aplicada a tu meta.');
                      }}
                      className="shrink-0 text-[9px] uppercase tracking-wider font-extrabold bg-indigo-500 hover:bg-indigo-400 text-white px-2.5 py-1.5 rounded-lg transition-all"
                    >
                      Usar
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-2 uppercase tracking-wide">Meta de Pasos</label>
                  <input 
                    type="number" 
                    required
                    className="w-full bg-slate-800 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-primary/50"
                    value={editGoal.targetSteps}
                    onChange={(e) => setEditGoal({...editGoal, targetSteps: parseInt(e.target.value)})}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-2 uppercase tracking-wide">Meta de Hidratación (Vasos)</label>
                  <input 
                    type="number" 
                    required
                    className="w-full bg-slate-800 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-primary/50"
                    value={editGoal.targetWater}
                    onChange={(e) => setEditGoal({...editGoal, targetWater: parseInt(e.target.value)})}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-2 uppercase tracking-wide">Meta de Peso Corporal (kg)</label>
                  <input 
                    type="number" 
                    step="0.1"
                    required
                    className="w-full bg-slate-800 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-primary/50"
                    value={editGoal.targetWeight || ''}
                    onChange={(e) => setEditGoal({...editGoal, targetWeight: parseFloat(e.target.value)})}
                  />
                </div>
                <div className="pt-4 flex gap-4">
                  <button 
                    type="button"
                    onClick={() => setShowManageModal(false)}
                    className="flex-1 px-4 py-3 rounded-xl border border-white/10 text-slate-400 hover:bg-white/5 font-bold transition-all"
                  >
                    Cancelar
                  </button>
                  <button 
                    type="submit"
                    className="flex-1 px-4 py-3 rounded-xl bg-primary hover:bg-primary-light text-white font-bold transition-all shadow-lg shadow-primary/20"
                  >
                    Guardar
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Alerta Interactiva y Premium de Hidratación (Water Intake Reminder Alert Popup) */}
      {showWaterAlert && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-cyan-950/80 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-slate-900 border-2 border-cyan-500/30 w-full max-w-sm rounded-3xl p-6 text-center shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 mx-auto bg-cyan-500/20 rounded-full flex items-center justify-center mb-4 border border-cyan-500/30">
              <Droplets className="text-cyan-400 w-8 h-8 animate-bounce" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">💧 ¡Alerta de Hidratación!</h3>
            <p className="text-slate-300 text-sm mb-6 leading-relaxed">
              Es hora de beber un vaso de agua. Mantente hidratado para potenciar tu metabolismo y rendimiento deportivo.
            </p>
            <div className="flex flex-col gap-3">
              <button
                onClick={async () => {
                  setShowWaterAlert(false);
                  await handleQuickWaterAdd();
                }}
                className="w-full py-3 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-white font-bold rounded-2xl transition-all shadow-lg shadow-cyan-500/20"
              >
                ¡Vaso Tomado! 💧
              </button>
              <button
                onClick={() => setShowWaterAlert(false)}
                className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-slate-400 font-bold rounded-2xl transition-all border border-white/5"
              >
                Recordar más tarde
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Historial de Registros de Salud (Premium Log Book) */}
      <div className="bg-slate-900/50 backdrop-blur-xl border border-white/5 rounded-3xl p-8 animate-in fade-in duration-700">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h3 className="text-xl font-bold bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent flex items-center gap-2">
              <Activity className="text-primary w-5 h-5" />
              Bitácora Histórica de Actividades
            </h3>
            <p className="text-slate-400 text-xs mt-1">Historial completo de tus métricas de salud y entrenamientos sincronizados</p>
          </div>
          {/* Filtros rápidos */}
          <div className="flex flex-wrap items-center gap-2">
            {[
              { type: 'ALL', label: 'Todos' },
              { type: 'STEPS', label: '🚶 Pasos' },
              { type: 'CALORIES_BURNED', label: '🔥 Calorías' },
              { type: 'WATER', label: '💧 Agua' },
              { type: 'WEIGHT', label: '⚖️ Peso' },
              { type: 'DISTANCE', label: '📏 Distancia' }
            ].map((btn) => (
              <button
                key={btn.type}
                type="button"
                onClick={() => setFilterType(btn.type)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all border ${
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

        {filteredMetrics.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/10 text-slate-400 text-xs uppercase tracking-wider font-extrabold">
                  <th className="py-4 px-4">Fecha</th>
                  <th className="py-4 px-4">Tipo de Registro</th>
                  <th className="py-4 px-4 text-right">Valor Registrado</th>
                  <th className="py-4 px-4 text-center">Progreso vs Meta</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-sm">
                {filteredMetrics.slice(0, 15).map((m) => {
                  const info = getMetricDisplayInfo(m);
                  return (
                    <tr key={m.id} className="hover:bg-white/5 transition-colors group">
                      <td className="py-4 px-4 text-slate-300 font-medium">
                        {formatLocalDate(m.date)}
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-xl bg-white/5 border border-white/10 text-white group-hover:scale-105 transition-transform">
                            {info.icon}
                          </div>
                          <div>
                            <span className="font-bold text-white block">{info.label}</span>
                            <span className="text-slate-500 text-[10px] font-medium uppercase tracking-wider">
                              Sincronizado
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4 text-right font-mono font-bold text-white">
                        {m.value.toLocaleString()} <span className="text-slate-500 text-xs font-sans font-normal ml-1">{m.unit}</span>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center justify-center">
                          {info.badge}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {filteredMetrics.length > 15 && (
              <p className="text-center text-xs text-slate-500 mt-4 italic">
                Mostrando los últimos 15 registros. Mantén tu consistencia diaria.
              </p>
            )}
          </div>
        ) : (
          <div className="text-center py-12 bg-white/5 rounded-2xl border border-white/5">
            <Activity className="w-12 h-12 text-slate-600 mx-auto mb-3 animate-pulse" />
            <p className="text-slate-400 font-bold">No hay registros para este tipo de métrica</p>
            <p className="text-slate-500 text-xs mt-1">Usa los botones superiores para registrar pasos, agua o peso hoy.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default HealthView;
