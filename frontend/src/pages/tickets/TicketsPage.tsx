import React, { useState, useEffect } from 'react';
import api from '../../api/api-client';
import { useAuth } from '../../context/auth-context';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import {
  MessageSquare, Plus, X, Loader2,
  Search, RefreshCw, Shield,
  Trash2
} from 'lucide-react';

const STATUS_CONFIG: Record<string, any> = {
  OPEN:      { label: 'Abierto',    color: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20' },
  IN_REVIEW: { label: 'En Revisión',color: 'text-blue-400 bg-blue-500/10 border-blue-500/20' },
  RESOLVED:  { label: 'Resuelto',   color: 'text-green-400 bg-green-500/10 border-green-500/20' },
  CLOSED:    { label: 'Cerrado',    color: 'text-slate-400 bg-slate-500/10 border-slate-500/20' },
};

const CATEGORY_LABELS: Record<string, string> = {
  GENERAL: 'General', PAYMENT: 'Pago', CLASS: 'Clase',
  INSTRUCTOR: 'Instructor', FACILITY: 'Instalación', OTHER: 'Otro',
};

// ── Admin Panel ────────────────────────────────────────────────────────────────
const AdminTicketsPanel: React.FC = () => {
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [replyingId, setReplyingId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchTickets = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/tickets');
      setTickets(data);
    } catch { toast.error('Error al cargar tickets'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchTickets(); }, []);

  const handleStatusChange = async (id: string, status: string) => {
    try {
      await api.patch(`/tickets/${id}/status`, { status });
      toast.success('Estado actualizado');
      fetchTickets();
    } catch { toast.error('Error al actualizar estado'); }
  };

  const handleReply = async (id: string) => {
    if (!replyText.trim()) return;
    setSubmitting(true);
    try {
      await api.patch(`/tickets/${id}/reply`, { adminReply: replyText });
      toast.success('Respuesta enviada');
      setReplyingId(null);
      setReplyText('');
      fetchTickets();
    } catch { toast.error('Error al enviar respuesta'); }
    finally { setSubmitting(false); }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('¿Eliminar este ticket definitivamente?')) return;
    try {
      await api.delete(`/tickets/${id}`);
      toast.success('Ticket eliminado');
      setTickets(t => t.filter(x => x.id !== id));
    } catch { toast.error('Error al eliminar'); }
  };

  const filtered = tickets.filter(t => {
  const q = filter.toLowerCase();
  const matchesSearch =
    !q ||
    t.subject.toLowerCase().includes(q) ||
    t.user?.name?.toLowerCase().includes(q);
  const matchesStatus = !statusFilter || t.status === statusFilter;
  return matchesSearch && matchesStatus;
});

  const counts = { OPEN: 0, IN_REVIEW: 0, RESOLVED: 0, CLOSED: 0 } as any;
  tickets.forEach(t => counts[t.status]++);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <MessageSquare className="text-primary-light" /> Gestión de Quejas y Reclamos
          </h1>
          <p className="text-slate-400 text-sm">Panel administrativo — todas las solicitudes de soporte</p>
        </div>
        <div className="flex items-center gap-3">
  <div className="flex items-center gap-2">
    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider whitespace-nowrap">
      Filtro por estado:
    </label>
    <select
      value={statusFilter}
      onChange={e => setStatusFilter(e.target.value)}
      className="bg-slate-900 border border-white/10 rounded-xl px-4 py-2 text-sm text-white outline-none focus:border-primary transition-all"
    >
      <option value="">Todos</option>
      {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
        <option key={key} value={key}>{cfg.label}</option>
      ))}
    </select>
  </div>

  <button
    onClick={fetchTickets}
    className="flex items-center gap-2 bg-white/5 border border-white/10 px-4 py-2 rounded-xl text-slate-300 hover:bg-white/10 transition-colors text-sm"
  >
    <RefreshCw className="w-4 h-4" /> Actualizar
  </button>
