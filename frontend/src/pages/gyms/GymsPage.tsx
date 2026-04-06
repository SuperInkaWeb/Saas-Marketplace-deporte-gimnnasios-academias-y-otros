import React, { useState, useEffect } from 'react';
import api from '../../api/api-client';
import { useAuth } from '../../context/auth-context';
import { 
  Search, 
  MapPin, 
  Star, 
  Plus, 
  Filter, 
  Loader2,
  Dumbbell,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { motion } from 'framer-motion';
import CreateGymModal from './CreateGymModal';

const GymCard: React.FC<{ gym: any }> = ({ gym }) => (
  <motion.div 
    whileHover={{ y: -5 }}
    className="glass-card overflow-hidden group border-white/5 hover:border-primary/30 transition-all"
  >
    <div className="h-40 bg-slate-800 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-t from-background-darker/80 to-transparent"></div>
      <div className="absolute bottom-4 left-4">
        <span className="bg-primary/80 text-white text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wider">
          {gym.status || 'Activo'}
        </span>
      </div>
    </div>
    
    <div className="p-6">
      <h3 className="text-xl font-bold text-white group-hover:text-primary-light transition-colors">{gym.name}</h3>
      <p className="text-slate-400 text-sm mt-2 line-clamp-2">{gym.description || 'Sin descripción disponible.'}</p>
      
      <div className="mt-6 flex flex-col gap-2">
        <div className="flex items-center gap-2 text-slate-400 text-xs text-secondary-light">
          <MapPin className="w-4 h-4" />
          <span>{gym.address || 'Ubicación no especificada'}</span>
        </div>
      </div>

      <div className="mt-6 pt-6 border-t border-white/5 flex items-center justify-between">
        <div className="flex items-center gap-1">
          <Star className="text-yellow-400 fill-yellow-400 w-4 h-4" />
          <span className="text-white font-bold text-sm">NUEVO</span>
        </div>
        <button className="text-primary-light font-bold text-sm hover:underline">
          Ver Detalles
        </button>
      </div>
    </div>
  </motion.div>
);

const GymsPage: React.FC = () => {
  const [gyms, setGyms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const { user } = useAuth();

  const fetchGyms = async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/gyms');
      setGyms(data);
    } catch (err) {
      console.error('Error fetching gyms:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGyms();
  }, []);

  const filteredGyms = gyms.filter(g => 
    g.name.toLowerCase().includes(search.toLowerCase()) || 
    g.address?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">Gimnasios</h1>
          <p className="text-slate-400 mt-1">Encuentra el lugar perfecto para tu próximo entrenamiento.</p>
        </div>
        {(user?.role === 'GYM_OWNER' || user?.role === 'ADMIN') && (
          <button 
            onClick={() => setShowCreateModal(true)}
            className="btn-primary flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            <span>Registrar Mi Gimnasio</span>
          </button>
        )}
      </header>

      {showCreateModal && (
        <CreateGymModal 
          onClose={() => setShowCreateModal(false)} 
          onCreated={() => {
            fetchGyms();
            setMessage({ type: 'success', text: '¡Gimnasio registrado exitosamente!' });
            setTimeout(() => setMessage(null), 3000);
          }} 
        />
      )}

      {message && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`p-4 rounded-xl flex items-center gap-3 border ${
            message.type === 'success' ? 'bg-green-500/10 border-green-500/20 text-green-400' : 'bg-red-500/10 border-red-500/20 text-red-400'
          }`}
        >
          {message.type === 'success' ? <CheckCircle2 /> : <AlertCircle />}
          <span className="font-medium">{message.text}</span>
        </motion.div>
      )}

      {/* Search & Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-grow">
          <Search className="absolute top-1/2 left-4 -translate-y-1/2 text-slate-500 w-5 h-5" />
          <input 
            type="text"
            placeholder="Buscar por nombre o dirección..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-white/5 border-white/10 focus:border-primary-light w-full py-4 pr-4 pl-12 border rounded-2xl text-white outline-none transition-all"
          />
        </div>
        <button className="glass-card px-6 py-4 flex items-center gap-2 hover:bg-white/10 transition-all font-medium">
          <Filter className="w-5 h-5" />
          <span>Filtros</span>
        </button>
      </div>

      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="text-primary w-12 h-12 animate-spin" />
        </div>
      ) : filteredGyms.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredGyms.map(gym => (
            <GymCard key={gym.id} gym={gym} />
          ))}
        </div>
      ) : (
        <div className="glass-card p-20 flex flex-col items-center justify-center text-center">
          <div className="bg-slate-800 p-6 rounded-full mb-6">
            <Dumbbell className="text-slate-500 w-12 h-12" />
          </div>
          <h2 className="text-xl font-bold text-white">No se encontraron gimnasios</h2>
          <p className="text-slate-400 mt-2">Prueba ajustando tu búsqueda o registra el primero.</p>
        </div>
      )}
    </div>
  );
};

export default GymsPage;
