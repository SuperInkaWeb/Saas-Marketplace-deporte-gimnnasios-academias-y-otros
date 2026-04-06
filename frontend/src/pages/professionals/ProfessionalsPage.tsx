import React, { useState, useEffect } from 'react';
import api from '../../api/api-client';
import { 
  Users, 
  Search,
  Loader2,
  CheckCircle2,
  CalendarHeart,
  Star
} from 'lucide-react';
import { motion } from 'framer-motion';

const ProfessionalCard: React.FC<{ professional: any; onBook: (p: any) => void }> = ({ professional, onBook }) => (
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
      {professional.serviceType.replace('_', ' ')}
    </span>

    <h3 className="text-lg font-bold text-white mb-1 line-clamp-1">{professional.title}</h3>
    <p className="text-slate-400 text-xs mb-1">Por {professional.provider?.name || 'Profesional'}</p>
    
    <div className="text-slate-500 text-xs mb-4 line-clamp-2 min-h-[32px]">
      {professional.description || 'Consulta personalizada y entrenamiento al más alto nivel.'}
    </div>
    
    <div className="flex items-center justify-between w-full mt-auto pt-4 border-t border-white/5">
      <span className="text-xl font-extrabold text-white">${Number(professional.price).toFixed(2)}<span className="text-xs text-slate-500 font-normal"> / {professional.durationMin}m</span></span>
      <button 
        onClick={() => onBook(professional)}
        className="bg-accent hover:bg-accent-dark px-4 py-2 rounded-xl transition-all shadow-lg shadow-accent/20 active:scale-95 text-white text-sm font-bold flex items-center gap-2"
      >
        <CalendarHeart className="w-4 h-4" /> Reservar
      </button>
    </div>
  </motion.div>
);

const ProfessionalsPage: React.FC = () => {
  const [professionals, setProfessionals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [message, setMessage] = useState<string | null>(null);

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

  const handleBook = (prof: any) => {
    setMessage(`¡Reserva solicitada con ${prof.provider?.name || 'el profesional'} por $${prof.price}!`);
    setTimeout(() => setMessage(null), 3000);
  };

  const filtered = professionals.filter(p => p.title.toLowerCase().includes(search.toLowerCase()) || p.serviceType.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-8 relative">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-6">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <Users className="text-accent" /> Servicios y Entrenadores
          </h1>
          <p className="text-slate-400 mt-2">Contrata a los mejores nutricionistas, fisioterapeutas y personal trainers.</p>
        </div>
      </header>

      <div className="relative max-w-xl">
        <Search className="absolute top-1/2 left-4 -translate-y-1/2 text-slate-500 w-5 h-5" />
        <input 
          type="text"
          placeholder="Buscar por servicio (ej: NUTRITION_PLAN)..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="bg-white/5 border-white/10 focus:border-accent w-full py-4 pr-4 pl-12 border rounded-2xl text-white outline-none transition-all"
        />
      </div>

      {message && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-green-500/10 border border-green-500/20 p-4 rounded-xl text-green-400 flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5" /> {message}
        </motion.div>
      )}

      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="text-accent w-12 h-12 animate-spin" />
        </div>
      ) : filtered.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filtered.map(p => (
            <ProfessionalCard key={p.id} professional={p} onBook={handleBook} />
          ))}
        </div>
      ) : (
        <div className="glass-card p-20 flex flex-col items-center justify-center text-center border-dashed border-white/10">
          <Users className="text-slate-700 w-16 h-16 mb-4" />
          <h2 className="text-white font-bold text-xl mb-2">Aún no hay profesionales registrados</h2>
          <p className="text-slate-400">Sé el primero en ofrecer un servicio.</p>
        </div>
      )}
    </div>
  );
};

export default ProfessionalsPage;
