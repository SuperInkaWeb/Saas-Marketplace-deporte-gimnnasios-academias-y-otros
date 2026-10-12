import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/auth-context';
import { Loader2, ShieldCheck, User, Phone, FileText, Sparkles, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

interface CompleteProfileModalProps {
  isOpen: boolean;
  onSuccess?: () => void;
  onClose?: () => void;
}

// CAMBIO: helper para detectar emails
const looksLikeEmail = (v?: string) => !!v && /\S+@\S+\.\S+/.test(v.trim());

export const CompleteProfileModal: React.FC<CompleteProfileModalProps> = ({ isOpen, onSuccess, onClose }) => {
  const { user, updateUserProfile } = useAuth();
  const [formData, setFormData] = useState({
    name: looksLikeEmail(user?.name) ? '' : user?.name || '', // CAMBIO
    phone: user?.phone || '',
    dni: user?.dni || '',
    role: user?.role || 'USER',
  });

  const [loading, setLoading] = useState(false);

  // CAMBIO: si el usuario carga después, rellena solo si es un nombre real
  useEffect(() => {
    if (user?.name && !looksLikeEmail(user.name)) {
      setFormData((f) => (f.name ? f : { ...f, name: user.name }));
    }
  }, [user?.name]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // CAMBIO: validación con nombre limpio
    const cleanName = formData.name.trim();
    if (!cleanName) {
      toast.error(' Por favor, ingresa tu nombre completo.');
      return;
    }
    if (looksLikeEmail(cleanName)) {
      toast.error(' El nombre no puede ser un correo electrónico.');
      return;
    }
    if (!formData.phone.trim() || formData.phone.length < 7) {
      toast.error(' Por favor, ingresa un número telefónico válido.');
      return;
    }
    if (!formData.dni.trim() || formData.dni.length < 5) {
      toast.error(' Por favor, ingresa un DNI / Cédula válido.');
      return;
    }

    setLoading(true);
    try {
      await updateUserProfile({ ...formData, name: cleanName }); // CAMBIO
      toast.success('🎉 ¡Perfil completado con éxito! Bienvenido a Hercix.');
      if (onSuccess) onSuccess();
    } catch (err: any) {
      // CAMBIO (mejora A): mostrar el mensaje real del backend
      const msg = err?.response?.data?.message;
      toast.error(`❌ ${Array.isArray(msg) ? msg[0] : msg || 'Error al actualizar los datos de perfil.'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center p-4">
          {/* Backdrop with extreme blur and premium styling */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-slate-950/85 backdrop-blur-md"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', duration: 0.5 }}
            className="relative w-full max-w-lg overflow-hidden rounded-3xl border border-white/10 bg-slate-900/90 p-8 shadow-2xl marker-glow"
          >
            {/* Ambient background glow */}
            <div className="absolute -left-20 -top-20 h-40 w-40 rounded-full bg-primary/20 blur-3xl animate-pulse" />
            <div className="absolute -right-20 -bottom-20 h-40 w-40 rounded-full bg-secondary/20 blur-3xl animate-pulse" />

            {onClose && (
              <button 
                type="button" 
                onClick={onClose} 
                className="absolute top-6 right-6 text-slate-400 hover:text-white p-1.5 rounded-xl hover:bg-white/5 transition-all z-10"
              >
                <X className="w-5 h-5" />
              </button>
            )}

            <div className="relative text-center">
              {/* Premium Icon Header */}
              <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-tr from-primary to-secondary text-white shadow-lg shadow-primary/20">
                <Sparkles className="h-8 w-8 animate-pulse" />
              </div>

              <h2 className="text-2xl font-extrabold tracking-tight text-white">¡Queremos conocerte mejor!</h2>
              <p className="mt-2 text-sm text-slate-400">
                Para garantizar la seguridad de tus reservas y compras en Hercix, completa tus datos obligatorios.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="relative mt-8 space-y-5">
              {/* Nombre input */}
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-primary-light" /> Nombre Completo
                </label>
                <input
                  required
                  type="text"
                  autoComplete="name"  
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ej. Juan Pérez"
                  className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none focus:border-primary transition-all placeholder:text-slate-600"
                />
              </div>

              {/* DNI / Documento input */}
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-primary-light" /> DNI / Cédula de Identidad
                </label>
                <input
                  required
                  type="text"
                  value={formData.dni}
                  onChange={(e) => setFormData({ ...formData, dni: e.target.value })}
                  placeholder="Ej. 102938475"
                  className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none focus:border-primary transition-all placeholder:text-slate-600"
                />
              </div>

              {/* Teléfono input */}
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-primary-light" /> Número Telefónico
                </label>
                <input
                  required
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="Ej. +51 987 654 321"
                  className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none focus:border-primary transition-all placeholder:text-slate-600"
                />
              </div>

              {/* Dynamic Premium Role Selector */}
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-primary-light" /> Tipo de Cuenta Solicitada
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { value: 'USER', label: 'Atleta', emoji: '👤' },
                    { value: 'TRAINER', label: 'Entrenador', emoji: '⏱️' },
                    { value: 'GYM_OWNER', label: 'Dueño', emoji: '🏢' }
                  ].map(r => (
                    <button
                      key={r.value}
                      type="button"
                      onClick={() => setFormData({ ...formData, role: r.value })}
                      className={`p-3.5 rounded-2xl border flex flex-col items-center gap-1.5 transition-all text-xs font-bold uppercase tracking-wider ${
                        formData.role === r.value 
                          ? 'bg-primary/20 border-primary text-white shadow-lg shadow-primary/10' 
                          : 'bg-white/5 border-white/10 text-slate-400 hover:border-white/20'
                      }`}
                    >
                      <span className="text-2xl select-none">{r.emoji}</span>
                      <span>{r.label}</span>
                    </button>
                  ))}
                </div>
                 {formData.role !== 'USER' && (
                  <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-3 text-[10px] text-yellow-400 mt-2 flex items-center gap-2">
                    <span className="animate-pulse text-base shrink-0">⚠️</span>
                    <span>Los roles de **Entrenador** y **Dueño** no se activarán de forma directa. Tu solicitud quedará en estado **PENDIENTE**. Un administrador del sistema (como Mario) deberá aprobarla desde su panel antes de que puedas acceder.</span>
                  </div>
                )}
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="relative w-full overflow-hidden rounded-2xl bg-gradient-to-r from-primary to-secondary py-4 text-sm font-bold uppercase tracking-widest text-white shadow-lg shadow-primary/25 transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-50"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" /> Guardando...
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    <ShieldCheck className="w-4 h-4" /> Registrarme Completamente
                  </span>
                )}
              </button>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
