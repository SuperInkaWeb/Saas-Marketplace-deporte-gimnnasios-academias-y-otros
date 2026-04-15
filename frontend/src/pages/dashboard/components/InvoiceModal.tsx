import React from 'react';
import { X, Printer, CheckCircle2, MapPin, Globe, Mail } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface InvoiceModalProps {
  invoice: any;
  isOpen: boolean;
  onClose: () => void;
}

const InvoiceModal: React.FC<InvoiceModalProps> = ({ invoice, isOpen, onClose }) => {
  if (!invoice) return null;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-CO', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
          />
          
          <motion.div 
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="relative w-full max-w-2xl bg-[#0f172a] border border-white/10 rounded-[2.5rem] overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
          >
            {/* Header / Actions */}
            <div className="p-6 border-b border-white/5 flex justify-between items-center bg-white/5">
              <div className="flex items-center gap-3">
                <div className="bg-primary/20 p-2 rounded-xl">
                  <CheckCircle2 className="w-5 h-5 text-primary-light" />
                </div>
                <h3 className="text-white font-bold text-lg">Factura No. {invoice.invoiceNum}</h3>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => window.print()} className="p-2 hover:bg-white/10 rounded-full text-slate-400 hover:text-white transition-all">
                  <Printer className="w-5 h-5" />
                </button>
                <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full text-slate-400 hover:text-white transition-all">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Scrollable Content */}
            <div className="flex-grow overflow-y-auto p-8 md:p-12 space-y-12">
              {/* Logo & Status */}
              <div className="flex flex-col md:flex-row justify-between items-start gap-8">
                <div>
                  <h1 className="text-3xl font-black text-white tracking-tighter mb-2">SPORTNEXUS <span className="text-primary-light">🏆</span></h1>
                  <p className="text-slate-500 text-xs font-bold uppercase tracking-[0.2em]">SaaS Deportivo & Marketplace</p>
                </div>
                <div className="text-right">
                  <div className="bg-green-500/10 text-green-400 border border-green-500/20 px-6 py-2 rounded-full font-black text-sm uppercase tracking-widest mb-2">
                    {invoice.status}
                  </div>
                  <p className="text-slate-500 text-xs uppercase font-bold">{formatDate(invoice.issuedAt)}</p>
                </div>
              </div>

              {/* Addresses */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-12 border-t border-b border-white/5 py-10">
                <div className="space-y-4">
                  <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">Emisor / Gimnasio</p>
                  <div className="space-y-2">
                    <p className="text-white font-bold">{invoice.gym?.name || "SportNexus Elite HQ"}</p>
                    <div className="flex items-center gap-2 text-slate-400 text-xs">
                      <MapPin className="w-3 h-3" /> <span>{invoice.gym?.address || "Av. Fitness 123, Bogotá"}</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-400 text-xs">
                      <Globe className="w-3 h-3" /> <span>www.sportnexus.fit</span>
                    </div>
                  </div>
                </div>
                <div className="space-y-4 text-right md:text-left">
                  <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">Cliente / Atleta</p>
                  <div className="space-y-2">
                    <p className="text-white font-bold">{invoice.user?.name || "Atleta SportNexus"}</p>
                    <div className="flex items-center gap-2 text-slate-400 text-xs justify-end md:justify-start">
                      <Mail className="w-3 h-3" /> <span>{invoice.user?.email}</span>
                    </div>
                    <p className="text-slate-500 text-[10px] italic">Documento verificado digitalmente</p>
                  </div>
                </div>
              </div>

              {/* Item Table */}
              <div className="space-y-6">
                <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">Detalle de Compra</p>
                <div className="space-y-4">
                  <div className="flex justify-between items-center py-2 border-b border-white/5">
                    <div className="space-y-1">
                      <p className="text-white font-medium">Suscripción Plan Premium</p>
                      <p className="text-slate-500 text-[10px] uppercase">Mensualidad Full Access</p>
                    </div>
                    <p className="text-white font-bold">{formatCurrency(Number(invoice.amount))}</p>
                  </div>
                </div>
              </div>

              {/* Totals Section */}
              <div className="space-y-4 bg-white/5 p-8 rounded-3xl border border-white/10 ml-auto max-w-xs transition-colors hover:border-primary/30">
                <div className="flex justify-between text-xs text-slate-400 uppercase font-bold">
                  <span>Subtotal</span>
                  <span>{formatCurrency(Number(invoice.amount))}</span>
                </div>
                <div className="flex justify-between text-xs text-slate-400 uppercase font-bold">
                  <span>IVA (0%)</span>
                  <span>$0</span>
                </div>
                <div className="h-px bg-white/10 my-2" />
                <div className="flex justify-between text-white font-black text-xl">
                  <span>TOTAL</span>
                  <span className="text-primary-light">{formatCurrency(Number(invoice.total))}</span>
                </div>
              </div>
            </div>

            {/* Footer / QR Area */}
            <div className="p-8 border-t border-white/5 bg-black/20 flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="text-[10px] text-slate-500 max-w-xs text-center md:text-left">
                Esta es una factura electrónica legalmente válida para SportNexus. 
                Generada automáticamente por el motor de facturación v2.
              </div>
              <div className="w-20 h-20 bg-white p-2 rounded-xl flex items-center justify-center opacity-80 hover:opacity-100 transition-opacity">
                 {/* QR Placeholder */}
                 <div className="grid grid-cols-4 gap-0.5">
                    {[...Array(16)].map((_, i) => (
                      <div key={i} className={`w-3 h-3 ${Math.random() > 0.5 ? 'bg-slate-900' : 'bg-white'}`} />
                    ))}
                 </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default InvoiceModal;
