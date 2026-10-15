/*import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { X, AlertTriangle, Loader2, Ban } from 'lucide-react';
import api from '../../api/api-client';

interface CancelEventModalProps {
  event: any;
  onClose: () => void;
  onCancelled: () => void;
}

const MIN_LENGTH = 10;
const MAX_LENGTH = 1000;

const CancelEventModal: React.FC<CancelEventModalProps> = ({ event, onClose, onCancelled }) => {
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim().length < MIN_LENGTH) {
      setError(`Escribe un comunicado de al menos ${MIN_LENGTH} caracteres.`);
      return;
    }
    setLoading(true);
    setError('');
    try {
      await api.post(`/events/${event.id}/cancel`, { message: message.trim() });
      onCancelled();
      onClose();
    } catch (err: any) {
      const msg = err.response?.data?.message;
      setError(Array.isArray(msg) ? msg.join('. ') : msg || 'No se pudo cancelar el evento');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="glass-card w-full max-w-lg bg-slate-900 border-white/10 p-6 relative"
      >
        <button
          onClick={onClose}
          disabled={loading}
          className="absolute top-5 right-5 text-slate-500 hover:text-white transition-colors disabled:opacity-30"
        >
          <X />
        </button>

        <h2 className="text-xl font-bold text-white mb-1 flex items-center gap-2">
          <Ban className="text-red-400 w-5 h-5" /> Cancelar evento
        </h2>
        <p className="text-slate-400 text-sm mb-4 truncate">{event.title}</p>

        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 mb-4 flex gap-2 text-red-300 text-xs">
          <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <span>
            Esta acción no se puede deshacer. El comunicado se mostrará públicamente en la tarjeta del evento.
          </span>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 p-3 rounded-xl text-red-400 text-xs mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-slate-400 text-xs font-bold uppercase tracking-wider">
              Comunicado para los interesados
            </label>
            <textarea
              required
              value={message}
              onChange={(e) => setMessage(e.target.value.slice(0, MAX_LENGTH))}
              className="bg-white/5 border-white/10 focus:border-primary-light w-full py-3 px-4 border rounded-xl text-white outline-none min-h-[120px]"
              placeholder="Ej: Lamentamos informar que el evento se cancela por motivos de fuerza mayor. Pronto anunciaremos una nueva fecha."
            />
            <div className="text-right text-[11px] text-slate-500">
              {message.length}/{MAX_LENGTH}
            </div>
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 bg-slate-800 text-slate-300 py-3 rounded-xl font-bold border border-white/5 hover:bg-slate-700 transition-all"
            >
              Volver
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-red-500/20 hover:bg-red-500/30 text-red-300 py-3 rounded-xl font-bold border border-red-500/30 transition-all flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Ban className="w-4 h-4" /> Cancelar evento</>}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

export default CancelEventModal;*/