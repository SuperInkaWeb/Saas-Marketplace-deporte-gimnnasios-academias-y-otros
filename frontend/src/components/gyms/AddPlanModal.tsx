import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CreditCard, Loader2 } from 'lucide-react';
import api from '../../api/api-client';
import type { ApiError } from '../../types/api';

interface AddPlanModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  gymId: string;
  initialData?: any;
}

export const AddPlanModal: React.FC<AddPlanModalProps> = ({ isOpen, onClose, onSuccess, gymId, initialData }) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: initialData?.name || '',
    description: initialData?.description || '',
    price: initialData?.price || '',
    durationDays: initialData?.durationDays || '30',
    maxClasses: initialData?.maxClasses || '',
    includesMarketplace: initialData?.includesMarketplace || false,
  });

  useEffect(() => {
    if (isOpen) {
      setFormData({
        name: initialData?.name || '',
        description: initialData?.description || '',
        price: initialData?.price || '',
        durationDays: initialData?.durationDays || '30',
        maxClasses: initialData?.maxClasses || '',
        includesMarketplace: initialData?.includesMarketplace || false,
      });
    }
  }, [isOpen, initialData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!gymId) return;
    
    setLoading(true);
    try {
      const payload = {
        name: formData.name,
        description: formData.description,
        price: Number(formData.price),
        durationDays: Number(formData.durationDays),
        maxClasses: formData.maxClasses ? Number(formData.maxClasses) : undefined,
        includesMarketplace: formData.includesMarketplace
      };

      if (initialData) {
        await api.patch(`/memberships/plans/${initialData.id}`, payload);
      } else {
        await api.post(`/memberships/plans/${gymId}`, payload);
      }
      onSuccess();
      onClose();
    } catch (err) {
      alert((err as ApiError).response?.data?.message || 'Error al guardar el plan de membresía');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="bg-slate-900 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl border border-white/10"
          >
            <div className="p-6 border-b border-white/10 flex justify-between items-center bg-slate-800/50">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <CreditCard className="text-primary-light w-6 h-6" /> {initialData ? 'Editar Plan de Membresía' : 'Nuevo Plan de Membresía'}
              </h2>
              <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-slate-300 text-sm font-medium mb-1">Nombre de la Membresía</label>
                  <input 
                    type="text" required
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    placeholder="Ej. Plan Trimestral VIP"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:border-primary-light outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-slate-300 text-sm font-medium mb-1">Precio ($)</label>
                    <input 
                      type="number" required min="0" step="0.01"
                      value={formData.price}
                      onChange={(e) => setFormData({...formData, price: e.target.value})}
                      placeholder="Ej. 150.00"
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:border-primary-light outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 text-sm font-medium mb-1">Duración (Días)</label>
                    <select
                      value={formData.durationDays}
                      onChange={(e) => setFormData({...formData, durationDays: e.target.value})}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:border-primary-light outline-none"
                    >
                      <option value="7">7 Días (Semanal)</option>
                      <option value="15">15 Días (Quincenal)</option>
                      <option value="30">30 Días (Mensual)</option>
                      <option value="90">90 Días (Trimestral)</option>
                      <option value="180">180 Días (Semestral)</option>
                      <option value="365">365 Días (Anual)</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-slate-300 text-sm font-medium mb-1">Cupos de Clases (Opcional)</label>
                    <input 
                      type="number" min="1"
                      value={formData.maxClasses}
                      onChange={(e) => setFormData({...formData, maxClasses: e.target.value})}
                      placeholder="Ej. 12 (ilimitado si está vacío)"
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:border-primary-light outline-none"
                    />
                  </div>

                  <div className="flex items-center pt-8 pl-2">
                    <label className="flex items-center gap-2.5 cursor-pointer text-slate-300 text-sm font-medium">
                      <input 
                        type="checkbox"
                        checked={formData.includesMarketplace}
                        onChange={(e) => setFormData({...formData, includesMarketplace: e.target.checked})}
                        className="rounded bg-slate-800 border-slate-700 text-primary focus:ring-primary w-4 h-4"
                      />
                      <span>Incluye Acceso a Marketplace</span>
                    </label>
                  </div>
                </div>

                <div>
                  <label className="block text-slate-300 text-sm font-medium mb-1">Descripción</label>
                  <textarea 
                    rows={3}
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    placeholder="Describe los beneficios que ofrece este plan de membresía..."
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:border-primary-light outline-none resize-none"
                  />
                </div>

                <div className="pt-4 border-t border-slate-700/50 mt-4 flex gap-3">
                  <button type="button" onClick={onClose} className="flex-1 py-3 px-4 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-medium transition-colors">
                    Cancelar
                  </button>
                  <button type="submit" disabled={loading} className="flex-1 py-3 px-4 btn-primary rounded-xl flex items-center justify-center gap-2 font-bold text-white shadow-lg shadow-primary/20">
                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (initialData ? 'Guardar Cambios' : 'Añadir Membresía')}
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
