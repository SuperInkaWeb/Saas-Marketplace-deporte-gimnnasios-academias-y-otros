import React, { useState, useEffect } from 'react';
import api from '../../api/api-client';
import { useAuth } from '../../context/auth-context';
import { 
  Users, 
  Search,
  Loader2,
  CheckCircle2,
  CalendarHeart,
  Star,
  Plus
} from 'lucide-react';
import { motion } from 'framer-motion';
import CreateProfessionalModal from './CreateProfessionalModal';


const ProfessionalCard: React.FC<{ professional: any; onBook: (p: any) => void; isBooking: boolean; isOwner: boolean; onEdit: (p: any) => void; onDelete: (id: string) => void; }> = ({ professional, onBook, isBooking, isOwner, onEdit, onDelete }) => (
  <motion.div 
    whileHover={{ y: -5 }}
    className="glass-card overflow-hidden border-white/5 hover:border-accent/30 transition-all group p-5 flex flex-col items-center text-center relative"
  >
    <div className="absolute top-3 right-3 flex items-center gap-1 bg-white/10 px-2 py-1 rounded-full text-xs text-yellow-400 font-bold">
      <Star className="w-3 h-3 fill-current" /> 4.9
    </div>

    <div className="w-24 h-24 mb-4 rounded-full bg-slate-800 border-2 border-accent/20 overflow-hidden flex items-center justify-center">
      {professional.provider?.avatarUrl ? (
        <img src={professional.provider.avatarUrl} alt={professional.title} className="w-full h-full object-cover" />
      ) : (
        <Users className="w-10 h-10 text-slate-600" />
      )}
    </div>
    
    <span className="bg-accent/20 text-accent text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider mb-2">
      {({
        PERSONAL_TRAINING: '💪 Personal Training',
        NUTRITION_PLAN: '🥗 Nutrición',
        PHYSIOTHERAPY: '🏥 Fisioterapia',
        CONSULTATION: '📋 Consulta',
      } as any)[professional.serviceType] || professional.serviceType}
    </span>

    <h3 className="text-lg font-bold text-white mb-1 line-clamp-1">{professional.title}</h3>
    <p className="text-slate-400 text-xs mb-1">Por {professional.provider?.name || 'Profesional'}</p>
    
    <div className="text-slate-500 text-xs mb-4 line-clamp-2 min-h-[32px]">
      {professional.description || 'Consulta personalizada y entrenamiento al más alto nivel.'}
    </div>
    
    <div className="flex items-center justify-between w-full mt-auto pt-4 border-t border-white/5 gap-2">
      <span className="text-xl font-extrabold text-white">S/ {Number(professional.price).toFixed(2)}<span className="text-xs text-slate-500 font-normal"> / {professional.durationMin}m</span></span>
      <div className="flex items-center gap-2">
        {isOwner && (
          <>
            <button onClick={() => onEdit(professional)} className="text-slate-400 hover:text-white text-xs font-bold px-2">Editar</button>
            <button onClick={() => onDelete(professional.id)} className="text-red-400 hover:text-red-300 text-xs font-bold px-2">Eliminar</button>
          </>
        )}
        <button 
            onClick={() => onBook(professional)}
            disabled={isBooking}
            className="bg-accent hover:bg-accent-dark disabled:opacity-50 disabled:cursor-not-allowed px-4 py-2 rounded-xl transition-all shadow-lg shadow-accent/20 active:scale-95 text-white text-sm font-bold flex items-center gap-2"
        >
            {isBooking ? <Loader2 className="w-4 h-4 animate-spin" /> : <CalendarHeart className="w-4 h-4" />} Reservar
        </button>
      </div>
    </div>
  </motion.div>
);