</div>
      </div>

            {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
          <div
            key={key}
            onClick={() => setStatusFilter(statusFilter === key ? '' : key)}
            className={`glass-card p-4 border cursor-pointer transition-all ${
              statusFilter === key ? 'border-primary' : 'border-white/5 hover:border-white/15'
            }`}
          >
            <p className={`text-xs font-bold uppercase tracking-wider ${cfg.color.split(' ')[0]}`}>{cfg.label}</p>
            <p className="text-3xl font-bold text-white mt-1">{counts[key]}</p>
          </div>
        ))}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4" />
        <input
          type="text" placeholder="Buscar por asunto o usuario..."
          value={filter} onChange={e => setFilter(e.target.value)}
          className="w-full bg-slate-900 border border-white/10 rounded-xl py-3 pl-11 pr-4 text-white outline-none focus:border-primary transition-all"
        />
      </div>

      {/* Ticket List */}
      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 text-primary animate-spin" /></div>
      ) : (
        <div className="space-y-3">
          {filtered.length === 0 && (
            <div className="glass-card p-12 text-center text-slate-500">No hay tickets que mostrar.</div>
          )}
          {filtered.map(ticket => {
            const cfg = STATUS_CONFIG[ticket.status];
            return (
              <motion.div
                key={ticket.id}
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                className="glass-card p-5 border border-white/5 hover:border-white/15 transition-all"
              >
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                  <div className="flex-grow min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <span className={`text-xs font-bold px-2.5 py-1 rounded-md border ${cfg.color}`}>{cfg.label}</span>
                      <span className="text-xs text-slate-500 bg-slate-800 px-2 py-1 rounded">{CATEGORY_LABELS[ticket.category]}</span>
                    </div>
                    <h3 className="font-bold text-white">{ticket.subject}</h3>
                    <p className="text-slate-400 text-sm mt-1 line-clamp-2">{ticket.description}</p>
                    <div className="flex items-center gap-4 mt-3 text-xs text-slate-500">
                      <span>👤 {ticket.user?.name} ({ticket.user?.email})</span>
                      <span>{new Date(ticket.createdAt).toLocaleDateString()}</span>
                    </div>
                    {ticket.adminReply && (
                      <div className="mt-3 bg-primary/5 border border-primary/20 rounded-xl p-3">
                        <p className="text-xs font-bold text-primary-light mb-1 flex items-center gap-1"><Shield className="w-3 h-3" /> Respuesta Admin</p>
                        <p className="text-slate-300 text-sm">{ticket.adminReply}</p>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col gap-2 min-w-[160px]">
                    <select
                      value={ticket.status}
                      onChange={e => handleStatusChange(ticket.id, e.target.value)}
                      className="bg-slate-800 border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none"
                    >
                      {Object.entries(STATUS_CONFIG).map(([k, v]) => (
                        <option key={k} value={k}>{v.label}</option>
                      ))}
                    </select>
                    <button
                      onClick={() => { setReplyingId(ticket.id); setReplyText(ticket.adminReply || ''); }}
                      className="bg-primary/10 hover:bg-primary/20 text-primary-light border border-primary/20 rounded-lg px-3 py-2 text-sm font-medium transition-colors"
                    >
                      {ticket.adminReply ? 'Editar Respuesta' : 'Responder'}
                    </button>
                    <button
                      onClick={() => handleDelete(ticket.id)}
                      className="bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 rounded-lg px-3 py-2 text-sm transition-colors flex items-center justify-center gap-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Eliminar
                    </button>
                  </div>
                </div>

                {/* Reply Box */}
                <AnimatePresence>
                  {replyingId === ticket.id && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                      className="mt-4 border-t border-white/10 pt-4"
                    >
                      <label className="text-xs font-bold text-slate-400 uppercase mb-2 block">Tu Respuesta</label>
                      <textarea
                        value={replyText} onChange={e => setReplyText(e.target.value)}
                        rows={3} placeholder="Escribe tu respuesta al usuario..."
                        className="w-full bg-slate-800 border border-white/10 rounded-xl p-3 text-white outline-none focus:border-primary text-sm resize-none"
                      />
                      <div className="flex gap-2 mt-2">
                        <button onClick={() => handleReply(ticket.id)} disabled={submitting}
                          className="bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded-lg text-sm font-bold transition-colors flex items-center gap-1 disabled:opacity-50">
                          {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : '✓ Enviar Respuesta'}
                        </button>
                        <button onClick={() => setReplyingId(null)} className="bg-white/5 text-slate-400 px-4 py-2 rounded-lg text-sm hover:bg-white/10 transition-colors">Cancelar</button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
};

// ── User Ticket Panel ──────────────────────────────────────────────────────────
const UserTicketsPanel: React.FC = () => {
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ subject: '', description: '', category: 'GENERAL' });

  const fetchMine = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/tickets/mine');
      setTickets(data);
    } catch { toast.error('Error al cargar tus tickets'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchMine(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post('/tickets', form);
      toast.success('Ticket enviado. El equipo de soporte te responderá pronto.');
      setShowForm(false);
      setForm({ subject: '', description: '', category: 'GENERAL' });
      fetchMine();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Error al enviar el ticket');
    } finally { setSubmitting(false); }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <MessageSquare className="text-primary-light" /> Soporte y Reclamos
          </h1>
          <p className="text-slate-400 text-sm">Envía una queja o consulta al equipo de Hercix</p>
        </div>
        <button onClick={() => setShowForm(true)} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" /> Nueva Solicitud
        </button>
      </div>

      {/* Form Modal */}
      <AnimatePresence>
        {showForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowForm(false)} className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="bg-slate-900 border border-white/10 rounded-2xl p-6 w-full max-w-lg relative z-10 shadow-2xl">
              <div className="flex justify-between items-center mb-5">
                <h2 className="text-xl font-bold text-white">Nueva Solicitud de Soporte</h2>
                <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-white"><X className="w-5 h-5" /></button>
              </div>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase block mb-1">Categoría</label>
                  <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}
                    className="w-full bg-slate-800 border border-white/10 rounded-xl px-4 py-2.5 text-white outline-none">
                    {Object.entries(CATEGORY_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase block mb-1">Asunto</label>
                  <input required value={form.subject} onChange={e => setForm({ ...form, subject: e.target.value })}
                    placeholder="Resumen breve del problema..."
                    className="w-full bg-slate-800 border border-white/10 rounded-xl px-4 py-2.5 text-white outline-none focus:border-primary" />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase block mb-1">Descripción Detallada</label>
                  <textarea required rows={4} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
                    placeholder="Cuéntanos qué pasó con el mayor detalle posible..."
                    className="w-full bg-slate-800 border border-white/10 rounded-xl px-4 py-2.5 text-white outline-none focus:border-primary resize-none" />
                </div>
                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={() => setShowForm(false)} className="flex-1 bg-white/5 text-slate-300 py-2.5 rounded-xl hover:bg-white/10 transition-colors">Cancelar</button>
                  <button type="submit" disabled={submitting} className="flex-1 btn-primary py-2.5 flex justify-center items-center">
                    {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Enviar Ticket'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* My Tickets List */}
      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 text-primary animate-spin" /></div>
      ) : tickets.length === 0 ? (
        <div className="glass-card p-16 flex flex-col items-center text-center">
          <MessageSquare className="w-12 h-12 text-slate-700 mb-4" />
          <h3 className="text-white font-bold">Sin solicitudes</h3>
          <p className="text-slate-500 text-sm mt-1">¿Tienes alguna queja o problema? Abre una solicitud arriba.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {tickets.map(ticket => {
            const cfg = STATUS_CONFIG[ticket.status];
            return (
              <motion.div key={ticket.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="glass-card p-5 border border-white/5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-xs font-bold px-2.5 py-1 rounded-md border ${cfg.color}`}>{cfg.label}</span>
                      <span className="text-xs text-slate-500">{CATEGORY_LABELS[ticket.category]}</span>
                    </div>
                    <h3 className="font-bold text-white">{ticket.subject}</h3>
                    <p className="text-slate-400 text-sm mt-1">{ticket.description}</p>
                  </div>
                  <span className="text-slate-600 text-xs whitespace-nowrap">{new Date(ticket.createdAt).toLocaleDateString()}</span>
                </div>
                {ticket.adminReply && (
                  <div className="mt-3 bg-primary/5 border border-primary/20 rounded-xl p-3">
                    <p className="text-xs font-bold text-primary-light mb-1 flex items-center gap-1"><Shield className="w-3 h-3" /> Respuesta del equipo</p>
                    <p className="text-slate-300 text-sm">{ticket.adminReply}</p>
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
};

// ── Main Export (decides based on role) ───────────────────────────────────────
const TicketsPage: React.FC = () => {
  const { user } = useAuth();
  if (user?.role === 'ADMIN') return <AdminTicketsPanel />;
  return <UserTicketsPanel />;
};

export default TicketsPage;

