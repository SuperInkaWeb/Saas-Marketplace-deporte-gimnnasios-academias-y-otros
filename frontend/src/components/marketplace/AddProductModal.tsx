import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Package, Loader2, Link } from 'lucide-react';
import api from '../../api/api-client';

interface AddProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialData?: any;
}

export const AddProductModal: React.FC<AddProductModalProps> = ({ isOpen, onClose, onSuccess, initialData }) => {
  const [loading, setLoading] = useState(false);
  const [gyms, setGyms] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    gymId: initialData?.gymId || '',
    name: initialData?.name || '',
    description: initialData?.description || '',
    price: initialData?.price || '',
    stock: initialData?.stock || '',
    category: initialData?.category || 'Suplementos',
    imageUrl: initialData?.imageUrl || '',
  });

  useEffect(() => {
    if (isOpen) {
      const fetchGyms = async () => {
        try {
          const { data } = await api.get('/gyms'); // Backend checks ownership/admin usually or returns all user related gyms
          setGyms(data);
          if (data.length > 0 && !initialData) {
            setFormData(prev => ({ ...prev, gymId: data[0].id }));
          }
        } catch (err) {
          console.error("Error fetching gyms", err);
        }
      };
      fetchGyms();
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.gymId) {
      alert("Debes seleccionar un gimnasio.");
      return;
    }
    setLoading(true);
    try {
      const payload = {
        name: formData.name,
        description: formData.description,
        price: Number(formData.price),
        stock: Number(formData.stock),
        category: formData.category,
        imageUrl: formData.imageUrl
      };

      if (initialData) {
        await api.patch(`/marketplace/products/${initialData.id}`, payload);
      } else {
        await api.post(`/marketplace/products/${formData.gymId}`, payload);
      }
      onSuccess();
      onClose();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error al crear producto');
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
                <Package className="text-secondary-light w-6 h-6" /> {initialData ? 'Editar Producto' : 'Nuevo Producto'}
              </h2>
              <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6">
              {gyms.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-slate-400">No administras ningún gimnasio aún.</p>
                  <p className="text-sm mt-2 text-slate-500">Crea un gimnasio primero para poder añadir productos.</p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  
                  {gyms.length > 1 && (
                    <div>
                      <label className="block text-slate-300 text-sm font-medium mb-1">Gimnasio Destino</label>
                      <select 
                        required
                        value={formData.gymId}
                        onChange={(e) => setFormData({...formData, gymId: e.target.value})}
                        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:border-secondary-light outline-none"
                      >
                        {gyms.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                      </select>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2">
                      <label className="block text-slate-300 text-sm font-medium mb-1">Nombre del Producto</label>
                      <input 
                        type="text" required
                        value={formData.name}
                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                        placeholder="Ej. Whey Protein 5lbs"
                        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:border-secondary-light outline-none"
                      />
                    </div>

                    <div className="col-span-2 sm:col-span-1">
                      <label className="block text-slate-300 text-sm font-medium mb-1">Precio ($)</label>
                      <input 
                        type="number" required min="0" step="0.01"
                        value={formData.price}
                        onChange={(e) => setFormData({...formData, price: e.target.value})}
                        placeholder="Ej. 120.00"
                        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:border-secondary-light outline-none"
                      />
                    </div>

                    <div className="col-span-2 sm:col-span-1">
                      <label className="block text-slate-300 text-sm font-medium mb-1">Stock Disponible</label>
                      <input 
                        type="number" required min="1"
                        value={formData.stock}
                        onChange={(e) => setFormData({...formData, stock: e.target.value})}
                        placeholder="Ej. 50"
                        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:border-secondary-light outline-none"
                      />
                    </div>

                    <div className="col-span-2 sm:col-span-1">
                      <label className="block text-slate-300 text-sm font-medium mb-1">Categoría</label>
                      <select 
                        value={formData.category}
                        onChange={(e) => setFormData({...formData, category: e.target.value})}
                        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:border-secondary-light outline-none"
                      >
                        <option value="Suplementos">Suplementos</option>
                        <option value="Equipamiento">Equipamiento</option>
                        <option value="Ropa">Ropa Deportiva</option>
                        <option value="Accesorios">Accesorios</option>
                      </select>
                    </div>

                    <div className="col-span-2 sm:col-span-1">
                      <label className="block text-slate-300 text-sm font-medium mb-1">URL de Imagen (Opcional)</label>
                      <div className="relative">
                        <Link className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4" />
                        <input 
                          type="url"
                          value={formData.imageUrl}
                          onChange={(e) => setFormData({...formData, imageUrl: e.target.value})}
                          placeholder="https://..."
                          className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-9 pr-4 py-3 text-white text-sm focus:border-secondary-light outline-none"
                        />
                      </div>
                    </div>

                    <div className="col-span-2">
                      <label className="block text-slate-300 text-sm font-medium mb-1">Descripción</label>
                      <textarea 
                        rows={3}
                        value={formData.description}
                        onChange={(e) => setFormData({...formData, description: e.target.value})}
                        placeholder="Detalles del producto..."
                        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:border-secondary-light outline-none resize-none"
                      />
                    </div>
                  </div>

                  <div className="pt-4 border-t border-slate-700/50 mt-4 flex gap-3">
                    <button type="button" onClick={onClose} className="flex-1 py-3 px-4 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-medium transition-colors">
                      Cancelar
                    </button>
                    <button type="submit" disabled={loading} className="flex-1 py-3 px-4 btn-secondary rounded-xl flex items-center justify-center gap-2">
                      {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (initialData ? 'Guardar Cambios' : 'Añadir Producto')}
                    </button>
                  </div>

                </form>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
