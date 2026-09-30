import React from 'react';
import { X, Printer, MapPin, Globe, Mail, FileText } from 'lucide-react';
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

  // Safe Math calculation
  const total = Number(invoice.total) || 0;
  const subtotal = Number(invoice.amount) || total;
  const iva = Number(invoice.tax) || (total - subtotal);
  const taxPercentage = subtotal > 0 ? Math.round((iva / subtotal) * 100) : 0;

  // Safe user display name
  const hasRealName = invoice.user?.name && !invoice.user.name.includes('@');
  const displayName = hasRealName ? invoice.user.name : "Atleta Registrado";

  // Dynamic Status Badge Style
  const getStatusBadge = (status: string) => {
    const s = status?.toUpperCase();
    if (s === 'PAID') {
      return (
        <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-6 py-2 rounded-full font-black text-sm uppercase tracking-widest block w-max ml-auto">
          Pagado
        </span>
      );
    }
    if (s === 'ISSUED') {
      return (
        <span className="bg-amber-500/10 text-amber-400 border border-amber-500/20 px-6 py-2 rounded-full font-black text-sm uppercase tracking-widest block w-max ml-auto">
          Emitida
        </span>
      );
    }
    return (
      <span className="bg-orange-500/10 text-orange-400 border border-orange-500/20 px-6 py-2 rounded-full font-black text-sm uppercase tracking-widest block w-max ml-auto">
        {status || 'Pendiente'}
      </span>
    );
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
            className="absolute inset-0 bg-black/85 backdrop-blur-sm"
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
                  <FileText className="w-5 h-5 text-primary-light" />
                </div>
                <h3 className="text-white font-bold text-lg">Factura No. {invoice.invoiceNum}</h3>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => window.print()} className="p-2 hover:bg-white/10 rounded-full text-slate-400 hover:text-white transition-all" title="Imprimir Factura">
                  <Printer className="w-5 h-5" />
                </button>
                <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full text-slate-400 hover:text-white transition-all">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Scrollable Content */}
            <div className="flex-grow overflow-y-auto p-8 md:p-12 space-y-10 pb-16">
              {/* Logo & Status */}
              <div className="flex flex-col md:flex-row justify-between items-start gap-6">
                <div>
                  <h1 className="text-3xl font-black text-white tracking-tighter mb-2">Hercix <span className="text-primary-light">🏆</span></h1>
                  <p className="text-slate-500 text-xs font-bold uppercase tracking-[0.2em]">SaaS Deportivo & Marketplace</p>
                </div>
                <div className="text-right w-full md:w-auto">
                  {getStatusBadge(invoice.status)}
                  <p className="text-slate-500 text-xs uppercase font-bold mt-2">{formatDate(invoice.issuedAt)}</p>
                </div>
              </div>

              {/* Addresses */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 border-t border-b border-white/5 py-8">
                <div className="space-y-4">
                  <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">Emisor / Gimnasio</p>
                  <div className="space-y-2">
                    <p className="text-white font-bold">{invoice.gym?.name || "Hercix Elite HQ"}</p>
                    <div className="flex items-center gap-2 text-slate-400 text-xs">
                      <MapPin className="w-3 h-3 text-slate-500" /> <span>{invoice.gym?.address || "Av. Fitness 123, Bogotá"}</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-400 text-xs">
                      <Globe className="w-3 h-3 text-slate-500" /> <span>www.Hercix.fit</span>
                    </div>
                  </div>
                </div>
                <div className="space-y-4 text-left md:text-left">
                  <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">Cliente / Atleta</p>
                  <div className="space-y-2">
                    <p className="text-white font-bold">{displayName}</p>
                    <div className="flex items-center gap-2 text-slate-400 text-xs">
                      <Mail className="w-3 h-3 text-slate-500" /> <span>{invoice.user?.email}</span>
                    </div>
                    <p className="text-slate-500 text-[10px] italic">Documento verificado digitalmente</p>
                  </div>
                </div>
              </div>

              {/* Item Table */}
              <div className="space-y-4">
                <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">Detalle de Compra</p>
                <div className="space-y-2">
                  <div className="flex justify-between items-center py-4 border-b border-white/5">
                    <div className="space-y-1">
                      <p className="text-white font-medium">Suscripción Plan Premium</p>
                      <p className="text-slate-500 text-[10px] uppercase">Mensualidad Full Access</p>
                    </div>
                    <p className="text-white font-bold text-lg">{formatCurrency(subtotal)}</p>
                  </div>
                </div>
              </div>

              {/* Totals Section */}
              <div className="space-y-4 bg-white/5 p-6 rounded-3xl border border-white/10 ml-auto max-w-xs transition-colors hover:border-primary/30 mb-8">
                <div className="flex justify-between text-xs text-slate-400 uppercase font-bold">
                  <span>Subtotal</span>
                  <span>{formatCurrency(subtotal)}</span>
                </div>
                <div className="flex justify-between text-xs text-slate-400 uppercase font-bold">
                  <span>IVA ({taxPercentage}%)</span>
                  <span>{formatCurrency(iva)}</span>
                </div>
                <div className="h-px bg-white/10 my-2" />
                <div className="flex justify-between text-white font-black text-xl">
                  <span>TOTAL</span>
                  <span className="text-primary-light">{formatCurrency(total)}</span>
                </div>
              </div>
            </div>

            {/* Footer / QR Area */}
            <div className="p-8 border-t border-white/5 bg-black/40 flex flex-col md:flex-row items-center justify-between gap-6 z-10">
              <div className="text-[10px] text-slate-500 max-w-xs text-center md:text-left leading-relaxed">
                Esta es una factura electrónica legalmente válida para Hercix. 
                Generada automáticamente por el motor de facturación v2.
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default InvoiceModal;

