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
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const EVENT_TYPE_CONFIG: Record<string, { label: string; icon: any; color: string }> = {
  TOURNAMENT: { label: 'Torneo', icon: Swords, color: 'text-red-400 bg-red-500/10 border-red-500/20' },
  MASTERCLASS: { label: 'Masterclass', icon: BookOpen, color: 'text-blue-400 bg-blue-500/10 border-blue-500/20' },
  WORKSHOP: { label: 'Workshop', icon: Layers, color: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20' },
  RETREAT: { label: 'Retiro', icon: Sunrise, color: 'text-green-400 bg-green-500/10 border-green-500/20' },
};

const EventCard: React.FC<{ event: any; onRegister: (e: any) => void }> = ({ event, onRegister }) => {
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
            <span>{eventDate.toLocaleDateString('es-CO', { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric' })}</span>
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
          <button
            onClick={() => onRegister(event)}
            disabled={isPast}
            className={`${isPast ? 'opacity-40 cursor-not-allowed bg-white/5 text-slate-400' : 'btn-primary shadow-lg shadow-primary/20 hover:shadow-primary/40'} px-4 py-2 text-sm rounded-xl font-bold flex items-center gap-1.5 transition-all active:scale-95`}
          >
            <Ticket className="w-4 h-4" />
            {isPast ? 'Cerrado' : 'Inscribirse'}
          </button>
        </div>
      </div>
    </motion.div>
  );
};

// Modal para crear evento
const CreateEventModal: React.FC<{ onClose: () => void; onCreated: () => void }> = ({ onClose, onCreated }) => {
  const [form, setForm] = useState({
    title: '',
    description: '',
    eventType: 'TOURNAMENT',
    price: 0,
    date: '',
    location: '',
    capacity: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await api.post('/events', {
        ...form,
        price: Number(form.price),
        capacity: form.capacity ? Number(form.capacity) : undefined,
        date: new Date(form.date).toISOString(),
      });
      onCreated();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al crear el evento');
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
          <Trophy className="text-primary-light" /> Crear Nuevo Evento
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
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-slate-400 text-xs font-bold uppercase tracking-wider">Precio ($)</label>
            <input type="number" min="0" value={form.price} onChange={e => setForm({ ...form, price: Number(e.target.value) })}
              className="bg-white/5 border-white/10 focus:border-primary-light w-full py-3 px-4 border rounded-xl text-white outline-none" />
          </div>

          <div className="space-y-2">
            <label className="text-slate-400 text-xs font-bold uppercase tracking-wider">Fecha y Hora</label>
            <input required type="datetime-local" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })}
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

          <div className="md:col-span-2">
            <button type="submit" disabled={loading}
              className="btn-primary w-full py-4 flex items-center justify-center gap-2 active:scale-[0.98]">
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Plus className="w-5 h-5" /><span>Publicar Evento</span></>}
            </button>
          </div>
        </form>
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
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const { user } = useAuth();

  const fetchEvents = async () => {
    try {
      const { data } = await api.get('/events');
      setEvents(data);
    } catch (err) {
      console.error('Error fetching events:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchEvents(); }, []);

  const handleRegister = (event: any) => {
    setSuccessMsg(`¡Inscripción registrada para "${event.title}"! Te contactaremos pronto.`);
    setTimeout(() => setSuccessMsg(null), 4000);
  };

  const handleCreated = () => {
    fetchEvents();
    setSuccessMsg('¡Evento publicado exitosamente!');
    setTimeout(() => setSuccessMsg(null), 4000);
  };

  const filtered = events.filter(e => {
    const matchSearch = e.title.toLowerCase().includes(search.toLowerCase());
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
  ];

  return (
    <div className="space-y-8">
      <AnimatePresence>
        {showModal && (
          <CreateEventModal onClose={() => setShowModal(false)} onCreated={handleCreated} />
        )}
      </AnimatePresence>

      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <Trophy className="text-primary-light" /> Eventos y Torneos
          </h1>
          <p className="text-slate-400 mt-1">Compite, aprende y conecta con la comunidad deportiva.</p>
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
            type="text" placeholder="Buscar eventos, torneos..." value={search}
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

      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="text-primary w-12 h-12 animate-spin" />
        </div>
      ) : filtered.length > 0 ? (
        <motion.div layout className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map(event => (
            <EventCard key={event.id} event={event} onRegister={handleRegister} />
          ))}
        </motion.div>
      ) : (
        <div className="glass-card p-20 flex flex-col items-center justify-center text-center">
          <Trophy className="text-slate-700 w-16 h-16 mb-4" />
          <h2 className="text-white font-bold text-xl">No hay eventos disponibles</h2>
          <p className="text-slate-500 mt-2 text-sm">
            {canCreate ? 'Sé el primero en publicar un torneo o evento.' : 'Vuelve pronto para ver los próximos eventos.'}
          </p>
          {canCreate && (
            <button onClick={() => setShowModal(true)} className="btn-primary mt-6 flex items-center gap-2">
              <Plus className="w-4 h-4" /> Publicar primero
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default EventsPage;
