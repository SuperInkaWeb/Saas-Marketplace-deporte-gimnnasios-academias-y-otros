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
  Calendar
} from 'lucide-react';
import { motion } from 'framer-motion';
import { PayMeModal } from '../../components/payment/PayMeModal';

const PlanCard: React.FC<{ plan: any; onSubscribe: (id: string) => void }> = ({ plan, onSubscribe }) => (
  <motion.div 
    whileHover={{ scale: 1.02 }}
    className={`glass-card p-8 flex flex-col border-white/5 relative overflow-hidden transition-all ${
      plan.name === 'VIP' ? 'ring-2 ring-primary-light/50 border-primary-light/20 shadow-2xl shadow-primary/20' : ''
    }`}
  >
    {plan.name === 'VIP' && (
      <div className="absolute top-4 right-4 bg-primary-light text-white text-[10px] font-bold px-2 py-1 rounded-full uppercase">
        Más Popular
      </div>
    )}
    
    <div className="flex items-center gap-3 mb-6">
      <div className={`p-3 rounded-xl ${plan.name === 'VIP' ? 'bg-primary/20 text-primary-light' : 'bg-white/5 text-slate-400'}`}>
        {plan.name === 'VIP' ? <Crown /> : plan.name === 'Standard' ? <Zap /> : <ShieldCheck />}
      </div>
      <h3 className="text-xl font-bold text-white">{plan.name}</h3>
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
        <span>Gimnasio: {plan.gym?.name || 'Varios'}</span>
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
        plan.name === 'VIP' ? 'btn-primary shadow-lg shadow-primary/30' : 'bg-white/5 hover:bg-white/10 text-white'
      }`}
    >
      Seleccionar Plan
    </button>
  </motion.div>
);

const MembershipsPage: React.FC = () => {
  const [plans, setPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<any | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const { data } = await api.get('/memberships/plans');
        setPlans(data);
      } catch (err) {
        console.error('Error fetching plans:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchPlans();
  }, []);

  const handleOpenPayMe = (planId: string) => {
    const plan = plans.find(p => p.id === planId);
    if (plan) {
      setSelectedPlan(plan);
    }
  };

  const handleConfirmSubscription = async () => {
    if (!selectedPlan) return;
    try {
      await api.post('/memberships/subscribe', { planId: selectedPlan.id });
      setMessage(`¡Pago procesado con Pay-Me! Suscripción a ${selectedPlan.name} activa.`);
      setTimeout(() => setMessage(null), 4000);
      setSelectedPlan(null);
    } catch (err) {
      alert('Error en la suscripción tras realizar el pago.');
      setSelectedPlan(null);
    }
  };


  return (
    <div className="space-y-8">
      <header className="text-center max-w-2xl mx-auto space-y-4 mb-12">
        <h1 className="text-4xl font-extrabold text-white tracking-tight">Planes de Membresía</h1>
        <p className="text-slate-400">Escoge el nivel que mejor se adapte a tu estilo de vida y objetivos fitness.</p>
      </header>

      {message && (
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="bg-primary/20 border border-primary-light/30 p-4 rounded-xl text-primary-light text-center font-bold">
          {message}
        </motion.div>
      )}

      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="text-primary w-12 h-12 animate-spin" />
        </div>
      ) : plans.length > 0 ? (
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

      {/* Pay-Me Modal */}
      {selectedPlan && (
        <PayMeModal
          isOpen={!!selectedPlan}
          onClose={() => setSelectedPlan(null)}
          onSuccess={handleConfirmSubscription}
          amount={Number(selectedPlan.price)}
          description={`Membresía ${selectedPlan.name} - ${selectedPlan.durationDays} días`}
        />
      )}
    </div>
  );
};

export default MembershipsPage;
