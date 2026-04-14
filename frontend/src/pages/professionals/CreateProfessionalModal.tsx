import React, { useState } from 'react';
import api from '../../api/api-client';
import { X, Loader2, User, Plus } from 'lucide-react';
import { motion } from 'framer-motion';

interface CreateProfessionalModalProps {
  onClose: () => void;
  onCreated: () => void;
  initialData?: any;
}

const CreateProfessionalModal: React.FC<CreateProfessionalModalProps> = ({ onClose, onCreated, initialData }) => {
  const [formData, setFormData] = useState({
    title: initialData?.title || '',
    description: initialData?.description || '',
    price: initialData?.price || 50,
    serviceType: initialData?.serviceType || 'PERSONAL_TRAINING',
    durationMin: initialData?.durationMin || 60,
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const payload = {
        title: formData.title,
        description: formData.description,
        price: Number(formData.price),
        durationMin: Number(formData.durationMin),
        serviceType: formData.serviceType,
      };

      if (initialData) {
        await api.patch(`/professionals/${initialData.id}`, payload);
      } else {
        await api.post('/professionals', payload);
      }
      onCreated();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al guardar el servicio');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="glass-card w-full max-w-lg bg-slate-900 border-white/10 p-8 relative max-h-[90vh] overflow-y-auto"
      >
        <button onClick={onClose} className="absolute top-6 right-6 text-slate-500 hover:text-white transition-colors">
          <X />
        </button>

        <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
          <User className="text-accent" /> {initialData ? 'Editar Servicio' : 'Ofrecer Nuevo Servicio'}
        </h2>

        {error && <div className="bg-red-500/10 border-red-500/20 p-4 border rounded-xl text-red-400 text-sm mb-6">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-slate-400 text-xs font-bold uppercase tracking-wider">Título del Servicio</label>
            <input 
              required
              value={formData.title}
              onChange={e => setFormData({ ...formData, title: e.target.value })}
              className="bg-white/5 border-white/10 focus:border-accent w-full py-3 px-4 border rounded-xl text-white outline-none"
              placeholder="Ej: Yoga personalizado"
            />
          </div>

          <div className="space-y-2">
            <label className="text-slate-400 text-xs font-bold uppercase tracking-wider">Tipo de Servicio</label>
            <select 
              required
              value={formData.serviceType}
              onChange={e => setFormData({ ...formData, serviceType: e.target.value })}
              className="bg-white/5 border-white/10 focus:border-accent w-full py-3 px-4 border rounded-xl text-white outline-none"
            >
              <option value="PERSONAL_TRAINING" className="bg-slate-900">Entrenamiento Personal</option>
              <option value="NUTRITION_PLAN" className="bg-slate-900">Plan Nutricional</option>
              <option value="PHYSIOTHERAPY" className="bg-slate-900">Fisioterapia</option>
              <option value="CONSULTATION" className="bg-slate-900">Consulta en línea</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-slate-400 text-xs font-bold uppercase tracking-wider">Descripción</label>
            <textarea 
              value={formData.description}
              onChange={e => setFormData({ ...formData, description: e.target.value })}
              className="bg-white/5 border-white/10 focus:border-accent w-full py-3 px-4 border rounded-xl text-white outline-none min-h-[80px]"
              placeholder="Describe en qué consiste..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-slate-400 text-xs font-bold uppercase tracking-wider">Duración (min)</label>
              <input 
                type="number"
                value={formData.durationMin}
                onChange={e => setFormData({ ...formData, durationMin: Number(e.target.value) })}
                className="bg-white/5 border-white/10 w-full py-3 px-4 border rounded-xl text-white outline-none"
              />
            </div>
            <div className="space-y-2">
              <label className="text-slate-400 text-xs font-bold uppercase tracking-wider">Precio ($)</label>
              <input 
                type="number"
                value={formData.price}
                onChange={e => setFormData({ ...formData, price: Number(e.target.value) })}
                className="bg-white/5 border-white/10 w-full py-3 px-4 border rounded-xl text-white outline-none"
              />
            </div>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="bg-accent hover:bg-accent-dark text-white w-full py-4 mt-6 flex items-center justify-center gap-2 relative overflow-hidden active:scale-[0.98] rounded-xl font-bold transition-all"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <> <Plus className="w-5 h-5" /> <span>{initialData ? 'Guardar Cambios' : 'Publicar Servicio'}</span> </>}
          </button>
        </form>
      </motion.div>
    </div>
  );
};

export default CreateProfessionalModal;