const ProfessionalsPage: React.FC = () => {
  const [professionals, setProfessionals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [message, setMessage] = useState<{type: 'success'|'error', text: string} | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingProf, setEditingProf] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
const [bookingServiceId, setBookingServiceId] = useState<string | null>(null);
  
  // New States for Trainer / Received Bookings
  const [activeViewTab, setActiveViewTab] = useState<'catalog' | 'received_bookings'>('catalog');
  const [receivedBookings, setReceivedBookings] = useState<any[]>([]);
  const [bookingsLoading, setBookingsLoading] = useState(false);

  const { user } = useAuth();

  useEffect(() => {
    const fetchProfessionals = async () => {
      try {
        const { data } = await api.get('/professionals');
        setProfessionals(data);
      } catch (err) {
        console.error('Error fetching professionals:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchProfessionals();
  }, []);

  const fetchReceivedBookings = async () => {
    try {
      setBookingsLoading(true);
      const { data } = await api.get('/professionals/provider/bookings');
      setReceivedBookings(data);
    } catch (err) {
      console.error('Error fetching received bookings:', err);
    } finally {
      setBookingsLoading(false);
    }
  };

  const handleUpdateStatus = async (bookingId: string, newStatus: string) => {
    try {
      await api.patch(`/professionals/bookings/${bookingId}/status`, { status: newStatus });
      setMessage({ type: 'success', text: `Reserva actualizada a ${newStatus === 'CONFIRMED' ? 'Confirmada' : 'Cancelada'}` });
      fetchReceivedBookings();
    } catch (err: any) {
      setMessage({ type: 'error', text: 'Error al actualizar reserva: ' + (err.response?.data?.message || 'Servidor no disponible') });
    } finally {
      setTimeout(() => setMessage(null), 3000);
    }
  };

const handleBookClick = async (prof: any) => {
  if (bookingServiceId) return;
  setBookingServiceId(prof.id);
  try {
    const { data } = await api.post('/payments/mercadopago/service-checkout', {
      serviceId: prof.id,
      notes: 'Reserva solicitada desde la plataforma principal.',
    });

    // Servicio gratuito: el backend crea la reserva directo
    if (data.free) {
      setMessage({
        type: 'success',
        text: `¡Reserva enviada a ${prof.provider?.name || 'el profesional'}! Revisa tus notificaciones.`,
      });
      setTimeout(() => setMessage(null), 4000);
      return;
    }

    // Servicio de pago: redirige a Checkout Pro de Mercado Pago
    window.location.href = data.checkoutUrl;
  } catch (err: any) {
    setMessage({
      type: 'error',
      text: 'Error al reservar: ' + (err.response?.data?.message || 'Servidor no disponible'),
    });
    setTimeout(() => setMessage(null), 4000);
  } finally {
    setBookingServiceId(null);
  }
};

  const handleDelete = async (id: string) => {
    if (window.confirm('¿Eliminar este servicio?')) {
      try {
        await api.delete(`/professionals/${id}`);
        setMessage({ type: 'success', text: 'Servicio eliminado' });
        const { data } = await api.get('/professionals');
        setProfessionals(data);
      } catch (err: any) {
        setMessage({ type: 'error', text: err.response?.data?.message || 'Error' });
      }
      setTimeout(() => setMessage(null), 3000);
    }
  };

  const filtered = professionals.filter(p => {
    // Si el usuario es entrenador o dueño, solo ve sus propios servicios
    if (user?.role === 'TRAINER' || user?.role === 'GYM_OWNER') {
      if (p.providerId !== user?.id) return false;
    }

    const s = search.toLowerCase();
    const titleMatch = p.title?.toLowerCase().includes(s);
    const serviceMatch = p.serviceType?.toLowerCase().includes(s);
    const nameMatch = p.provider?.name?.toLowerCase().includes(s);
    const matchesSearch = titleMatch || serviceMatch || nameMatch;

    const matchesCategory = selectedCategory === 'ALL' || 
      (selectedCategory === 'OTROS' && !['PHYSIOTHERAPY', 'NUTRITION_PLAN', 'PERSONAL_TRAINING'].includes(p.serviceType)) ||
      p.serviceType === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  const categories = [
    { id: 'ALL', label: 'Todos' },
    { id: 'PHYSIOTHERAPY', label: 'Fisioterapia' },
    { id: 'NUTRITION_PLAN', label: 'Nutrición' },
    { id: 'PERSONAL_TRAINING', label: 'Personal Training' },
    { id: 'OTROS', label: 'Otros' }
  ];

  const isTrainerOrAdmin = user?.role === 'TRAINER' || user?.role === 'GYM_OWNER' || user?.role === 'ADMIN';

  return (
    <div className="space-y-8 relative">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-6">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <Users className="text-accent" /> Servicios Profesionales
          </h1>
          <p className="text-slate-400 mt-2">Fisioterapeutas, nutricionistas y personal trainers certificados.</p>
        </div>
        {isTrainerOrAdmin && (
          <button 
            onClick={() => setShowCreateModal(true)}
            className="bg-accent hover:bg-accent-dark text-white px-4 py-2 rounded-xl flex items-center gap-2 font-bold transition-all shadow-lg shadow-accent/20"
          >
            <Plus className="w-5 h-5" /> Ofrecer Servicio
          </button>
        )}
      </header>

      {/* Tab Switcher for Trainers/Owners/Admins */}
      {isTrainerOrAdmin && (
        <div className="flex gap-4 border-b border-white/5 pb-2">
          <button
            onClick={() => setActiveViewTab('catalog')}
            className={`pb-2 px-1 font-bold text-sm transition-all border-b-2 ${
              activeViewTab === 'catalog'
                ? 'border-accent text-white'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            🤝 Catálogo de Servicios
          </button>
          <button
            onClick={() => {
              setActiveViewTab('received_bookings');
              fetchReceivedBookings();
            }}
            className={`pb-2 px-1 font-bold text-sm transition-all border-b-2 ${
              activeViewTab === 'received_bookings'
                ? 'border-accent text-white'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            📥 Reservas Recibidas
          </button>
        </div>
      )}

      {message && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className={`border p-4 rounded-xl flex items-center gap-2 ${message.type === 'success' ? 'bg-green-500/10 border-green-500/20 text-green-400' : 'bg-red-500/10 border-red-500/20 text-red-400'}`}>
          <CheckCircle2 className="w-5 h-5" /> {message.text}
        </motion.div>
      )}

      {(showCreateModal || editingProf) && (
        <CreateProfessionalModal
           initialData={editingProf}
           onClose={() => { setShowCreateModal(false); setEditingProf(null); }}
           onCreated={async () => {
             const { data } = await api.get('/professionals');
             setProfessionals(data);
             setMessage({ type: 'success', text: editingProf ? 'Servicio editado' : 'Servicio publicado' });
             setTimeout(() => setMessage(null), 3000);
           }}
        />
      )}

      {activeViewTab === 'received_bookings' ? (
        bookingsLoading ? (
          <div className="flex h-64 items-center justify-center">
            <Loader2 className="text-accent w-12 h-12 animate-spin" />
          </div>
        ) : receivedBookings.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {receivedBookings.map((b) => (
              <motion.div
                key={b.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass-card p-5 border border-white/5 hover:border-accent/30 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="bg-accent/20 text-accent text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider">
                      {({
                        PERSONAL_TRAINING: '💪 Personal Training',
                        NUTRITION_PLAN: '🥗 Nutrición',
                        PHYSIOTHERAPY: '🏥 Fisioterapia',
                        CONSULTATION: '📋 Consulta',
                      } as any)[b.service.serviceType] || b.service.serviceType}
                    </span>
                    <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider border ${
                      b.status === 'CONFIRMED' 
                        ? 'bg-green-500/10 text-green-400 border-green-500/20'
                        : b.status === 'PENDING'
                        ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'
                        : 'bg-red-500/10 text-red-400 border-red-500/20'
                    }`}>
                      {b.status === 'CONFIRMED' ? '✅ Confirmado' : 
                       b.status === 'PENDING' ? '⏳ Pendiente' : '❌ Cancelado'}
                    </span>
                  </div>

                  <h3 className="text-lg font-bold text-white mb-1">{b.service.title}</h3>
                  <p className="text-slate-400 text-xs mb-1">Cliente: {b.user.name}</p>
                  <p className="text-slate-400 text-xs mb-1">Email: {b.user.email}</p>
                  {b.user.phone && <p className="text-slate-400 text-xs mb-1">Teléfono: {b.user.phone}</p>}
                  <p className="text-slate-500 text-xs mt-2 italic">"{b.notes || 'Sin notas del cliente.'}"</p>
                </div>

                <div className="border-t border-white/5 pt-4 mt-6 flex flex-col gap-2">
                  <div className="flex justify-between text-xs text-slate-400 mb-2">
                    <span>Solicitado el:</span>
                    <span>{new Date(b.bookedAt).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                  </div>
                  {b.status === 'PENDING' && (
                    <div className="flex gap-2 w-full mt-2">
                      <button
                        onClick={() => handleUpdateStatus(b.id, 'CONFIRMED')}
                        className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-2 rounded-xl text-xs transition-all shadow-md active:scale-95"
                      >
                        Aceptar Cita
                      </button>
                      <button
                        onClick={() => handleUpdateStatus(b.id, 'CANCELLED')}
                        className="flex-1 bg-red-600/20 hover:bg-red-600/30 text-red-400 border border-red-500/20 font-bold py-2 rounded-xl text-xs transition-all active:scale-95"
                      >
                        Rechazar
                      </button>
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="glass-card p-20 flex flex-col items-center justify-center text-center border-dashed border-white/10">
            <Users className="text-slate-700 w-16 h-16 mb-4" />
            <h2 className="text-white font-bold text-xl mb-2">No tienes reservas recibidas</h2>
            <p className="text-slate-400">Las solicitudes de tus clientes aparecerán aquí.</p>
          </div>
        )
      ) : (
        <>
          <div className="flex flex-col gap-4 max-w-2xl">
            <div className="relative">
              <Search className="absolute top-1/2 left-4 -translate-y-1/2 text-slate-500 w-5 h-5" />
              <input 
                type="text"
                placeholder="Buscar por servicio, profesional o categoría..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="bg-white/5 border-white/10 focus:border-accent w-full py-4 pr-4 pl-12 border rounded-2xl text-white outline-none transition-all"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              {categories.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-4 py-2 rounded-xl text-sm font-bold transition-all border ${
                    selectedCategory === cat.id 
                      ? 'bg-accent/20 border-accent text-accent' 
                      : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <div className="flex h-64 items-center justify-center">
              <Loader2 className="text-accent w-12 h-12 animate-spin" />
            </div>
          ) : filtered.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filtered.map(p => (
                <ProfessionalCard 
                  key={p.id} 
                  professional={p} 
                  onBook={handleBookClick}
                  isBooking={bookingServiceId === p.id}
                  isOwner={user?.role === 'ADMIN' || p.providerId === user?.id}
                  onEdit={setEditingProf}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          ) : (
            <div className="glass-card p-20 flex flex-col items-center justify-center text-center border-dashed border-white/10">
              <Users className="text-slate-700 w-16 h-16 mb-4" />
              <h2 className="text-white font-bold text-xl mb-2">Aún no hay profesionales registrados</h2>
              <p className="text-slate-400">Sé el primero en ofrecer un servicio.</p>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default ProfessionalsPage;
