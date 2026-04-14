import React, { useState, useEffect } from 'react';
import api from '../../api/api-client';
import { X, Loader2, Calendar, MapPin, Plus, Video } from 'lucide-react';

import { motion } from 'framer-motion';

interface CreateClassModalProps {
  onClose: () => void;
  onCreated: () => void;
  initialData?: any;
}

const CreateClassModal: React.FC<CreateClassModalProps> = ({ onClose, onCreated, initialData }) => {
  const [gyms, setGyms] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    title: initialData?.title || '',
    description: initialData?.description || '',
    capacity: initialData?.capacity || 20,
    price: initialData?.price || 0,
    scheduledAt: initialData?.scheduledAt ? new Date(initialData.scheduledAt).toISOString().slice(0, 16) : '',
    durationMin: initialData?.durationMin || 60,
    classType: initialData?.classType || 'IN_PERSON',
    location: initialData?.location || '',
    gymId: initialData?.gymId || '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchMyGyms = async () => {
      try {
        const { data } = await api.get('/gyms'); // El dueño verá sus gimnasios
        setGyms(data);
        if (data.length > 0) setFormData(prev => ({ ...prev, gymId: data[0].id }));
      } catch (err) {
        console.error(err);
      }
    };
    fetchMyGyms();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const { gymId, ...data } = formData;
      const payload = {
        ...data,
        price: Number(formData.price),
        capacity: Number(formData.capacity),
        durationMin: Number(formData.durationMin),
        scheduledAt: new Date(formData.scheduledAt).toISOString(),
      };
      
      if (initialData) {
        await api.patch(`/classes/${initialData.id}`, payload);
      } else {
        await api.post(`/classes/${gymId}`, payload);
      }

      onCreated();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al crear la clase');
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
          <Calendar className="text-primary-light" /> {initialData ? 'Editar Clase' : 'Nueva Clase'}
        </h2>

        {error && <div className="bg-red-500/10 border-red-500/20 p-4 border rounded-xl text-red-400 text-sm mb-6">{error}</div>}

        <form onSubmit={handleSubmit} className="grid md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-slate-400 text-xs font-bold uppercase tracking-wider">Gimnasio</label>
              <select 
                required
                value={formData.gymId}
                onChange={e => setFormData({ ...formData, gymId: e.target.value })}
                className="bg-white/5 border-white/10 focus:border-primary-light w-full py-3 px-4 border rounded-xl text-white outline-none"
              >
                <option value="" disabled className="bg-slate-900 text-slate-400">Selecciona un gimnasio</option>
                {gyms.map(g => <option key={g.id} value={g.id} className="bg-slate-900 text-white">{g.name}</option>)}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-slate-400 text-xs font-bold uppercase tracking-wider">Título de la Clase</label>
              <input 
                required
                value={formData.title}
                onChange={e => setFormData({ ...formData, title: e.target.value })}
                className="bg-white/5 border-white/10 focus:border-primary-light w-full py-3 px-4 border rounded-xl text-white outline-none"
                placeholder="Ej: Yoga para principiantes"
              />
            </div>

            <div className="space-y-2">
              <label className="text-slate-400 text-xs font-bold uppercase tracking-wider">Descripción</label>
              <textarea 
                value={formData.description}
                onChange={e => setFormData({ ...formData, description: e.target.value })}
                className="bg-white/5 border-white/10 focus:border-primary-light w-full py-3 px-4 border rounded-xl text-white outline-none min-h-[100px]"
                placeholder="Describe qué harán en la clase..."
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-slate-400 text-xs font-bold uppercase tracking-wider">Capacidad</label>
                <input 
                  type="number"
                  value={formData.capacity}
                  onChange={e => setFormData({ ...formData, capacity: Number(e.target.value) })}
                  className="bg-white/5 border-white/10 w-full py-3 px-4 border rounded-xl text-white outline-none"
                />
              </div>
              <div className="space-y-2">
                <label className="text-slate-400 text-xs font-bold uppercase tracking-wider">Duración (min)</label>
                <input 
                  type="number"
                  value={formData.durationMin}
                  onChange={e => setFormData({ ...formData, durationMin: Number(e.target.value) })}
                  className="bg-white/5 border-white/10 w-full py-3 px-4 border rounded-xl text-white outline-none"
                />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-slate-400 text-xs font-bold uppercase tracking-wider">Tipo de Clase</label>
              <div className="grid grid-cols-2 gap-2">
                <button 
                  type="button"
                  onClick={() => setFormData({ ...formData, classType: 'IN_PERSON' })}
                  className={`py-3 px-4 rounded-xl border transition-all text-sm font-bold flex items-center justify-center gap-2 ${
                    formData.classType === 'IN_PERSON' ? 'bg-primary/20 border-primary-light text-primary-light' : 'bg-white/5 border-white/10 text-slate-400'
                  }`}
                >
                  <MapPin className="w-4 h-4" /> Presencial
                </button>
                <button 
                  type="button"
                  onClick={() => setFormData({ ...formData, classType: 'ONLINE' })}
                  className={`py-3 px-4 rounded-xl border transition-all text-sm font-bold flex items-center justify-center gap-2 ${
                    formData.classType === 'ONLINE' ? 'bg-secondary/20 border-secondary-light text-secondary-light' : 'bg-white/5 border-white/10 text-slate-400'
                  }`}
                >
                  <Video className="w-4 h-4" /> Online
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-slate-400 text-xs font-bold uppercase tracking-wider">Ubicación / Link</label>
              <input 
                value={formData.location}
                onChange={e => setFormData({ ...formData, location: e.target.value })}
                className="bg-white/5 border-white/10 focus:border-primary-light w-full py-3 px-4 border rounded-xl text-white outline-none"
                placeholder={formData.classType === 'ONLINE' ? 'Enlace de Zoom/Meets' : 'Sala 1, Piso 2'}
              />
            </div>

            <div className="space-y-2">
              <label className="text-slate-400 text-xs font-bold uppercase tracking-wider">Fecha y Hora</label>
              <input 
                required
                type="datetime-local"
                value={formData.scheduledAt}
                onChange={e => setFormData({ ...formData, scheduledAt: e.target.value })}
                className="bg-white/5 border-white/10 focus:border-primary-light w-full py-3 px-4 border rounded-xl text-white outline-none"
              />
            </div>

            <div className="space-y-2">
              <label className="text-slate-400 text-xs font-bold uppercase tracking-wider">Precio ($)</label>
              <input 
                type="number"
                value={formData.price}
                onChange={e => setFormData({ ...formData, price: Number(e.target.value) })}
                className="bg-white/5 border-white/10 focus:border-primary-light w-full py-3 px-4 border rounded-xl text-white outline-none"
              />
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="btn-primary w-full py-4 mt-6 flex items-center justify-center gap-2 relative overflow-hidden active:scale-[0.98]"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <> <Plus className="w-5 h-5" /> <span>{initialData ? 'Guardar Cambios' : 'Crear Clase'}</span> </>}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

export default CreateClassModal;
