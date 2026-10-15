import React, { useEffect, useState } from 'react';
import { Loader2, Save } from 'lucide-react';
import api from '../../api/api-client';

const DAYS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
const toMin = (t: string) => { const [h, m] = t.split(':').map(Number); return h * 60 + m; };
const toTime = (m: number) => `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;

const ScheduleEditor: React.FC = () => {
  const [days, setDays] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    api.get('/professionals/schedule/me').then(({ data }) => {
      setDays(DAYS.map((_, i) =>
        data.find((s: any) => s.dayOfWeek === i) ||
        { dayOfWeek: i, isActive: false, openMinute: 540, closeMinute: 1020, capacity: 1 }));
    });
  }, []);

  const update = (i: number, patch: any) =>
    setDays((d) => d.map((x, idx) => (idx === i ? { ...x, ...patch } : x)));

  const save = async () => {
    setSaving(true);
    setMsg('');
    try {
      const payload = days.map(({ dayOfWeek, isActive, openMinute, closeMinute, capacity }) =>
        ({ dayOfWeek, isActive, openMinute, closeMinute, capacity }));
      await api.put('/professionals/schedule/me', { days: payload });
      setMsg('✅ Horario guardado');
    } catch (e: any) {
      const m = e.response?.data?.message;
      setMsg(Array.isArray(m) ? m.join(', ') : m || 'Error al guardar');
    } finally {
      setSaving(false);
    }
  };

  if (days.length === 0) return <Loader2 className="text-accent w-10 h-10 animate-spin" />;

  return (
    <div className="glass-card p-6 space-y-3 max-w-3xl">
      <div className="grid grid-cols-[130px_1fr_1fr_90px] gap-3 text-slate-500 text-[10px] font-bold uppercase tracking-wider">
        <span>Día</span><span>Apertura</span><span>Cierre</span><span>Simultáneas</span>
      </div>
      {days.map((d, i) => (
        <div key={i} className="grid grid-cols-[130px_1fr_1fr_90px] gap-3 items-center">
          <label className="flex items-center gap-2 text-white text-sm font-bold">
            <input type="checkbox" checked={d.isActive} onChange={(e) => update(i, { isActive: e.target.checked })} />
            {DAYS[i]}
          </label>
          <input type="time" disabled={!d.isActive} value={toTime(d.openMinute)}
            onChange={(e) => update(i, { openMinute: toMin(e.target.value) })}
            className="bg-white/5 border border-white/10 rounded-xl py-2 px-3 text-white disabled:opacity-30" />
          <input type="time" disabled={!d.isActive} value={toTime(d.closeMinute)}
            onChange={(e) => update(i, { closeMinute: toMin(e.target.value) })}
            className="bg-white/5 border border-white/10 rounded-xl py-2 px-3 text-white disabled:opacity-30" />
          <input type="number" min={1} disabled={!d.isActive} value={d.capacity}
            onChange={(e) => update(i, { capacity: Math.max(1, Number(e.target.value)) })}
            className="bg-white/5 border border-white/10 rounded-xl py-2 px-3 text-white disabled:opacity-30" />
        </div>
      ))}
      <p className="text-slate-500 text-xs">
        Las citas duran lo que dura cada servicio. "Simultáneas" es cuántos clientes puede atender a la misma hora (1 = atención individual).
      </p>
      <div className="flex items-center gap-4">
        <button onClick={save} disabled={saving}
          className="bg-accent hover:bg-accent-dark text-white px-4 py-2 rounded-xl font-bold flex items-center gap-2">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Guardar horario
        </button>
        {msg && <span className="text-slate-400 text-sm">{msg}</span>}
      </div>
    </div>
  );
};

export default ScheduleEditor;