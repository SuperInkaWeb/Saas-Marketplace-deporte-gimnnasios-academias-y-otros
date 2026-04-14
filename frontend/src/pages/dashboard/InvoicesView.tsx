import React, { useState, useEffect } from 'react';
import { ArrowLeft, FileText, Download, CheckCircle2, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/api-client';
import { useAuth } from '../../context/auth-context';
import InvoiceModal from './components/InvoiceModal';

const InvoicesView: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    const fetchInvoices = async () => {
      try {
        if (!user) return; // Wait for user context

        if (user.role === 'GYM_OWNER' || user.role === 'ADMIN') {
          // Obtener gimnasios del usuario
          const { data: gyms } = await api.get('/gyms');
          const ownerGyms = gyms.filter((g: any) => typeof g.ownerId === 'string' || g.ownerId);
          const currentGymId = ownerGyms.length > 0 ? ownerGyms[0].id : gyms[0]?.id;

          if (currentGymId) {
            const { data } = await api.get(`/invoices/gym/${currentGymId}`);
            setInvoices(data);
          } else {
            setInvoices([]);
          }
        } else {
          const { data } = await api.get('/invoices/user');
          setInvoices(data);
        }
      } catch (error) {
        console.error('Error fetching invoices:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchInvoices();
  }, [user]);

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
      month: '2-digit',
      day: '2-digit',
    });
  };

  const isOwner = user?.role === 'GYM_OWNER' || user?.role === 'ADMIN';

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-500 pb-20">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate(-1)} className="p-2 bg-white/5 rounded-full hover:bg-white/10 transition-colors">
          <ArrowLeft className="w-5 h-5 text-white" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-white">Facturación</h1>
          <p className="text-slate-400 text-sm">
            {isOwner ? 'Historial de pagos y facturas emitidas de tu gimnasio.' : 'Historial de pagos y soporte de suscripciones.'}
          </p>
        </div>
      </div>

      <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl overflow-hidden shadow-2xl">
        <div className="p-6 border-b border-white/5 flex justify-between items-center">
          <h2 className="text-lg font-bold text-white">{isOwner ? 'Últimas Facturas Emitidas' : 'Tus Facturas Generadas'}</h2>
        </div>
        
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <Loader2 className="w-10 h-10 text-primary-light animate-spin" />
            <p className="text-slate-400 animate-pulse">Consultando historial...</p>
          </div>
        ) : invoices.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4 text-center px-4">
            <div className="bg-white/5 p-4 rounded-full">
              <FileText className="w-10 h-10 text-slate-500" />
            </div>
            <p className="text-slate-400">
              {isOwner ? 'Tu gimnasio aún no tiene facturas emitidas.' : 'No tienes facturas generadas todavía.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-black/20 text-xs uppercase font-bold text-slate-500">
                <tr>
                  <th scope="col" className="px-6 py-4">No. Factura</th>
                  <th scope="col" className="px-6 py-4">Fecha</th>
                  <th scope="col" className="px-6 py-4">{isOwner ? 'Cliente / Atleta' : 'Concepto (Gimnasio)'}</th>
                  <th scope="col" className="px-6 py-4">Monto Total</th>
                  <th scope="col" className="px-6 py-4">Estado</th>
                  <th scope="col" className="px-6 py-4 text-center">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {invoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-white/5 transition-colors group">
                    <td className="px-6 py-4 font-mono font-medium text-white">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-slate-500 group-hover:text-primary-light transition-colors" /> 
                        {inv.invoiceNum}
                      </div>
                    </td>
                    <td className="px-6 py-4 font-medium">{formatDate(inv.issuedAt)}</td>
                    <td className="px-6 py-4 text-slate-400">
                      {isOwner 
                        ? inv.user?.name || inv.user?.email || 'Membresía General' 
                        : inv.gym?.name || 'Suscripción'}
                    </td>
                    <td className="px-6 py-4 font-bold text-white">{formatCurrency(inv.total)}</td>
                    <td className="px-6 py-4">
                      <span className="bg-green-500/10 text-green-400 px-2.5 py-1 rounded-full text-xs font-bold flex items-center gap-1 w-max">
                        <CheckCircle2 className="w-3 h-3" /> {inv.status === 'PAID' ? 'Pagado' : inv.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button 
                        onClick={() => {
                           setSelectedInvoice(inv);
                           setIsModalOpen(true);
                        }}
                        className="p-2 hover:bg-primary/20 rounded-xl text-primary-light hover:text-white transition-all active:scale-90"
                        title="Ver Factura Detallada"
                      >
                        <Download className="w-5 h-5 mx-auto" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <InvoiceModal 
        invoice={selectedInvoice} 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
      />
    </div>
  );
};

export default InvoicesView;
