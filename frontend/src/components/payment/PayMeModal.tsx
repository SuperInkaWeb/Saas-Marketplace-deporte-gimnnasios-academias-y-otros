import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CreditCard, Lock, X, Loader2, ShieldCheck } from 'lucide-react';

interface PayMeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  amount: number;
  description: string;
}

export const PayMeModal: React.FC<PayMeModalProps> = ({ isOpen, onClose, onSuccess, amount, description }) => {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSimulatedPayment = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // Simular el proceso de Pay-Me
    setTimeout(() => {
      setLoading(false);
      setSuccess(true);
      setTimeout(() => {
        onSuccess();
        setSuccess(false);
      }, 1500);
    }, 2000);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl relative"
          >
            {/* Header Pay-Me */}
            <div className="bg-[#002f5b] p-6 text-white flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <CreditCard className="w-6 h-6" /> Pay-Me
                </h2>
                <p className="text-blue-200 text-sm mt-1 flex items-center gap-1">
                  <Lock className="w-3 h-3" /> Pago Seguro
                </p>
              </div>
              <button onClick={onClose} className="text-white/70 hover:text-white transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Body */}
            <div className="p-6">
              {success ? (
                <div className="flex flex-col items-center justify-center py-8">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4 text-green-600"
                  >
                    <ShieldCheck className="w-8 h-8" />
                  </motion.div>
                  <h3 className="text-xl font-bold text-slate-800">¡Pago Exitoso!</h3>
                  <p className="text-slate-500 text-sm">Transacción aprobada por Pay-Me</p>
                </div>
              ) : (
                <>
                  <div className="mb-6 pb-6 border-b border-slate-100">
                    <p className="text-slate-500 text-sm mb-1">{description}</p>
                    <p className="text-3xl font-extrabold text-slate-800">${amount.toFixed(2)}</p>
                  </div>

                  <form onSubmit={handleSimulatedPayment} className="space-y-4">
                    <div>
                      <label className="block text-slate-700 text-sm font-medium mb-1">Número de Tarjeta</label>
                      <div className="relative">
                        <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                        <input
                          type="text"
                          required
                          placeholder="0000 0000 0000 0000"
                          className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#002f5b] focus:bg-white transition-all"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-slate-700 text-sm font-medium mb-1">Vencimiento</label>
                        <input
                          type="text"
                          required
                          placeholder="MM/YY"
                          className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#002f5b] focus:bg-white transition-all"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-700 text-sm font-medium mb-1">CVV</label>
                        <input
                          type="password"
                          required
                          maxLength={4}
                          placeholder="***"
                          className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#002f5b] focus:bg-white transition-all"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full mt-6 bg-[#002f5b] hover:bg-[#002242] text-white py-4 rounded-xl font-bold transition-colors flex items-center justify-center gap-2 active:scale-[0.98]"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" /> Procesando con Pay-Me...
                        </>
                      ) : (
                        `Pagar $${amount.toFixed(2)}`
                      )}
                    </button>
                    
                    <div className="text-center mt-4">
                       <img src="https://pay-me.com/wp-content/uploads/2020/09/Recurso-3.png" alt="Pay-Me Logo" className="h-6 mx-auto opacity-50 grayscale" onError={(e) => e.currentTarget.style.display = 'none'} />
                    </div>
                  </form>
                </>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
