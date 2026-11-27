import React, { useState, useEffect } from 'react';
import api from '../../../api/api-client';
import {
  X, User, Mail, Phone, CreditCard, Shield, Building, Dumbbell, Star, Clock,
  Calendar, MapPin, CheckCircle, XCircle, Package, BookOpen,
  Award, Loader2, Activity, Home, ShoppingBag, type LucideIcon,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface UserProfileModalProps {
  userId: string | null;
  onClose: () => void;
}

// GET /users/:id/profile (getUserProfile en users.service.ts). roleData cambia según el rol.
// Ojo: varios nombres que usa esta pantalla no coinciden con lo que manda el backend
// (marcados abajo con "no llega"); en pantalla salen vacíos o con "—".
interface ProfileGym {
  id: string;
  name: string;
  city?: string | null;
  district?: string | null;
  _count?: { classes: number; orders: number };
}

interface ProfileService {
  id: string;
  title: string;
  price: number | string;
  type?: string; // no llega: el backend lo manda como serviceType
  district?: string; // no llega
  maxClients?: number; // no llega
}

interface ProfileMembership {
  status: string;
  startDate?: string; // no llega: el backend manda startedAt
  endDate?: string; // no llega: el backend manda expiresAt
  plan?: { name: string; gym?: { name: string } | null } | null;
}

interface ProfileReservation {
  id: string;
  status: string;
  createdAt?: string; // no llega: el backend manda bookedAt
  class?: { title: string; gym?: { name: string; district?: string | null } | null } | null;
}

interface ProfileTrainer {
  bio?: string | null;
  specialties?: string[];
  experienceYears?: number;
  hourlyRate?: number | string | null;
  // Decimal en la BD: llega como texto ("4.50"), no como número.
  rating?: number | string;
}

interface UserProfile {
  name: string;
  email: string;
  role: string;
  phone?: string | null;
  dni?: string | null;
  avatarUrl?: string | null;
  isActive?: boolean;
  emailVerified?: boolean;
  lastLoginAt?: string | null;
  createdAt: string;
  // Cada lista solo llega para su rol (gyms: dueño, services: coach,
  // memberships/reservations: atleta) y la pantalla solo la lee en la sección de ese rol.
  roleData: {
    gyms: ProfileGym[];
    services: ProfileService[];
    memberships: ProfileMembership[];
    reservations: ProfileReservation[];
    profile?: ProfileTrainer | null;
    stats?: {
      totalGyms?: number;
      totalOrders?: number;
      totalServices?: number;
      bookings?: number;
      orders?: number;
      totalReservations?: number;
      usersCreated?: number;
      gymsTotal?: number;
    };
  };
}

const ROLE_CFG: Record<string, { label: string; icon: LucideIcon; color: string; bg: string }> = {
  ADMIN:     { label: 'Administrador', icon: Shield,   color: 'text-red-400',    bg: 'bg-red-500/10 border-red-500/30' },
  GYM_OWNER: { label: 'Dueño',         icon: Building, color: 'text-blue-400',   bg: 'bg-blue-500/10 border-blue-500/30' },
  TRAINER:   { label: 'Coach',          icon: Star,     color: 'text-yellow-400', bg: 'bg-yellow-500/10 border-yellow-500/30' },
  USER:      { label: 'Atleta',         icon: Dumbbell, color: 'text-green-400',  bg: 'bg-green-500/10 border-green-500/30' },
};

const STATUS_CFG: Record<string, string> = {
  CONFIRMED: 'text-green-400',
  CANCELLED: 'text-red-400',
  ATTENDED:  'text-blue-400',
  NO_SHOW:   'text-slate-500',
  ACTIVE:    'text-green-400',
  EXPIRED:   'text-red-400',
  PAUSED:    'text-yellow-400',
};

const fmt = (d: string | null | undefined) => d
  ? new Date(d).toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' })
  : '—';

const fmtFull = (d: string | null | undefined) => d
  ? new Date(d).toLocaleString('es-PE', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
  : 'Nunca';

const StatCard: React.FC<{ icon: React.ElementType; label: string; value: string | number; color?: string }> = ({
  icon: Icon, label, value, color = 'text-primary-light'
}) => (
  <div className="bg-slate-900/60 border border-white/5 rounded-xl p-4 flex items-center gap-3">
    <div className={`p-2.5 rounded-xl bg-slate-800 ${color}`}>
      <Icon className="w-5 h-5" />
    </div>
    <div>
      <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">{label}</p>
      <p className={`text-xl font-bold ${color}`}>{value}</p>
    </div>
  </div>
);

const UserProfileModal: React.FC<UserProfileModalProps> = ({ userId, onClose }) => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!userId) return;
    setLoading(true);
    setProfile(null);
    api.get<UserProfile>(`/users/${userId}/profile`)
      .then(({ data }) => setProfile(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [userId]);

  const cfg = profile ? (ROLE_CFG[profile.role] || ROLE_CFG.USER) : null;

  return (
    <AnimatePresence>
      {userId && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
          />

          {/* Panel */}
          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 24 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 24 }}
            transition={{ type: 'spring', damping: 22, stiffness: 300 }}
            className="relative z-10 w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-slate-900 border border-white/10 rounded-2xl shadow-2xl"
          >
            {/* Header */}
            <div className="sticky top-0 z-10 flex items-center justify-between p-5 border-b border-white/10 bg-slate-900/95 backdrop-blur-md">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <User className="w-5 h-5 text-primary-light" /> Perfil de Usuario
              </h2>
              <button
                onClick={onClose}
                className="p-2 text-slate-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="p-6">
              {loading && (
                <div className="flex justify-center py-20">
                  <Loader2 className="w-8 h-8 text-primary animate-spin" />
                </div>
              )}

              {!loading && profile && cfg && (
                <div className="space-y-6">
                  {/* Avatar + Info básica */}
                  <div className="flex items-start gap-5">
                    {profile.avatarUrl ? (
                      <img src={profile.avatarUrl} alt={profile.name}
                        className="w-20 h-20 rounded-2xl object-cover border border-white/10 flex-shrink-0" />
                    ) : (
                      <div className="w-20 h-20 rounded-2xl bg-slate-800 border border-white/10 flex items-center justify-center flex-shrink-0">
                        <span className="text-3xl font-bold text-primary-light">
                          {profile.name?.charAt(0)?.toUpperCase()}
                        </span>
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 flex-wrap">
                        <h3 className="text-2xl font-bold text-white truncate">{profile.name}</h3>
                        <span className={`flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-bold uppercase tracking-wider flex-shrink-0 ${cfg.color} ${cfg.bg}`}>
                          <cfg.icon className="w-3.5 h-3.5" />
                          {cfg.label}
                        </span>
                      </div>
                      <div className="mt-2 space-y-1 text-sm">
                        <p className="text-slate-400 flex items-center gap-1.5">
                          <Mail className="w-3.5 h-3.5 text-slate-600" /> {profile.email}
                        </p>
                        {profile.phone && (
                          <p className="text-slate-400 flex items-center gap-1.5">
                            <Phone className="w-3.5 h-3.5 text-slate-600" /> {profile.phone}
                          </p>
                        )}
                        {profile.dni && (
                          <p className="text-slate-400 flex items-center gap-1.5">
                            <CreditCard className="w-3.5 h-3.5 text-slate-600" /> DNI: {profile.dni}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Timeline */}
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="bg-slate-900/60 border border-white/5 rounded-xl p-3">
                      <p className="text-xs text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-1">
                        <Calendar className="w-3 h-3" /> Registrado
                      </p>
                      <p className="text-white font-semibold">{fmt(profile.createdAt)}</p>
                    </div>
                    <div className="bg-slate-900/60 border border-white/5 rounded-xl p-3">
                      <p className="text-xs text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-1">
                        <Clock className="w-3 h-3" /> Última Sesión
                      </p>
                      <p className={`font-semibold ${profile.lastLoginAt ? 'text-green-400' : 'text-slate-600 italic text-xs'}`}>
                        {fmtFull(profile.lastLoginAt)}
                      </p>
                    </div>
                  </div>

                  {/* Estado */}
                  <div className="flex items-center gap-3 text-sm">
                    {profile.isActive
                      ? <span className="flex items-center gap-1.5 text-green-400 bg-green-500/10 border border-green-500/20 px-3 py-1 rounded-full text-xs font-bold"><CheckCircle className="w-3.5 h-3.5" /> Cuenta Activa</span>
                      : <span className="flex items-center gap-1.5 text-red-400 bg-red-500/10 border border-red-500/20 px-3 py-1 rounded-full text-xs font-bold"><XCircle className="w-3.5 h-3.5" /> Cuenta Suspendida</span>
                    }
                    {profile.emailVerified && (
                      <span className="flex items-center gap-1.5 text-blue-400 bg-blue-500/10 border border-blue-500/20 px-3 py-1 rounded-full text-xs font-bold">
                        <CheckCircle className="w-3.5 h-3.5" /> Email Verificado
                      </span>
                    )}
                  </div>

                  <div className="border-t border-white/10 pt-4">
                    {/* ── GYM OWNER ────────────────────────────────────────── */}
                    {profile.role === 'GYM_OWNER' && profile.roleData && (
                      <div className="space-y-4">
                        <h4 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                          <Building className="w-4 h-4 text-blue-400" /> Datos como Dueño
                        </h4>
                        <div className="grid grid-cols-2 gap-3">
                          <StatCard icon={Building} label="Locales" value={profile.roleData.stats?.totalGyms ?? 0} color="text-blue-400" />
                          <StatCard icon={ShoppingBag} label="Órdenes Totales" value={profile.roleData.stats?.totalOrders ?? 0} color="text-purple-400" />
                        </div>
                        {profile.roleData.gyms?.length > 0 && (
                          <div className="space-y-2">
                            <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Locales Registrados</p>
                            {profile.roleData.gyms.map((g) => (
                              <div key={g.id} className="flex items-center justify-between bg-slate-900/60 border border-white/5 rounded-xl px-4 py-3">
                                <div>
                                  <p className="text-white font-semibold text-sm">{g.name}</p>
                                  <p className="text-slate-500 text-xs flex items-center gap-1 mt-0.5">
                                    <MapPin className="w-3 h-3" /> {g.district}, {g.city}
                                  </p>
                                </div>
                                <div className="text-right text-xs text-slate-500">
                                  <p><span className="text-white font-bold">{g._count?.classes ?? 0}</span> clases</p>
                                  <p><span className="text-white font-bold">{g._count?.orders ?? 0}</span> órdenes</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {/* ── TRAINER ──────────────────────────────────────────── */}
                    {profile.role === 'TRAINER' && profile.roleData && (
                      <div className="space-y-4">
                        <h4 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                          <Star className="w-4 h-4 text-yellow-400" /> Datos como Coach
                        </h4>
                        {profile.roleData.profile && (
                          <div className="bg-slate-900/60 border border-white/5 rounded-xl p-4 space-y-2 text-sm">
                            {profile.roleData.profile.bio && (
                              <p className="text-slate-300 italic">"{profile.roleData.profile.bio}"</p>
                            )}
                            <div className="flex flex-wrap gap-1.5 mt-2">
                              {profile.roleData.profile.specialties?.map((s: string) => (
                                <span key={s} className="px-2 py-0.5 bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 rounded-full text-xs">{s}</span>
                              ))}
                            </div>
                            <div className="grid grid-cols-3 gap-2 mt-3">
                              <div className="text-center">
                                <p className="text-yellow-400 font-bold text-lg">{/* OJO: rating llega como texto y el texto no tiene toFixed (ver PR F5d-2) */}
                                {(profile.roleData.profile.rating as number | undefined)?.toFixed(1) ?? '0.0'}</p>
                                <p className="text-slate-500 text-xs">Rating</p>
                              </div>
                              <div className="text-center">
                                <p className="text-white font-bold text-lg">{profile.roleData.profile.experienceYears ?? 0}</p>
                                <p className="text-slate-500 text-xs">Años Exp.</p>
                              </div>
                              <div className="text-center">
                                <p className="text-green-400 font-bold text-lg">S/.{profile.roleData.profile.hourlyRate ?? 0}</p>
                                <p className="text-slate-500 text-xs">Por hora</p>
                              </div>
                            </div>
                          </div>
                        )}
                        <div className="grid grid-cols-2 gap-3">
                          <StatCard icon={BookOpen} label="Servicios" value={profile.roleData.stats?.totalServices ?? 0} color="text-yellow-400" />
                          <StatCard icon={Award} label="Reservas" value={profile.roleData.stats?.bookings ?? 0} color="text-green-400" />
                        </div>
                        {profile.roleData.services?.length > 0 && (
                          <div className="space-y-2">
                            <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Servicios Ofrecidos</p>
                            {profile.roleData.services.map((s) => (
                              <div key={s.id} className="flex items-center justify-between bg-slate-900/60 border border-white/5 rounded-xl px-4 py-3">
                                <div>
                                  <p className="text-white font-semibold text-sm">{s.title}</p>
                                  <p className="text-slate-500 text-xs mt-0.5">{s.type?.replace('_', ' ')} · {s.district}</p>
                                </div>
                                <div className="text-right text-xs">
                                  <p className="text-green-400 font-bold">S/.{s.price}</p>
                                  <p className="text-slate-500">Máx. {s.maxClients} clientes</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {/* ── ATLETA ───────────────────────────────────────────── */}
                    {profile.role === 'USER' && profile.roleData && (
                      <div className="space-y-4">
                        <h4 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                          <Dumbbell className="w-4 h-4 text-green-400" /> Datos como Atleta
                        </h4>
                        <div className="grid grid-cols-2 gap-3">
                          <StatCard icon={Activity} label="Reservas" value={profile.roleData.stats?.totalReservations ?? 0} color="text-green-400" />
                          <StatCard icon={Package} label="Órdenes" value={profile.roleData.stats?.orders ?? 0} color="text-purple-400" />
                        </div>
                        {profile.roleData.memberships?.length > 0 && (
                          <div className="space-y-2">
                            <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Membresías</p>
                            {profile.roleData.memberships.map((m, i) => (
                              <div key={i} className="flex items-center justify-between bg-slate-900/60 border border-white/5 rounded-xl px-4 py-3">
                                <div>
                                  <p className="text-white font-semibold text-sm">{m.plan?.name}</p>
                                  <p className="text-slate-500 text-xs mt-0.5">{m.plan?.gym?.name}</p>
                                </div>
                                <div className="text-right">
                                  <span className={`text-xs font-bold ${STATUS_CFG[m.status] || 'text-slate-400'}`}>
                                    {m.status}
                                  </span>
                                  <p className="text-slate-600 text-xs">{fmt(m.startDate)} – {fmt(m.endDate)}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                        {profile.roleData.reservations?.length > 0 && (
                          <div className="space-y-2">
                            <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Últimas Clases Reservadas</p>
                            {profile.roleData.reservations.map((r) => (
                              <div key={r.id} className="flex items-center justify-between bg-slate-900/60 border border-white/5 rounded-xl px-4 py-3">
                                <div>
                                  <p className="text-white font-semibold text-sm">{r.class?.title}</p>
                                  <p className="text-slate-500 text-xs mt-0.5 flex items-center gap-1">
                                    <Home className="w-3 h-3" /> {r.class?.gym?.name} · {r.class?.gym?.district}
                                  </p>
                                </div>
                                <div className="text-right">
                                  <span className={`text-xs font-bold ${STATUS_CFG[r.status] || 'text-slate-400'}`}>{r.status}</span>
                                  <p className="text-slate-600 text-xs">{fmt(r.createdAt)}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                        {profile.roleData.reservations?.length === 0 && profile.roleData.memberships?.length === 0 && (
                          <p className="text-center text-slate-600 italic text-sm py-4">Este atleta aún no tiene actividad registrada.</p>
                        )}
                      </div>
                    )}

                    {/* ── ADMIN ────────────────────────────────────────────── */}
                    {profile.role === 'ADMIN' && profile.roleData && (
                      <div className="space-y-4">
                        <h4 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                          <Shield className="w-4 h-4 text-red-400" /> Vista de Plataforma
                        </h4>
                        <div className="grid grid-cols-2 gap-3">
                          <StatCard icon={User} label="Usuarios Totales" value={profile.roleData.stats?.usersCreated ?? 0} color="text-red-400" />
                          <StatCard icon={Building} label="Gimnasios Totales" value={profile.roleData.stats?.gymsTotal ?? 0} color="text-blue-400" />
                        </div>
                        <p className="text-center text-slate-500 text-sm italic">Cuenta de administrador de la plataforma Hercix.</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default UserProfileModal;
