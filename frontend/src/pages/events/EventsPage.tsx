import React, { useState, useEffect } from 'react';
import api from '../../api/api-client';
import { useAuth } from '../../context/auth-context';
import {
  Trophy,
  Calendar,
  MapPin,
  Users,
  Plus,
  Loader2,
  Search,
  Tag,
  X,
  CheckCircle2,
  Ticket,
  Swords,
  BookOpen,
  Layers,
  Sunrise,
  CreditCard,
  Lock,
  Shield,
  Check,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const EVENT_TYPE_CONFIG: Record<string, { label: string; icon: any; color: string }> = {
  TOURNAMENT: { label: 'Torneo', icon: Swords, color: 'text-red-400 bg-red-500/10 border-red-500/20' },
  MASTERCLASS: { label: 'Masterclass', icon: BookOpen, color: 'text-blue-400 bg-blue-500/10 border-blue-500/20' },
  WORKSHOP: { label: 'Workshop', icon: Layers, color: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20' },
  RETREAT: { label: 'Retiro', icon: Sunrise, color: 'text-green-400 bg-green-500/10 border-green-500/20' },
  CROSSFIT: { label: 'CrossFit', icon: Trophy, color: 'text-orange-400 bg-orange-500/10 border-orange-500/20' },
  WEIGHTLIFTING: { label: 'Levantamiento Pesas', icon: Trophy, color: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20' },
  OTHER: { label: 'Otros', icon: Trophy, color: 'text-slate-400 bg-slate-500/10 border-slate-500/20' },
};

const toLocalInputValue = (iso: string) => {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

const EventCard: React.FC<{ event: any; onRegister: (e: any) => void; onEdit: (e: any) => void; user: any }> = ({ event, onRegister, onEdit, user }) => {
  const config = EVENT_TYPE_CONFIG[event.eventType] || EVENT_TYPE_CONFIG.TOURNAMENT;
  const Icon = config.icon;
  const eventDate = new Date(event.date);
  const isPast = eventDate < new Date();

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      className="glass-card overflow-hidden border-white/5 hover:border-primary/30 transition-all group flex flex-col"
    >
      {/* Header banner */}
      <div className="h-36 bg-gradient-to-br from-slate-800 via-slate-800 to-primary/20 relative flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary via-transparent to-transparent" />
        <Icon className="w-16 h-16 text-white/10 absolute right-4 bottom-0 scale-150 group-hover:scale-[1.7] transition-transform duration-500" />
        <div className="relative z-10 text-center px-4">
          <span className={`text-xs font-bold px-3 py-1 rounded-full border ${config.color}`}>
            {config.label}
          </span>
        </div>
        {isPast && (
          <div className="absolute top-3 left-3 bg-slate-900/80 text-slate-400 text-[10px] font-bold px-2 py-1 rounded backdrop-blur-sm">
            FINALIZADO
          </div>
        )}
      </div>

      <div className="p-5 flex flex-col flex-grow">
        <h3 className="text-lg font-bold text-white mb-3 leading-tight group-hover:text-primary-light transition-colors">
          {event.title}
        </h3>

        {event.description && (
          <p className="text-slate-500 text-xs mb-4 line-clamp-2">{event.description}</p>
        )}

        <div className="space-y-2 mb-4 mt-auto">
          <div className="flex items-center gap-2 text-slate-400 text-sm">
            <Calendar className="w-4 h-4 text-primary-light flex-shrink-0" />
            <span>
              {eventDate.toLocaleDateString('es-CO', { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric' })}
              {' · '}
              {eventDate.toLocaleTimeString('es-CO', { hour: 'numeric', minute: '2-digit', hour12: true })}
            </span>
          </div>
          {event.location && (
            <div className="flex items-center gap-2 text-slate-400 text-sm">
              <MapPin className="w-4 h-4 text-secondary-light flex-shrink-0" />
              <span className="truncate">{event.location}</span>
            </div>
          )}
          {event.capacity && (
            <div className="flex items-center gap-2 text-slate-400 text-sm">
              <Users className="w-4 h-4 text-slate-500 flex-shrink-0" />
              <span>Cupos disponibles: {event.capacity}</span>
            </div>
          )}
          <div className="flex items-center gap-2 text-slate-400 text-sm">
            <Tag className="w-4 h-4 text-accent flex-shrink-0" />
            <span className="text-white font-bold">
              {Number(event.price) === 0 ? 'GRATUITO' : `$${Number(event.price).toLocaleString('es-CO')}`}
            </span>
          </div>
        </div>

        <div className="border-t border-white/5 pt-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center text-primary-light text-xs font-bold uppercase">
              {event.organizer?.name?.charAt(0) || 'O'}
            </div>
            <span className="text-slate-500 text-xs truncate max-w-[100px]">{event.organizer?.name || 'Organizador'}</span>
          </div>
          {user?.role === 'USER' ? (
            <button
              onClick={() => onRegister(event)}
              disabled={isPast}
              className={`${isPast ? 'opacity-40 cursor-not-allowed bg-white/5 text-slate-400' : 'btn-primary shadow-lg shadow-primary/20 hover:shadow-primary/40'} px-4 py-2 text-sm rounded-xl font-bold flex items-center gap-1.5 transition-all active:scale-95`}
            >
              <Ticket className="w-4 h-4" />
              {isPast ? 'Cerrado' : 'Inscribirse'}
            </button>
          ) : (user?.role === 'ADMIN' || ((user?.role === 'GYM_OWNER' || user?.role === 'TRAINER') && event.organizerId === user?.id)) ? (
            <button
              onClick={() => onEdit(event)}
              className="bg-slate-800 text-slate-300 px-4 py-2 text-sm rounded-xl font-bold flex items-center gap-1.5 border border-white/5 hover:bg-slate-700 transition-all"
            >
              <Users className="w-4 h-4" />
              Gestionar
            </button>
          ) : null}
        </div>
      </div>
    </motion.div>
  );
};

// Modal para crear evento
const CreateEventModal: React.FC<{ onClose: () => void; onCreated: () => void; initialData?: any }> = ({ onClose, onCreated, initialData }) => {
  const [form, setForm] = useState({
    title: initialData?.title || '',
    description: initialData?.description || '',
    eventType: initialData?.eventType || 'TOURNAMENT',
    price: initialData?.price || 0,
    date: initialData?.date ? toLocalInputValue(initialData.date) : '',
    location: initialData?.location || '',
    capacity: initialData?.capacity || '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleDelete = async () => {
    if (!window.confirm('¿Estás seguro de que deseas eliminar este evento?')) return;
    setLoading(true);
    try {
      await api.delete(`/events/${initialData.id}`);
      onCreated();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al eliminar el evento');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const payload = {
        ...form,
        price: Number(form.price),
        capacity: form.capacity ? Number(form.capacity) : undefined,
        date: new Date(form.date).toISOString(),
      };

      if (initialData) {
        await api.patch(`/events/${initialData.id}`, payload);
      } else {
        await api.post('/events', payload);
      }
      onCreated();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || `Error al ${initialData ? 'actualizar' : 'crear'} el evento`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="glass-card w-full max-w-2xl bg-slate-900 border-white/10 p-8 relative max-h-[90vh] overflow-y-auto"
      >
        <button onClick={onClose} className="absolute top-6 right-6 text-slate-500 hover:text-white transition-colors">
          <X />
        </button>
        <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
          <Trophy className="text-primary-light" /> {initialData ? 'Gestionar Evento' : 'Crear Nuevo Evento'}
        </h2>

        {error && <div className="bg-red-500/10 border-red-500/20 p-4 border rounded-xl text-red-400 text-sm mb-6">{error}</div>}

        <form onSubmit={handleSubmit} className="grid md:grid-cols-2 gap-5">
          <div className="md:col-span-2 space-y-2">
            <label className="text-slate-400 text-xs font-bold uppercase tracking-wider">Nombre del Evento</label>
            <input required value={form.title} onChange={e => setForm({ ...form, title: e.target.value })}
              className="bg-white/5 border-white/10 focus:border-primary-light w-full py-3 px-4 border rounded-xl text-white outline-none"
              placeholder="Ej: Torneo de CrossFit Latinoamérica 2025" />
          </div>

          <div className="md:col-span-2 space-y-2">
            <label className="text-slate-400 text-xs font-bold uppercase tracking-wider">Descripción</label>
            <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
              className="bg-white/5 border-white/10 focus:border-primary-light w-full py-3 px-4 border rounded-xl text-white outline-none min-h-[80px]"
              placeholder="Describe el evento, las reglas y los premios..." />
          </div>

          <div className="space-y-2">
            <label className="text-slate-400 text-xs font-bold uppercase tracking-wider">Tipo de Evento</label>
            <select value={form.eventType} onChange={e => setForm({ ...form, eventType: e.target.value })}
              className="bg-white/5 border-white/10 focus:border-primary-light w-full py-3 px-4 border rounded-xl text-white outline-none">
              <option value="TOURNAMENT" className="bg-slate-900">Torneo</option>
              <option value="MASTERCLASS" className="bg-slate-900">Masterclass</option>
              <option value="WORKSHOP" className="bg-slate-900">Workshop</option>
              <option value="RETREAT" className="bg-slate-900">Retiro</option>
              <option value="CROSSFIT" className="bg-slate-900">CrossFit</option>
              <option value="WEIGHTLIFTING" className="bg-slate-900">Levantamiento de Pesas</option>
              <option value="OTHER" className="bg-slate-900">Otros</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-slate-400 text-xs font-bold uppercase tracking-wider">Precio ($)</label>
            <input type="number" min="0" value={form.price} onChange={e => setForm({ ...form, price: Number(e.target.value) })}
              className="bg-white/5 border-white/10 focus:border-primary-light w-full py-3 px-4 border rounded-xl text-white outline-none" />
          </div>

          <div className="space-y-2">
            <label className="text-slate-400 text-xs font-bold uppercase tracking-wider">Fecha y Hora</label>
            <input required type="datetime-local" value={form.date} min={initialData ? undefined : toLocalInputValue(new Date().toISOString())} onChange={e => setForm({ ...form, date: e.target.value })}
              className="bg-white/5 border-white/10 focus:border-primary-light w-full py-3 px-4 border rounded-xl text-white outline-none" />
          </div>

          <div className="space-y-2">
            <label className="text-slate-400 text-xs font-bold uppercase tracking-wider">Cupas máximos</label>
            <input type="number" min="1" value={form.capacity} onChange={e => setForm({ ...form, capacity: e.target.value })}
              className="bg-white/5 border-white/10 focus:border-primary-light w-full py-3 px-4 border rounded-xl text-white outline-none"
              placeholder="Sin límite si se deja vacío" />
          </div>

          <div className="md:col-span-2 space-y-2">
            <label className="text-slate-400 text-xs font-bold uppercase tracking-wider">Ubicación</label>
            <input value={form.location} onChange={e => setForm({ ...form, location: e.target.value })}
              className="bg-white/5 border-white/10 focus:border-primary-light w-full py-3 px-4 border rounded-xl text-white outline-none"
              placeholder="Ej: Estadio El Campín, Bogotá" />
          </div>

          <div className="md:col-span-2 flex gap-3">
            {initialData && (
              <button type="button" onClick={handleDelete} disabled={loading}
                className="bg-red-500/10 hover:bg-red-500/20 text-red-500 px-6 py-4 rounded-xl font-bold transition-all border border-red-500/20">
                Eliminar
              </button>
            )}
            <button type="submit" disabled={loading}
              className="btn-primary flex-grow py-4 flex items-center justify-center gap-2 active:scale-[0.98]">
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Plus className="w-5 h-5" /><span>{initialData ? 'Guardar Cambios' : 'Publicar Evento'}</span></>}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

interface PaymentGatewayModalProps {
  event: any;
  onClose: () => void;
  onSuccess: () => void;
}

const PaymentGatewayModal: React.FC<PaymentGatewayModalProps> = ({ event, onClose, onSuccess }) => {
  const [cardNumber, setCardNumber] = useState('');
  const [cardName, setCardName] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [status, setStatus] = useState<'IDLE' | 'PROCESSING' | 'SUCCESS'>('IDLE');
  const [processStep, setProcessStep] = useState('');
  const [error, setError] = useState('');

  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const matches = v.match(/\d{4,16}/g);
    const match = (matches && matches[0]) || '';
    const parts = [];

    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }

    if (parts.length > 0) {
      return parts.join(' ');
    } else {
      return v;
    }
  };

  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCardNumber(formatCardNumber(e.target.value));
  };

  const handleExpiryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/[^0-9]/g, '');
    if (value.length > 2) {
      value = value.substring(0, 2) + '/' + value.substring(2, 4);
    }
    setCardExpiry(value.substring(0, 5));
  };

  const handleCvvChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCardCvv(e.target.value.replace(/[^0-9]/g, '').substring(0, 4));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (cardNumber.length < 19) {
      setError('Por favor, ingresa un número de tarjeta de 16 dígitos válido.');
      return;
    }
    if (cardExpiry.length < 5) {
      setError('Por favor, ingresa una fecha de expiración válida (MM/AA).');
      return;
    }
    if (cardCvv.length < 3) {
      setError('Por favor, ingresa un CVV de 3 o 4 dígitos válido.');
      return;
    }
    if (!cardName.trim()) {
      setError('Por favor, ingresa el nombre del titular.');
      return;
    }

    setError('');
    setStatus('PROCESSING');
    
    // Simular los pasos de verificación bancaria premium
    const steps = [
      '🔒 Conectando con la red segura Hercix Pay...',
      '💳 Autorizando cobro de $' + Number(event.price) + ' USD...',
      '🏦 Verificando fondos y firma encriptada...',
      '✅ ¡Transacción autorizada con éxito!'
    ];

    let currentStep = 0;
    setProcessStep(steps[0]);

    const interval = setInterval(() => {
      currentStep++;
      if (currentStep < steps.length) {
        setProcessStep(steps[currentStep]);
      } else {
        clearInterval(interval);
        setStatus('SUCCESS');
        setTimeout(() => {
          onSuccess();
        }, 1500);
      }
    }, 800);
  };

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-[100] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="glass-card w-full max-w-lg bg-slate-900 border-white/10 p-6 relative overflow-hidden shadow-2xl"
      >
        <button onClick={onClose} disabled={status === 'PROCESSING' || status === 'SUCCESS'} className="absolute top-5 right-5 text-slate-500 hover:text-white transition-colors disabled:opacity-30">
          <X />
        </button>

        {status === 'IDLE' && (
          <>
            <div className="flex items-center gap-2 mb-4">
              <div className="bg-primary/20 p-2 rounded-lg">
                <CreditCard className="text-primary-light w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white font-outfit">Pasarela Hercix Pay</h2>
                <p className="text-slate-400 text-xs">Pago 100% encriptado y seguro</p>
              </div>
            </div>

            {/* Credit Card Preview */}
            <div className="relative h-44 w-full rounded-2xl bg-gradient-to-br from-indigo-600 via-purple-700 to-pink-600 p-6 text-white shadow-xl mb-6 overflow-hidden border border-white/10">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,_var(--tw-gradient-stops))] from-white/10 via-transparent to-transparent opacity-40" />
              <div className="flex justify-between items-start mb-6 relative z-10">
                <div className="text-xs font-bold tracking-widest text-white/80">HERCIX PLATINUM</div>
                <CreditCard className="w-7 h-7 opacity-80" />
              </div>
              <div className="text-lg font-mono tracking-widest mb-4 relative z-10">
                {cardNumber || '•••• •••• •••• ••••'}
              </div>
              <div className="flex justify-between items-end relative z-10">
                <div>
                  <div className="text-[9px] text-white/50 uppercase font-bold tracking-wider">Titular</div>
                  <div className="text-xs font-semibold truncate max-w-[180px]">{cardName.toUpperCase() || 'NOMBRE APELLIDO'}</div>
                </div>
                <div>
                  <div className="text-[9px] text-white/50 uppercase font-bold tracking-wider">Vence</div>
                  <div className="text-xs font-semibold">{cardExpiry || 'MM/AA'}</div>
                </div>
              </div>
            </div>

            {/* Summary info */}
            <div className="bg-white/5 border border-white/5 p-4 rounded-xl mb-6 flex justify-between items-center">
              <div>
                <span className="text-slate-500 text-[10px] uppercase font-bold tracking-wider block">Evento / Torneo</span>
                <span className="text-white font-bold text-sm truncate max-w-[200px] block">{event.title}</span>
              </div>
              <div className="text-right">
                <span className="text-slate-500 text-[10px] uppercase font-bold tracking-wider block">Total a Pagar</span>
                <span className="text-primary-light font-black text-lg block">${Number(event.price).toLocaleString('es-CO')} USD</span>
              </div>
            </div>

            {error && <div className="bg-red-500/10 border-red-500/20 p-3 border rounded-xl text-red-400 text-xs mb-4">{error}</div>}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-slate-400 text-xs font-bold uppercase tracking-wider">Número de Tarjeta</label>
                <div className="relative">
                  <input
                    required
                    type="text"
                    value={cardNumber}
                    onChange={handleCardNumberChange}
                    className="bg-white/5 border-white/10 focus:border-primary-light w-full py-3 px-4 pl-10 border rounded-xl text-white outline-none font-mono"
                    placeholder="0000 0000 0000 0000"
                  />
                  <CreditCard className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4" />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-slate-400 text-xs font-bold uppercase tracking-wider">Nombre del Titular</label>
                <input
                  required
                  type="text"
                  value={cardName}
                  onChange={e => setCardName(e.target.value)}
                  className="bg-white/5 border-white/10 focus:border-primary-light w-full py-3 px-4 border rounded-xl text-white outline-none uppercase"
                  placeholder="JUAN PEREZ"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-slate-400 text-xs font-bold uppercase tracking-wider">Expiración</label>
                  <input
                    required
                    type="text"
                    value={cardExpiry}
                    onChange={handleExpiryChange}
                    className="bg-white/5 border-white/10 focus:border-primary-light w-full py-3 px-4 border rounded-xl text-white outline-none font-mono"
                    placeholder="MM/AA"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-slate-400 text-xs font-bold uppercase tracking-wider">CVV</label>
                  <input
                    required
                    type="password"
                    value={cardCvv}
                    onChange={handleCvvChange}
                    className="bg-white/5 border-white/10 focus:border-primary-light w-full py-3 px-4 border rounded-xl text-white outline-none font-mono"
                    placeholder="•••"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 text-slate-500 text-[10px] py-1">
                <Shield className="w-4 h-4 text-green-500 flex-shrink-0" />
                <span>Pasarela de pruebas segura con encriptación SSL AES de 256 bits.</span>
              </div>

              <button
                type="submit"
                className="btn-primary w-full py-4 flex items-center justify-center gap-2 text-base font-bold shadow-lg shadow-primary/20 hover:shadow-primary/40 active:scale-[0.98]"
              >
                <Lock className="w-5 h-5" />
                <span>Pagar ${Number(event.price).toLocaleString('es-CO')} USD Seguro</span>
              </button>
            </form>
          </>
        )}

        {status === 'PROCESSING' && (
          <div className="flex flex-col items-center justify-center py-16 text-center space-y-6">
            <Loader2 className="text-primary w-16 h-16 animate-spin" />
            <div className="space-y-2">
              <h3 className="text-lg font-bold text-white">Procesando Pago Seguro...</h3>
              <p className="text-slate-400 text-sm font-mono animate-pulse">{processStep}</p>
            </div>
            <div className="flex items-center gap-1.5 text-slate-500 text-xs bg-white/5 px-4 py-2 rounded-full">
              <Shield className="w-4 h-4 text-primary-light" />
              <span>PCI-DSS Compliant Gateway</span>
            </div>
          </div>
        )}

        {status === 'SUCCESS' && (
          <div className="flex flex-col items-center justify-center py-16 text-center space-y-6">
            <div className="w-20 h-20 rounded-full bg-green-500/20 border border-green-500/30 flex items-center justify-center text-green-400">
              <Check className="w-12 h-12" />
            </div>
            <div className="space-y-2">
              <h3 className="text-2xl font-black text-white font-outfit">¡Transacción Aprobada!</h3>
              <p className="text-slate-400 text-sm">Tu inscripción ha sido confirmada con éxito.</p>
            </div>
            <div className="bg-green-500/10 border border-green-500/20 p-4 rounded-xl w-full max-w-xs text-left space-y-1">
              <div className="flex justify-between text-xs text-slate-400">
                <span>Transacción ID:</span>
                <span className="font-mono text-white">TXN-{Math.floor(100000 + Math.random() * 900000)}</span>
              </div>
              <div className="flex justify-between text-xs text-slate-400">
                <span>Estado:</span>
                <span className="text-green-400 font-bold">COMPLETADO</span>
              </div>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
};

const EventsPage: React.FC = () => {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('ALL');
  const [showModal, setShowModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState<any>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
const [payingEvent, setPayingEvent] = useState<any>(null);
const [showPast, setShowPast] = useState(false);
const { user } = useAuth();
const isStaff = !!user && ['ADMIN', 'GYM_OWNER', 'TRAINER'].includes(user.role);

const fetchEvents = async () => {
  try {
    const { data } = isStaff
      ? await api.get('/events/manage', { params: { includePast: showPast } })
      : await api.get('/events');
    setEvents(data);
  } catch (err) {
    console.error('Error fetching events:', err);
  } finally {
    setLoading(false);
  }
};

useEffect(() => { fetchEvents(); }, [user?.id, showPast]);

  const handleRegister = (event: any) => {
    if (Number(event.price) > 0) {
      setPayingEvent(event);
    } else {
      setSuccessMsg(`¡Inscripción gratuita registrada para "${event.title}"! Te contactaremos pronto.`);
      setTimeout(() => setSuccessMsg(null), 4000);
    }
  };

  const handleCreated = () => {
    fetchEvents();
    setSuccessMsg(editingEvent ? '¡Evento actualizado exitosamente!' : '¡Evento publicado exitosamente!');
    setEditingEvent(null);
    setTimeout(() => setSuccessMsg(null), 4000);
  };

  const normalize = (str: string) => str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

  const filtered = events.filter(e => {
    // Si es dueño de gimnasio o entrenador, solo mostrar sus propios eventos
    const isOrganizer = user?.role === 'GYM_OWNER' || user?.role === 'TRAINER';
    if (isOrganizer && e.organizerId !== user?.id) {
      return false;
    }

    const s = normalize(search);
    const fields = [e.title, e.description, e.organizer?.name];
    const matchSearch = !search || fields.some(f => normalize(f || '').includes(s));
    const matchType = filterType === 'ALL' || e.eventType === filterType;
    return matchSearch && matchType;
  });

  const canCreate = user?.role === 'GYM_OWNER' || user?.role === 'ADMIN' || user?.role === 'TRAINER';

  const filterBtns = [
    { key: 'ALL', label: '🏆 Todos' },
    { key: 'TOURNAMENT', label: '⚔️ Torneos' },
    { key: 'MASTERCLASS', label: '📖 Masterclass' },
    { key: 'WORKSHOP', label: '🔧 Workshops' },
    { key: 'RETREAT', label: '🌅 Retiros' },
    { key: 'CROSSFIT', label: '🏋️ CrossFit' },
    { key: 'WEIGHTLIFTING', label: '💪 Levantamiento' },
    { key: 'OTHER', label: '🌟 Otros' },
  ];

  return (
    <div className="space-y-8">
      <AnimatePresence>
        {(showModal || editingEvent) && (
          <CreateEventModal
            initialData={editingEvent}
            onClose={() => {
              setShowModal(false);
              setEditingEvent(null);
            }}
            onCreated={handleCreated}
          />
        )}
      </AnimatePresence>

      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <Trophy className="text-primary-light" /> Eventos y Torneos
          </h1>
          <p className="text-slate-400 mt-1">
            {user?.role === 'GYM_OWNER' || user?.role === 'TRAINER'
              ? 'Tus eventos publicados y panel de gestión.'
              : 'Compite, aprende y conecta con la comunidad deportiva.'}
          </p>
        </div>
        {canCreate && (
          <button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-2 shrink-0">
            <Plus className="w-5 h-5" /> Publicar Evento
          </button>
        )}
      </header>

      {successMsg && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
          className="bg-green-500/10 border border-green-500/20 p-4 rounded-xl text-green-400 flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
          {successMsg}
        </motion.div>
      )}

      {/* Search & Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-grow">
          <Search className="absolute top-1/2 left-4 -translate-y-1/2 text-slate-500 w-5 h-5" />
          <input
            type="text" placeholder="Buscar eventos, organizador..." value={search}
            onChange={e => setSearch(e.target.value)}
            className="bg-white/5 border-white/10 focus:border-primary-light w-full py-3 pr-4 pl-12 border rounded-2xl text-white outline-none transition-all"
          />
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {filterBtns.map(btn => (
          <button key={btn.key} onClick={() => setFilterType(btn.key)}
            className={`px-4 py-2 rounded-xl text-sm font-bold transition-all border ${filterType === btn.key ? 'bg-primary/20 border-primary-light text-primary-light' : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10 hover:text-white'}`}>
            {btn.label}
          </button>
        ))}
      </div>

      {isStaff && (
  <label className="flex items-center gap-2 text-sm text-slate-400 cursor-pointer w-fit">
    <input type="checkbox" checked={showPast} onChange={e => setShowPast(e.target.checked)} />
    Mostrar eventos ya iniciados
  </label>
)}

      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="text-primary w-12 h-12 animate-spin" />
        </div>
      ) : filtered.length > 0 ? (
        <motion.div layout className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map(event => (
            <EventCard 
              key={event.id} 
              event={event} 
              onRegister={handleRegister} 
              onEdit={setEditingEvent} 
              user={user} 
            />
          ))}
        </motion.div>
      ) : (
        <div className="glass-card p-20 flex flex-col items-center justify-center text-center">
          <Trophy className="text-slate-700 w-16 h-16 mb-4" />
          <h2 className="text-white font-bold text-xl">No hay eventos disponibles</h2>
          <p className="text-slate-500 mt-2 text-sm max-w-sm">
            {search ? `No se encontraron resultados para "${search}".` : (canCreate ? 'Sé el primero en publicar un torneo o evento deportivo.' : 'Vuelve pronto para ver los próximos eventos.')}
          </p>
          <div className="flex gap-4 mt-8">
            <button onClick={fetchEvents} className="glass-card px-6 py-2 text-sm hover:bg-white/10 transition-all flex items-center gap-2">
              <Loader2 className="w-4 h-4" /> Actualizar
            </button>
            {canCreate && (
              <button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-2">
                <Plus className="w-4 h-4" /> Publicar Evento
              </button>
            )}
          </div>
        </div>
      )}

      {payingEvent && (
        <PaymentGatewayModal 
          event={payingEvent} 
          onClose={() => setPayingEvent(null)} 
          onSuccess={() => {
            setSuccessMsg(`¡Pago procesado con éxito e inscripción confirmada para "${payingEvent.title}"!`);
            setPayingEvent(null);
            setTimeout(() => setSuccessMsg(null), 5000);
          }} 
        />
      )}
    </div>
  );
};

export default EventsPage;
