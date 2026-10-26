import React, { useState, useEffect } from 'react';
import { ArrowLeft, Send, Mail, Bell, CheckCircle, Loader2, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/api-client';
import { useAuth } from '../../context/auth-context';
import { toast } from 'sonner';

const CRMView: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [members, setMembers] = useState<any[]>([]);
  const [gyms, setGyms] = useState<any[]>([]);
  const [selectedGymId, setSelectedGymId] = useState<string>('');
  const [gymId, setGymId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    subject: '',
    type: 'EMAIL',
    content: '',
    toEmail: '',
    sendToAll: false
  });

  useEffect(() => {
    if (!user?.id) return;
    const initData = async () => {
      try {
        setLoading(true);
        // Si es Admin, cargamos todos los gimnasios del sistema. Si es dueño, solo los suyos.
        const url = user.role === 'ADMIN' ? '/gyms' : `/gyms?ownerId=${user.id}`;
        const { data: ownerGyms } = await api.get(url);
        setGyms(ownerGyms);
        
        if (ownerGyms && ownerGyms.length > 0) {
          if (user.role === 'ADMIN') {
            setSelectedGymId('all');
            setGymId('all');
            await Promise.all([
              loadAllCampaigns(),
              loadAllMembers()
            ]);
          } else {
            const currentGymId = ownerGyms[0].id;
            setGymId(currentGymId);
            setSelectedGymId(currentGymId);
            await Promise.all([
              loadCampaigns(currentGymId),
              loadMembers(currentGymId)
            ]);
          }
        } else {
          setGymId(null);
          setSelectedGymId('');
          setCampaigns([]);
          setMembers([]);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };
    initData();
  }, [user]);

  const loadCampaigns = async (id: string) => {
    try {
      const { data } = await api.get(`/marketing/gym/${id}/campaigns`);
      setCampaigns(data);
    } catch(err) {
      console.error(err);
    }
  };

  const loadAllCampaigns = async () => {
    try {
      const { data } = await api.get('/marketing/all-campaigns');
      setCampaigns(data);
    } catch (err) {
      console.error(err);
    }
  };

  const loadMembers = async (id: string) => {
    try {
      const { data } = await api.get(`/gyms/${id}/members`);
      setMembers(data);
    } catch(err) {
      console.error(err);
    }
  };

  const loadAllMembers = async () => {
    try {
      // Si es Admin en vista global, traemos todos los atletas
      const { data } = await api.get('/users?role=USER');
      setMembers(data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleGymChange = async (id: string) => {
    setSelectedGymId(id);
    setGymId(id === 'all' ? 'all' : id);
    setLoading(true);
    try {
      if (id === 'all') {
        await Promise.all([
          loadAllCampaigns(),
          loadAllMembers()
        ]);
      } else {
        await Promise.all([
          loadCampaigns(id),
          loadMembers(id)
        ]);
      }
    } catch (error) {
      console.error('Error loading CRM data for gym:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!gymId) return;

    setSaving(true);
    try {
      await api.post(`/marketing/gym/${gymId}/campaigns`, {
        title: formData.subject,
        subject: formData.subject,
        type: formData.type,
        content: formData.content,
        sendToAll: formData.sendToAll,
        toEmail: !formData.sendToAll && formData.type === 'EMAIL' ? formData.toEmail || undefined : undefined
      });
      
      setSuccess(true);
      toast.success('¡Campaña enviada con éxito!');
      setFormData({ subject: '', type: 'EMAIL', content: '', toEmail: '', sendToAll: false });
      await loadCampaigns(gymId);
      
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error('Error sending campaign:', err);
      const msg = (err as { response?: { data?: { message?: string | string[] } } }).response?.data?.message;
      toast.error(Array.isArray(msg) ? msg.join('. ') : msg || 'Error al enviar la campaña');
    } finally {
      setSaving(false);
    }
  };

  if (loading && gyms.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
        <Loader2 className="w-10 h-10 text-primary-light animate-spin" />
        <p className="text-slate-400">Cargando módulo de marketing...</p>
      </div>
    );
  }

  // Onboarding view if no gyms are owned by the current user
  if (!loading && gyms.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center max-w-md mx-auto space-y-6 animate-in fade-in duration-500">
        <div className="w-20 h-20 bg-primary/10 rounded-[2rem] flex items-center justify-center text-primary-light border border-primary/20 shadow-xl shadow-primary/5">
          <Mail className="w-10 h-10 animate-pulse" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-black text-white tracking-tight">Sin Negocios Registrados</h2>
          <p className="text-slate-400 text-sm leading-relaxed">
            Para poder enviar campañas de marketing por correo electrónico y notificaciones push a tus atletas, primero necesitas registrar al menos un gimnasio en la plataforma.
          </p>
        </div>
        <button 
          onClick={() => navigate('/gyms')} 
          className="btn-primary px-8 py-3.5 font-bold rounded-2xl active:scale-95 transition-transform flex items-center gap-2 shadow-lg shadow-primary/20"
        >
          Registrar mi primer gimnasio
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-500 pb-20">
      {/* Header and Gym Selector */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="p-2 bg-white/5 rounded-full hover:bg-white/10 transition-colors">
            <ArrowLeft className="w-5 h-5 text-white" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-white">Marketing y CRM</h1>
            <p className="text-slate-400 text-sm">Fideliza a tus atletas con notificaciones y correos reales.</p>
          </div>
        </div>

        {(gyms.length > 0 || user?.role === 'ADMIN') && (
          <div className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-2xl px-4 py-2 self-start md:self-auto">
            <span className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Sede:</span>
            <select
              value={selectedGymId}
              onChange={(e) => handleGymChange(e.target.value)}
              className="bg-transparent text-sm font-bold text-white outline-none cursor-pointer pr-2"
            >
              {user?.role === 'ADMIN' && (
                <option value="all" className="bg-slate-900 text-white">
                  Todas las Sedes (Global)
                </option>
              )}
              {gyms.map((g) => (
                <option key={g.id} value={g.id} className="bg-slate-900 text-white">
                  {g.name}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6 shadow-xl">
          <h2 className="text-lg font-bold text-white flex items-center gap-2 mb-4">
            <Mail className="w-5 h-5 text-primary-light" /> Nueva Campaña
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-primary/10 border border-primary/20 rounded-2xl mb-4 group cursor-pointer" onClick={() => setFormData({...formData, sendToAll: !formData.sendToAll})}>
              <div className="flex items-center gap-3">
                <Users className="w-5 h-5 text-primary-light" />
                <span className="text-white text-sm font-bold">Enviar a todos los miembros</span>
              </div>
              <div className={`w-10 h-5 rounded-full transition-all relative ${formData.sendToAll ? 'bg-primary' : 'bg-slate-700'}`}>
                <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${formData.sendToAll ? 'left-6' : 'left-1'}`} />
              </div>
            </div>

            <div>
              <label className="text-slate-400 text-xs font-bold uppercase mb-1 block">Asunto</label>
              <input 
                type="text" 
                value={formData.subject}
                maxLength={200}
                onChange={e => setFormData({...formData, subject: e.target.value})}
                className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-primary-light transition-colors" 
                placeholder="Ej. ¡20% Descuento en Tienda!" 
                required 
              />
            </div>
            <div>
              <label className="text-slate-400 text-xs font-bold uppercase mb-1 block">Tipo de Mensaje</label>
              <select 
                value={formData.type}
                onChange={e => setFormData({...formData, type: e.target.value})}
                className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-primary-light appearance-none"
              >
                <option value="EMAIL">Correo Electrónico Directo</option>
                <option value="PUSH">Notificación Push a la app</option>
              </select>
            </div>
            
            {formData.type === 'EMAIL' && (
              <div className={`animate-in fade-in slide-in-from-top-2 transition-all ${formData.sendToAll ? 'opacity-50 grayscale pointer-events-none scale-95' : ''}`}>
                <label className="text-slate-400 text-xs font-bold uppercase mb-1 block flex items-center gap-2">
                  Destinatario {formData.sendToAll ? '(Masivo)' : '(Email Demo)'}
                  <span className="bg-primary/20 text-primary-light px-2 py-0.5 rounded-full text-[10px]">REAL</span>
                </label>
                <input 
                  type="email" 
                  value={formData.toEmail}
                  onChange={e => setFormData({...formData, toEmail: e.target.value})}
                  className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-primary-light transition-colors" 
                  placeholder={formData.sendToAll ? 'Todos los miembros activos' : 'ejemplo@correo.com'}
                  required={!formData.sendToAll}
                />
                <p className="text-[10px] text-slate-500 mt-1">
                  {formData.sendToAll ? 'Se enviará a todos los miembros con membresía activa.' : 'Llegará a esta bandeja de entrada real mediante SMTP (Nodemailer).'}
                </p>
              </div>
            )}
            
            <div>
              <label className="text-slate-400 text-xs font-bold uppercase mb-1 block">Contenido</label>
              <textarea 
                rows={5} 
                value={formData.content}
                maxLength={5000}
                onChange={e => setFormData({...formData, content: e.target.value})}
                className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-primary-light transition-colors resize-none" 
                placeholder="Escribe el cuerpo del mensaje..." 
                required 
              />
            </div>
            <button 
              type="submit" 
              disabled={saving || !gymId || gymId === 'all'} 
              className={`w-full flex justify-center items-center gap-2 py-3 rounded-xl font-bold transition-all ${saving || !gymId || gymId === 'all' ? 'bg-slate-700 text-slate-400 cursor-not-allowed' : 'btn-primary'}`}
            >
              {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Send className="w-4 h-4" /> Enviar Campaña</>}
            </button>
            
            {gymId === 'all' && (
              <p className="text-amber-400 text-xs font-semibold text-center mt-2.5">
                ⚠️ Selecciona una sede específica arriba para poder redactar y enviar una campaña.
              </p>
            )}
            
            {success && (
              <p className="text-green-400 text-sm font-bold flex items-center gap-2 justify-center mt-3 animate-in fade-in">
                <CheckCircle className="w-5 h-5" /> ¡Campaña encolada y enviada!
              </p>
            )}
          </form>
        </div>

        <div className="space-y-6">
          <div className="bg-white/5 border border-white/10 rounded-3xl p-6 backdrop-blur-sm">
            <h2 className="text-lg font-bold text-white flex items-center gap-2 mb-4">
              <Users className="w-5 h-5 text-primary-light" /> Miembros del Gimnasio
            </h2>
            
            {loading ? (
              <Loader2 className="w-6 h-6 animate-spin text-slate-500 mx-auto" />
            ) : members.length === 0 ? (
              <p className="text-slate-500 text-center text-sm">No hay miembros registrados.</p>
            ) : (
              <div className="space-y-2 max-h-[300px] overflow-y-auto custom-scrollbar pr-2">
                {members.map(member => (
                  <button
                    key={member.id}
                    onClick={() => {
                      setFormData(prev => ({ ...prev, toEmail: member.email, type: 'EMAIL' }));
                    }}
                    className={`w-full text-left p-3 rounded-xl border border-white/5 hover:bg-white/10 transition-all flex items-center gap-3 group ${formData.toEmail === member.email ? 'bg-primary/20 border-primary/40' : 'bg-black/20'}`}
                  >
                    <div className="w-8 h-8 rounded-full bg-slate-800 border border-white/10 flex items-center justify-center font-bold text-xs text-primary-light uppercase">
                      {member.name.charAt(0)}
                    </div>
                    <div className="flex-grow min-w-0">
                      <p className="text-white text-sm font-bold truncate">{member.name}</p>
                      <p className="text-slate-500 text-[10px] truncate">{member.email}</p>
                    </div>
                    <div className={`w-2 h-2 rounded-full ${formData.toEmail === member.email ? 'bg-primary animate-pulse' : 'bg-slate-700'}`} />
                  </button>
                ))}
              </div>
            )}
            <p className="text-[10px] text-slate-500 mt-4 italic text-center">Toca un miembro para auto-completar el destinatario.</p>
          </div>

          <div className="space-y-4">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Bell className="w-5 h-5 text-secondary-light" /> Historial de Campañas
            </h2>
            
            {loading ? (
              <div className="flex justify-center py-10">
                <Loader2 className="w-8 h-8 text-slate-500 animate-spin" />
              </div>
            ) : campaigns.length === 0 ? (
              <div className="bg-white/5 border border-white/10 rounded-2xl p-8 text-center backdrop-blur-sm">
                <Mail className="w-8 h-8 text-slate-600 mx-auto mb-3" />
                <p className="text-slate-400 text-sm">No has enviado campañas todavía.</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                {campaigns.map((camp) => (
                   <div key={camp.id} className="bg-white/5 border border-white/10 rounded-2xl p-5 backdrop-blur-sm shadow-xl hover:border-white/20 transition-all">
                    {camp.gym?.name && (
                      <div className="mb-2">
                        <span className="inline-block text-[10px] font-bold text-primary-light bg-primary/10 border border-primary/20 px-2 py-0.5 rounded-lg">
                          🏫 {camp.gym.name}
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="text-white font-bold text-sm line-clamp-1 pr-2">{camp.title || camp.subject}</h3>
                      <span className="text-[10px] text-green-400 bg-green-500/20 px-2 py-0.5 rounded-full uppercase font-bold shrink-0">
                        {camp.status}
                      </span>
                    </div>
                    <p className="text-slate-400 text-xs line-clamp-2">{camp.content}</p>
                    <div className="flex items-center justify-between mt-3">
                      <p className="text-primary-light text-xs font-semibold">{camp.sentCount} Receptores</p>
                      <p className="text-slate-500 text-[10px]">
                        {new Date(camp.createdAt).toLocaleDateString('es-CO')}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CRMView;
