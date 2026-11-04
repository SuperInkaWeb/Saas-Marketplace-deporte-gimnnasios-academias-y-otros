import React, { useState, useEffect } from 'react';
import api from '../../api/api-client';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  UserCheck, 
  Clock, 
  Users, 
  CheckCircle, 
  Loader2, 
  ClipboardList, 
  RotateCcw, 
  Trash2,
  CalendarDays,
  Check,
  AlertCircle
} from 'lucide-react';
import { toast } from 'sonner';

import { Html5QrcodeScanner } from 'html5-qrcode';

// Lo mínimo que la planilla necesita de cada clase y reserva
interface PlanillaReservation {
  id: string;
  userId: string;
  status: string;
}
interface PlanillaClass {
  id: string;
  title: string;
  scheduledAt: string;
  reservations?: PlanillaReservation[];
}

interface AttendanceListModalProps {
  isOpen: boolean;
  onClose: () => void;
  classItem: any;
  onSuccess: () => void;
  allClasses?: any[];
}

const AttendanceListModal: React.FC<AttendanceListModalProps> = ({ 
  isOpen, 
  onClose, 
  classItem, 
  onSuccess,
  allClasses = []
}) => {
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [localReservations, setLocalReservations] = useState<any[]>([]);
  const [initialized, setInitialized] = useState(false);
  const [activeTab, setActiveTab] = useState<'list' | 'planilla' | 'scan'>('planilla'); // Default to Planilla to wow the manager!
  const [selectedWeekDate, setSelectedWeekDate] = useState<Date>(new Date());
  const [isScanning, setIsScanning] = useState(false);

  // Initialize local state when modal opens
  if (isOpen && !initialized && classItem?.reservations) {
    setLocalReservations(classItem.reservations);
    setInitialized(true);
  }
  if (!isOpen && initialized) {
    setInitialized(false);
    setLocalReservations([]);
    setIsScanning(false);
  }

  // Set the selected week date to the class date when modal is opened
  useEffect(() => {
    if (isOpen && classItem?.scheduledAt) {
      setSelectedWeekDate(new Date(classItem.scheduledAt));
    }
  }, [isOpen, classItem]);

  // QR code scanner hook
  useEffect(() => {
    if (isScanning && isOpen) {
      // Small timeout to ensure the DOM element is rendered
      const timer = setTimeout(() => {
        const scanner = new Html5QrcodeScanner(
          "qr-reader-el",
          { fps: 10, qrbox: { width: 250, height: 250 } },
          /* verbose= */ false
        );

        const onScanSuccess = async (decodedText: string) => {
          try {
            scanner.clear();
            setIsScanning(false);
            setActiveTab('planilla');
          } catch (e) {
            console.error(e);
          }
          
          // Find reservation matching decodedText
          const res = localReservations.find(r => 
            r.id.toLowerCase() === decodedText.toLowerCase() || 
            r.id.substring(0, 8).toLowerCase() === decodedText.substring(0, 8).toLowerCase()
          );

          if (res) {
            if (res.status === 'ATTENDED') {
              toast.error(`El atleta ${res.user?.name} ya asistió a esta clase`);
            } else {
              try {
                setLoadingId(res.id);
                await api.patch(`/classes/reservations/${res.id}/attend`);
                setLocalReservations(prev =>
                  prev.map(r => r.id === res.id ? { ...r, status: 'ATTENDED' } : r)
                );
                toast.success(`¡Asistencia marcada para ${res.user?.name}!`);
                onSuccess();
              } catch (err: any) {
                toast.error(err.response?.data?.message || 'Error al registrar asistencia');
              } finally {
                setLoadingId(null);
              }
            }
          } else {
            toast.error("Código de reserva no válido o no pertenece a esta clase");
          }
        };

        const onScanFailure = () => {
          // Fail silently
        };

        scanner.render(onScanSuccess, onScanFailure);

        return () => {
          try {
            scanner.clear();
          } catch (e) {
            console.error("Error clearing scanner:", e);
          }
        };
      }, 300);

      return () => clearTimeout(timer);
    }
  }, [isScanning, isOpen, localReservations]);

  const handlePrevWeek = () => {
    const newDate = new Date(selectedWeekDate);
    newDate.setDate(selectedWeekDate.getDate() - 7);
    setSelectedWeekDate(newDate);
  };

  const handleNextWeek = () => {
    const newDate = new Date(selectedWeekDate);
    newDate.setDate(selectedWeekDate.getDate() + 7);
    setSelectedWeekDate(newDate);
  };

  const handleMarkPresent = async (reservationId: string) => {
    try {
      setLoadingId(reservationId);
      await api.patch(`/classes/reservations/${reservationId}/attend`);
      
      // Update local state immediately (optimistic UI)
      setLocalReservations(prev =>
        prev.map(r => r.id === reservationId ? { ...r, status: 'ATTENDED' } : r)
      );
      
      toast.success('¡Asistencia marcada!');
      onSuccess(); // Refresh parent
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Error al marcar asistencia');
    } finally {
      setLoadingId(null);
    }
  };

  const handleUnmarkPresent = async (reservationId: string) => {
    try {
      setLoadingId(reservationId);
      await api.patch(`/classes/reservations/${reservationId}/unattend`);
      setLocalReservations(prev => prev.map(r => r.id === reservationId ? { ...r, status: 'CONFIRMED' } : r));
      toast.success('Asistencia revertida');
      onSuccess();
    } catch (err: any) {
      toast.error('Error al revertir asistencia');
    } finally {
      setLoadingId(null);
    }
  };

  const handleRemoveReservation = async (reservationId: string) => {
    if (!window.confirm('¿Seguro que deseas eliminar esta reserva? El cupo quedará libre.')) return;
    try {
      setLoadingId(reservationId);
      await api.delete(`/classes/reservations/${reservationId}`);
      setLocalReservations(prev => prev.filter(r => r.id !== reservationId));
      toast.success('Reserva eliminada correctamente');
      onSuccess();
    } catch (err: any) {
      toast.error('Error al eliminar reserva');
    } finally {
      setLoadingId(null);
    }
  };

  const confirmed = localReservations.filter(r => r.status === 'CONFIRMED' && (!r.user?.role || r.user?.role === 'USER'));
  const attended = localReservations.filter(r => r.status === 'ATTENDED' && (!r.user?.role || r.user?.role === 'USER'));

  // ── Dynamic Production-Ready Weekly Calendar Generator ──
  const classDate = selectedWeekDate;
  
  // Calculate Monday of the current class week
  const getMonday = (d: Date) => {
    const date = new Date(d);
    const day = date.getDay();
    const diff = date.getDate() - day + (day === 0 ? -6 : 1); // Adjust for Sunday
    return new Date(date.setDate(diff));
  };
  
  const monday = getMonday(classDate);

  // Generate 7 days (Lunes a Domingo) for the actual week of this class (supports December and beyond!)
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return {
      name: d.toLocaleDateString('es-ES', { weekday: 'short' }), // lun, mar, mié...
      dateString: d.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' }), // 18/05
      dayIndex: d.getDay() === 0 ? 7 : d.getDay(), // 1 for Monday to 7 for Sunday
      fullDate: d
    };
  });

  // Calculate the dates in this week to query the database/classes list dynamically
  const weekStart = new Date(monday);
  weekStart.setHours(0, 0, 0, 0);

  const weekEnd = new Date(monday);
  weekEnd.setDate(monday.getDate() + 6);
  weekEnd.setHours(23, 59, 59, 999);

  // Fetch actual classes scheduled in this same week for this academy
  const weekClasses = allClasses.filter((c: any) => {
    const schedDate = new Date(c.scheduledAt);
    return (
      c.gymId === classItem?.gymId &&
      schedDate >= weekStart &&
      schedDate <= weekEnd
    );
  });

  // If no other classes were fetched or found, fallback to the current classItem so it remains functional
  const activeWeekClasses = weekClasses.length > 0 ? weekClasses : [classItem];

  // Lunes = 1 ... Domingo = 7
  const getDayIndex = (d: Date) => (d.getDay() === 0 ? 7 : d.getDay());

  // Todas las clases de un día de la semana, ordenadas por hora.
  // Antes se usaba find() y solo aparecía la primera clase del día.
  const classesOnDay = (dayIndex: number) =>
    activeWeekClasses
      .filter((c: PlanillaClass) => c && getDayIndex(new Date(c.scheduledAt)) === dayIndex)
      .sort((a: PlanillaClass, b: PlanillaClass) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime());

  const formatTime = (iso: string) =>
    new Date(iso).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit', hour12: false });

  // Clases reservadas y asistidas por el atleta en toda la semana
  const weekStatsFor = (userId: string) => {
    let booked = 0;
    let attended = 0;
    activeWeekClasses.forEach((c: PlanillaClass) => {
      c?.reservations?.forEach((r: PlanillaReservation) => {
        if (r.userId !== userId) return;
        booked++;
        if (r.status === 'ATTENDED') attended++;
      });
    });
    return { booked, attended };
  };

  const getLocalDateString = (d: Date) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const getWeekReservations = () => {
    const weekRes: any[] = [];
    const seenUserIds = new Set<string>();
    
    weekClasses.forEach((c: any) => {
      c.reservations?.forEach((r: any) => {
        const isAthlete = !r.user?.role || r.user?.role === 'USER';
        if (r.userId && isAthlete && !seenUserIds.has(r.userId)) {
          seenUserIds.add(r.userId);
          weekRes.push(r);
        }
      });
    });
    
    const fallbackReservations = localReservations.filter(r => !r.user?.role || r.user?.role === 'USER');
    return weekRes.length > 0 ? weekRes : fallbackReservations;
  };
  
  const displayReservations = getWeekReservations();
  const total = displayReservations.length;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
          />

          {/* Modal Container with Dynamic width */}
          <motion.div
            initial={{ opacity: 0, scale: 0.97, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: 20 }}
            transition={{ type: 'spring', stiffness: 350, damping: 28 }}
            className={`relative bg-gradient-to-b from-slate-900 to-slate-950 border border-white/10 rounded-3xl w-full shadow-2xl overflow-hidden transition-all duration-300 ${
              activeTab === 'planilla' ? 'max-w-5xl' : 'max-w-md'
            }`}
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-indigo-900/20 via-slate-900 to-slate-950 border-b border-white/5 p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="bg-primary/20 p-2.5 rounded-2xl border border-primary/30">
                    <CalendarDays className="w-5 h-5 text-primary-light" />
                  </div>
                  <div>
                    <h2 className="text-white font-bold text-lg leading-tight flex items-center gap-2">
                      Control de Asistencia Semanal
                      <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full uppercase tracking-wider font-mono">En Vivo</span>
                    </h2>
                    <p className="text-slate-400 text-xs mt-0.5">{classItem?.title} • {classItem?.gym?.name}</p>
                  </div>
                </div>
                <button onClick={onClose} className="text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 p-2 rounded-xl transition-all">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Tabs Switcher - Gorgeous glass pill look */}
              <div className="flex bg-slate-950/80 p-1 rounded-xl border border-white/5 w-fit mt-5 gap-1 flex-wrap">
                <button
                  onClick={() => { setActiveTab('planilla'); setIsScanning(false); }}
                  className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                    activeTab === 'planilla'
                      ? 'bg-primary text-white shadow-lg'
                      : 'text-slate-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <CalendarDays className="w-3.5 h-3.5" />
                  📅 Planilla de Asistencia (Lunes a Domingo)
                </button>
                <button
                  onClick={() => { setActiveTab('list'); setIsScanning(false); }}
                  className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                    activeTab === 'list'
                      ? 'bg-primary text-white shadow-lg'
                      : 'text-slate-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <ClipboardList className="w-3.5 h-3.5" />
                  📋 Vista de Lista Rápida
                </button>
                <button
                  onClick={() => { setActiveTab('scan'); setIsScanning(true); }}
                  className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                    activeTab === 'scan'
                      ? 'bg-primary text-white shadow-lg'
                      : 'text-slate-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
                  📷 Escanear Ticket QR
                </button>
              </div>
            </div>

            {/* Content Area */}
            <div className="p-6">
              {/* Tab 1: PLANILLA SEMANAL DE LUNES A DOMINGO */}
              {activeTab === 'planilla' && (
                <div className="space-y-6 animate-in fade-in duration-300">
                  
                  {/* Real-time Calendar Week Navigator */}
                  <div className="flex flex-col sm:flex-row items-center justify-between bg-slate-950/40 border border-white/5 p-4 rounded-2xl gap-4">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={handlePrevWeek}
                        className="px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white rounded-xl text-xs font-bold transition-all active:scale-95 flex items-center gap-1"
                      >
                        ◀ Sem. Anterior
                      </button>
                      
                      <div className="bg-slate-900 border border-white/5 px-4 py-1.5 rounded-xl text-center min-w-[200px]">
                        <span className="text-xs font-bold text-indigo-400 block uppercase tracking-wider text-[9px] font-mono">Semana Activa</span>
                        <span className="text-xs text-white font-bold mt-0.5 inline-block">
                          {monday.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })} - {weekDays[6].fullDate.toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </span>
                      </div>
                      
                      <button
                        onClick={handleNextWeek}
                        className="px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white rounded-xl text-xs font-bold transition-all active:scale-95 flex items-center gap-1"
                      >
                        Sem. Siguiente ▶
                      </button>
                    </div>
                    
                    <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
                      <span className="text-slate-400 text-xs font-medium">Ir a Fecha:</span>
                      <input 
                        type="date"
                        value={getLocalDateString(selectedWeekDate)}
                        onChange={(e) => {
                          if (e.target.value) {
                            setSelectedWeekDate(new Date(e.target.value + 'T12:00:00')); // Avoid timezone offset bugs
                          }
                        }}
                        className="bg-slate-900 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white font-bold outline-none cursor-pointer hover:border-primary/50 transition-all w-36"
                      />
                    </div>
                  </div>

                  {/* Legend / Info card */}
                  <div className="bg-slate-950/50 border border-white/5 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs">
                    <div className="flex items-center gap-2 text-slate-400">
                      <AlertCircle className="w-4 h-4 text-indigo-400" />
                      <span>Planilla en tiempo real. Usa los controles superiores de calendario para navegar entre semanas de todo el año.</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1">
                        <span className="w-2.5 h-2.5 rounded bg-green-500/20 border border-green-500/30 inline-block" />
                        <span className="text-slate-400 text-[10px]">Asistió</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="w-2.5 h-2.5 rounded bg-yellow-500/20 border border-yellow-500/30 inline-block" />
                        <span className="text-slate-400 text-[10px]">Pendiente</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="w-2.5 h-2.5 rounded bg-slate-800 border border-white/5 inline-block" />
                        <span className="text-slate-400 text-[10px]">Sin Clase</span>
                      </div>
                    </div>
                  </div>

                  {total === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 text-center">
                      <Users className="w-12 h-12 text-slate-700 mb-3" />
                      <p className="text-slate-400 font-medium">Nadie ha reservado clases para esta semana aún.</p>
                      <p className="text-slate-600 text-xs mt-1">Usa los controles superiores para volver a la semana de clases activas.</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto border border-white/5 rounded-2xl bg-slate-950/30">
                      <table className="w-full text-left border-collapse min-w-[700px]">
                        <thead>
                          <tr className="border-b border-white/5 bg-slate-950/50 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                            <th className="p-4 pl-6 w-56">Atleta</th>
                            {weekDays.map(day => {
                              // Todas las clases del día (antes solo se tomaba la primera)
                              const dayClasses = classesOnDay(day.dayIndex);

                              return (
                                <th key={day.dayIndex} className={`p-4 text-center ${dayClasses.length ? 'bg-indigo-600/5' : ''}`}>
                                  <div className="flex flex-col items-center">
                                    <span className="capitalize text-xs text-white">{day.name}</span>
                                    <span className="text-[10px] text-slate-500 font-mono mt-0.5">{day.dateString}</span>
                                    {dayClasses.length > 0 && (
                                      <span className="mt-1 px-1.5 py-0.5 rounded bg-indigo-500/10 text-[8px] text-indigo-400 font-black uppercase tracking-widest border border-indigo-500/10">
                                        {dayClasses.length === 1 ? '1 clase' : `${dayClasses.length} clases`}
                                      </span>
                                    )}
                                  </div>
                                </th>
                              );
                            })}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5 text-xs text-slate-300">
                          {displayReservations.map(reservation => {
                            const week = weekStatsFor(reservation.userId);
                            const isAttended = week.attended > 0;

                            return (
                              <tr key={reservation.id} className="hover:bg-white/5 transition-all">
                                {/* Name column */}
                                <td className="p-4 pl-6">
                                  <div className="flex items-center gap-3">
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs border ${
                                      isAttended ? 'bg-green-500/10 border-green-500/30 text-green-400' : 'bg-slate-900 border-white/10 text-primary-light'
                                    }`}>
                                      {reservation.user?.name?.charAt(0)?.toUpperCase() || '?'}
                                    </div>
                                    <div>
                                      <p className="text-white font-bold text-sm leading-tight">{reservation.user?.name}</p>
                                      <p className="text-[9px] text-slate-500 font-mono mt-0.5">DNI: {reservation.user?.dni || 'N/A'}</p>
                                      <p className="text-[9px] text-slate-400 mt-0.5">
                                        {week.booked === 1 ? '1 clase' : `${week.booked} clases`} · {week.attended} {week.attended === 1 ? 'asistida' : 'asistidas'}
                                      </p>
                                    </div>
                                  </div>
                                </td>

                                {/* Monday to Sunday Columns */}
                                {weekDays.map(day => {
                                  const dayClasses = classesOnDay(day.dayIndex);

                                  // No hay clases este día
                                  if (dayClasses.length === 0) {
                                    return (
                                      <td key={day.dayIndex} className="p-4 text-center text-slate-600 font-mono text-sm">
                                        -
                                      </td>
                                    );
                                  }

                                  // Reservas del atleta en cada clase del día, en orden de hora
                                  const bookings = dayClasses
                                    .map((c: PlanillaClass) => ({
                                      cls: c,
                                      res: c.reservations?.find((r: PlanillaReservation) => r.userId === reservation.userId),
                                    }))
                                    .filter((b): b is { cls: PlanillaClass; res: PlanillaReservation } => Boolean(b.res));

                                  // Hay clases, pero el atleta no reservó ninguna
                                  if (bookings.length === 0) {
                                    return (
                                      <td key={day.dayIndex} className="p-4 text-center">
                                        <div className="flex justify-center">
                                          <span className="inline-flex items-center gap-1 bg-slate-800 text-slate-500 border border-white/5 px-2 py-1 rounded-full text-[9px] font-bold">
                                            Sin reserva
                                          </span>
                                        </div>
                                      </td>
                                    );
                                  }

                                  // Una ficha por clase reservada: hora, título y estado
                                  return (
                                    <td key={day.dayIndex} className="p-2 text-center bg-indigo-600/5 align-top">
                                      <div className="flex flex-col items-center gap-1.5">
                                        {bookings.map(({ cls, res }) => {
                                          const resAttended = res.status === 'ATTENDED';
                                          const cellIsLoading = loadingId === res.id;
                                          const label = `${formatTime(cls.scheduledAt)} · ${cls.title}`;

                                          return resAttended ? (
                                            <button
                                              key={res.id}
                                              onClick={() => handleUnmarkPresent(res.id)}
                                              disabled={loadingId !== null}
                                              className="w-full max-w-[120px] flex flex-col items-center bg-green-500/20 hover:bg-red-500/20 text-green-400 hover:text-red-400 border border-green-500/30 hover:border-red-500/30 px-2 py-1 rounded-xl text-[10px] font-bold transition-all"
                                              title={`${label}. Haga clic para deshacer asistencia`}
                                            >
                                              <span className="text-[9px] font-mono opacity-80 truncate w-full">{label}</span>
                                              <span className="flex items-center gap-1">
                                                {cellIsLoading ? <Loader2 className="w-3 animate-spin" /> : <Check className="w-3 h-3" />}
                                                Asistió
                                              </span>
                                            </button>
                                          ) : (
                                            <button
                                              key={res.id}
                                              onClick={() => handleMarkPresent(res.id)}
                                              disabled={loadingId !== null}
                                              className="w-full max-w-[120px] flex flex-col items-center bg-yellow-500/10 hover:bg-primary/20 text-yellow-500 hover:text-white border border-yellow-500/20 hover:border-primary/30 px-2 py-1 rounded-xl text-[10px] font-bold transition-all shadow-md active:scale-95"
                                              title={`${label}. Haga clic para marcar asistencia`}
                                            >
                                              <span className="text-[9px] font-mono opacity-80 truncate w-full">{label}</span>
                                              <span className="flex items-center gap-1">
                                                {cellIsLoading ? <Loader2 className="w-3 animate-spin" /> : <UserCheck className="w-3 h-3" />}
                                                Pendiente
                                              </span>
                                            </button>
                                          );
                                        })}
                                      </div>
                                    </td>
                                  );
                                })}
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* Tab 2: LISTA DE ASISTENCIA RÁPIDA (VISTA ORIGINAL) */}
              {activeTab === 'list' && (
                <div className="animate-in fade-in duration-300 max-w-md mx-auto">
                  {/* Progress Stats bar */}
                  <div className="flex items-center justify-between bg-slate-950/50 border border-white/5 p-4 rounded-2xl mb-4">
                    <div className="flex items-center gap-1.5 text-xs">
                      <Users className="w-3.5 h-3.5 text-slate-400" />
                      <span className="text-slate-400">{localReservations.length} reservados</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs">
                      <CheckCircle className="w-3.5 h-3.5 text-green-400" />
                      <span className="text-green-400 font-bold">{attended.length} presentes</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs">
                      <Clock className="w-3.5 h-3.5 text-yellow-400" />
                      <span className="text-yellow-400">{confirmed.length} pendientes</span>
                    </div>
                  </div>

                  {localReservations.length > 0 && (
                    <div className="bg-slate-950 h-2 rounded-full overflow-hidden border border-white/5 mb-6">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${(attended.length / localReservations.length) * 100}%` }}
                        transition={{ duration: 0.8, ease: 'easeOut' }}
                        className="h-full bg-gradient-to-r from-green-500 to-green-400 rounded-full"
                      />
                    </div>
                  )}

                  {/* List Container */}
                  <div className="max-h-[300px] overflow-y-auto divide-y divide-white/5 border border-white/5 rounded-2xl bg-slate-950/30">
                    {localReservations.filter(r => !r.user?.role || r.user?.role === 'USER').length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-12 text-center px-6">
                        <Users className="w-10 h-10 text-slate-700 mb-3" />
                        <p className="text-slate-400 font-medium">Nadie ha reservado esta clase aún.</p>
                      </div>
                    ) : (
                      localReservations
                        .filter(r => !r.user?.role || r.user?.role === 'USER')
                        .map(reservation => {
                        const isAttended = reservation.status === 'ATTENDED';
                        const isLoading = loadingId === reservation.id;

                        return (
                          <div
                            key={reservation.id}
                            className={`flex items-center justify-between p-4 transition-colors ${
                              isAttended ? 'bg-green-500/5' : 'hover:bg-white/5'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold border ${
                                isAttended 
                                  ? 'bg-green-500/20 border-green-500/30 text-green-400' 
                                  : 'bg-slate-800 border-white/10 text-primary-light'
                              }`}>
                                {reservation.user?.name?.charAt(0)?.toUpperCase() || '?'}
                              </div>
                              <div>
                                <p className="text-white font-medium text-sm leading-tight">
                                  {reservation.user?.name || 'Atleta'}
                                </p>
                                <p className={`text-xs font-semibold mt-0.5 ${isAttended ? 'text-green-400' : 'text-yellow-400'}`}>
                                  {isAttended ? '✅ Asistió' : '⏳ Pendiente'}
                                </p>
                              </div>
                            </div>

                            {/* Action Button */}
                            <div className="flex items-center gap-2">
                              {isAttended ? (
                                <div 
                                  className="flex items-center gap-1.5 bg-green-500/10 border border-green-500/20 px-3 py-1.5 rounded-lg group cursor-pointer" 
                                  onClick={() => handleUnmarkPresent(reservation.id)} 
                                  title="Clic para deshacer"
                                >
                                  {isLoading ? <Loader2 className="w-4 h-4 animate-spin text-green-400" /> : <CheckCircle className="w-4 h-4 text-green-400 group-hover:hidden" />}
                                  {!isLoading && <RotateCcw className="w-4 h-4 text-green-400 hidden group-hover:block" />}
                                  <span className="text-green-400 text-xs font-bold group-hover:hidden">Presente</span>
                                  <span className="text-green-400 text-xs font-bold hidden group-hover:block">Deshacer</span>
                                </div>
                              ) : (
                                <button
                                  onClick={() => handleMarkPresent(reservation.id)}
                                  disabled={isLoading}
                                  className="flex items-center gap-1.5 bg-primary hover:bg-primary-dark text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-all active:scale-95 disabled:opacity-50"
                                >
                                  {isLoading ? (
                                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                  ) : (
                                    <UserCheck className="w-3.5 h-3.5" />
                                  )}
                                  {isLoading ? 'Guardando...' : 'Presente'}
                                </button>
                              )}
                              {!isAttended && (
                                <button
                                  onClick={() => handleRemoveReservation(reservation.id)}
                                  disabled={isLoading}
                                  className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                                  title="Eliminar reserva"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              )}
              {activeTab === 'scan' && (
                <div className="animate-in fade-in duration-300 max-w-md mx-auto text-center space-y-4">
                  <div className="bg-slate-950/50 border border-white/5 rounded-2xl p-6 relative overflow-hidden text-left">
                    <h3 className="text-white font-bold text-base mb-2">Escáner de Tickets QR de Asistencia</h3>
                    <p className="text-slate-400 text-xs mb-4">
                      Apunta al código QR generado en el celular del atleta.
                    </p>
                    
                    {/* Scanner Element */}
                    <div className="bg-slate-900 border border-white/10 rounded-2xl overflow-hidden min-h-[300px] flex items-center justify-center relative">
                      {isScanning ? (
                        <div id="qr-reader-el" className="w-full text-slate-800" />
                      ) : (
                        <div className="p-6 text-center text-slate-500">
                          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2 text-primary" />
                          <p className="text-sm">Iniciando cámara...</p>
                        </div>
                      )}
                    </div>
                    
                    {/* Manual Input Fallback */}
                    <div className="mt-6 pt-6 border-t border-white/5 space-y-3">
                      <p className="text-slate-500 text-xs">¿Problemas con la cámara? Digita el ID de la reserva manualmente:</p>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="Ej: f4d3e2b1"
                          id="manual-qr-input"
                          className="bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:border-primary outline-none flex-grow font-mono"
                        />
                        <button
                          onClick={async () => {
                            const inputEl = document.getElementById('manual-qr-input') as HTMLInputElement;
                            const val = inputEl?.value?.trim();
                            if (!val) return toast.error('Ingresa un código');
                            
                            // Find the reservation
                            const res = localReservations.find(r => 
                              r.id.toLowerCase().includes(val.toLowerCase())
                            );
                            
                            if (res) {
                              if (res.status === 'ATTENDED') {
                                toast.error(`El atleta ${res.user?.name} ya asistió`);
                              } else {
                                try {
                                  setLoadingId(res.id);
                                  await api.patch(`/classes/reservations/${res.id}/attend`);
                                  setLocalReservations(prev =>
                                    prev.map(r => r.id === res.id ? { ...r, status: 'ATTENDED' } : r)
                                  );
                                  toast.success(`Asistencia registrada para ${res.user?.name}`);
                                  if (inputEl) inputEl.value = '';
                                  onSuccess();
                                  setActiveTab('planilla');
                                } catch (err: any) {
                                  toast.error(err.response?.data?.message || 'Error al registrar asistencia');
                                } finally {
                                  setLoadingId(null);
                                }
                              }
                            } else {
                              toast.error('No se encontró ninguna reserva coincidente.');
                            }
                          }}
                          className="bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded-xl text-xs font-bold transition-all active:scale-95"
                        >
                          Validar
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="border-t border-white/5 p-5 bg-slate-950/60 flex justify-end">
              <button
                onClick={onClose}
                className="bg-slate-800 hover:bg-slate-700 text-slate-200 py-2.5 px-6 rounded-xl font-bold transition-colors text-sm border border-white/5"
              >
                Cerrar Planilla
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default AttendanceListModal;
