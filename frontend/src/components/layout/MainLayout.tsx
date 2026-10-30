import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import api from '../../api/api-client';
import { useAuth } from '../../context/auth-context';
import { toast } from 'sonner';
import {
  LayoutDashboard,
  Calendar,
  ShoppingBag,
  LogOut,
  Menu,
  X,
  CreditCard,
  Users,
  Map,
  Trophy,
  Activity,
  Bell,
  Building2,
  MessageSquare
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import AIChatWidget from '../ai/AIChatWidget';
import { CompleteProfileModal } from '../auth/CompleteProfileModal';

interface SidebarItemProps {
  to: string;
  icon: any;
  label: string;
  active: boolean;
  onClick?: () => void;
}

const SidebarItem: React.FC<SidebarItemProps> = ({ to, icon: Icon, label, active, onClick }) => (
  <Link
    to={to}
    onClick={onClick}
    className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${active
        ? 'bg-primary text-white shadow-lg shadow-primary/20'
        : 'text-slate-400 hover:bg-white/5 hover:text-white'
      }`}
  >
    <Icon className="w-5 h-5" />
    <span className="font-medium">{label}</span>
  </Link>
);

const MainLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, logout, switchUserRole } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  const [notifications, setNotifications] = useState<any[]>([]);
  const prevNotificationsCount = useRef(0);
  const [activePlan, setActivePlan] = useState<any | null>(null);

  // El panel de Superadmin solo se abre desde /admin: "Administrador" aparece en el selector
  // únicamente mientras ya es la vista activa (para poder salir de ella), nunca para entrar.
  const switchableRoles = (user?.roles ?? []).filter((r) => r !== 'ADMIN' || user?.role === 'ADMIN');

  const fetchActivePlan = async () => {
    try {
      const { data } = await api.get('/memberships/me');
      if (data && data.length > 0) {
        setActivePlan(data[0].plan);
      }
    } catch (err) {}
  };

  const fetchNotifications = async (isInitial = false) => {
    try {
      const { data } = await api.get('/notifications');

      // Si hay más notificaciones de las que había antes y no es la carga inicial
      if (!isInitial && data.length > prevNotificationsCount.current) {
        const newOnes = data.filter((n: any) => !n.isRead).slice(0, data.length - prevNotificationsCount.current);
        newOnes.forEach((n: any) => {
          toast.success(n.title, {
            description: n.description,
            duration: 5000,
          });
        });
      }

      setNotifications(data);
      prevNotificationsCount.current = data.length;
    } catch (err) {
      console.error('Error fetching notifications:', err);
    }
  };

  useEffect(() => {
    if (user) {
      fetchNotifications(true);
      fetchActivePlan();
      const interval = setInterval(() => fetchNotifications(false), 30000); // Poll cada 30s para mayor dinamismo
      
      const handleMembershipUpdate = () => fetchActivePlan();
      window.addEventListener('membershipUpdated', handleMembershipUpdate);

      return () => {
        clearInterval(interval);
        window.removeEventListener('membershipUpdated', handleMembershipUpdate);
      };
    }
  }, [user]);

  const markAsRead = async (id: string) => {
    try {
      await api.patch(`/notifications/${id}/read`);
      setNotifications(notifications.map(n => n.id === id ? { ...n, isRead: true } : n));
    } catch (err) {
      console.error(err);
    }
  };

  const markAllAsRead = async () => {
    try {
      await api.patch('/notifications/read-all');
      setNotifications(notifications.map(n => ({ ...n, isRead: true })));
    } catch (err) {
      console.error(err);
    }
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const handleLogout = () => {
    logout();
  };

  const navItems = [
    // ── Todos ────────────────────────────────────────────────────
    { to: '/dashboard',          icon: LayoutDashboard, label: 'Dashboard',          roles: ['USER', 'GYM_OWNER', 'TRAINER', 'ADMIN'] },
    { 
      to: '/discovery',          
      icon: Map,             
      label: user?.role === 'ADMIN' ? 'Descubrir' :
             user?.role === 'GYM_OWNER' ? 'Análisis de Mercado' :
             user?.role === 'TRAINER' ? 'Centros de Entrenamiento' : 'Buscador General',                
      roles: ['USER', 'GYM_OWNER', 'TRAINER', 'ADMIN'] 
    },

    // ── ADMIN exclusivo ───────────────────────────────────────────
    { to: '/dashboard/users',    icon: Users,           label: 'Cuentas',                 roles: ['ADMIN'] },

    { to: '/gyms',               icon: Building2,       label: 'Todos los Negocios',       roles: ['ADMIN'] },
    { to: '/classes',            icon: Calendar,        label: 'Todas las Clases',         roles: ['ADMIN'] },
    { to: '/marketplace',        icon: ShoppingBag,     label: 'Tienda Deportiva',         roles: ['ADMIN'] },
    { to: '/professionals',      icon: Users,           label: 'Servicios Profesionales',  roles: ['ADMIN'] },
    { to: '/events',             icon: Trophy,          label: 'Eventos',                  roles: ['ADMIN'] },
    { to: '/memberships',        icon: CreditCard,      label: 'Membresías',               roles: ['ADMIN'] },

    // ── GYM_OWNER ─────────────────────────────────────────────────
    { to: '/gyms',               icon: Building2,       label: 'Mis Negocios',             roles: ['GYM_OWNER'] },
    { to: '/classes',            icon: Calendar,        label: 'Clases',                   roles: ['GYM_OWNER'] },
    { to: '/events',             icon: Trophy,          label: 'Eventos',                  roles: ['GYM_OWNER'] },
    { to: '/marketplace',        icon: ShoppingBag,     label: 'Tienda Deportiva',         roles: ['GYM_OWNER'] },
    { to: '/professionals',      icon: Users,           label: 'Servicios Profesionales',  roles: ['GYM_OWNER'] },
    { to: '/memberships',        icon: CreditCard,      label: 'Membresías',               roles: ['GYM_OWNER'] },
    { 
      to: user?.role === 'ADMIN' ? '/dashboard/admin-health' :
          user?.role === 'GYM_OWNER' ? '/dashboard/owner-health' :
          user?.role === 'TRAINER' ? '/dashboard/coach-health' : '/dashboard/health',
      icon: Activity,
      label: 'Hercix Health',
      roles: ['USER', 'GYM_OWNER', 'TRAINER', 'ADMIN'] 
    },
    { to: '/dashboard/tickets',  icon: MessageSquare,   label: 'Soporte / Tickets',        roles: ['USER', 'GYM_OWNER', 'TRAINER', 'ADMIN'] },

    // ── TRAINER ───────────────────────────────────────────────────
    { to: '/classes',            icon: Calendar,        label: 'Mis Clases',               roles: ['TRAINER'] },
    { to: '/professionals',      icon: Users,           label: 'Servicios Profesionales',  roles: ['TRAINER'] },
    { to: '/marketplace',        icon: ShoppingBag,     label: 'Tienda Deportiva',         roles: ['TRAINER'] },

    // ── ATLETA (USER) — NO accede a Mis Negocios ──────────────────
    { to: '/gyms',               icon: Building2,       label: 'Gimnasios y Centros',      roles: ['USER'] },
    { to: '/classes',            icon: Calendar,        label: 'Mis Reservas',             roles: ['USER'] },
    { to: '/marketplace',        icon: ShoppingBag,     label: 'Tienda Deportiva',         roles: ['USER'] },
    { to: '/professionals',      icon: Users,           label: 'Servicios Profesionales',  roles: ['USER'] },
    { to: '/events',             icon: Trophy,          label: 'Eventos',                  roles: ['USER'] },
    { to: '/memberships',        icon: CreditCard,      label: 'Membresías',               roles: ['USER'] },
  ];

  const filteredNavItems = navItems.filter(item => user && item.roles.includes(user.role));

  return (
    <div className="bg-background-darker min-h-screen text-slate-100 flex">
      {/* Mobile Sidebar Toggle */}
      <button
        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        className="lg:hidden fixed top-4 right-4 z-50 p-2 bg-primary rounded-lg shadow-lg"
      >
        {isSidebarOpen ? <X /> : <Menu />}
      </button>

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-40 w-64 bg-slate-900 border-r border-white/5 p-6 transform transition-transform duration-300 ease-in-out
        lg:translate-x-0 lg:static lg:block
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="flex items-center justify-center mb-10 px-2">
          <img src="/hercix-logo.png" alt="Hercix" className="h-14 object-contain" />
        </div>

        <nav className="space-y-2 flex-grow">
          {filteredNavItems.map((item) => (
            <SidebarItem
              key={item.to}
              to={item.to}
              icon={item.icon}
              label={item.label}
              active={location.pathname === item.to}
              onClick={() => setIsSidebarOpen(false)}
            />
          ))}
        </nav>

        <div className="mt-auto pt-6 border-t border-white/5 space-y-4">
          <div className="flex items-center gap-3 px-2">
            <div className="w-10 h-10 rounded-full bg-slate-800 border border-white/10 flex items-center justify-center font-bold text-primary-light uppercase">
              {user?.name.charAt(0)}
            </div>
             <div className="overflow-hidden flex flex-col gap-0.5 text-left flex-grow">
              <p className="font-medium text-sm truncate text-white" title={user?.name}>{user?.name}</p>
              <p className="text-slate-500 text-xs truncate capitalize">{user?.role.toLowerCase().replace('_', ' ')}</p>
              {activePlan && (
                <div className="mt-1">
                  <span className="inline-flex items-center gap-1 text-[9px] font-bold bg-amber-500/20 text-amber-400 px-1.5 py-0.5 rounded uppercase tracking-wider">
                    <Trophy className="w-2.5 h-2.5" /> {activePlan.name}
                  </span>
                </div>
              )}
            </div>
          </div>

          {user && switchableRoles.length > 1 && (
            <div className="px-2 space-y-1">
              <label className="text-[10px] uppercase font-bold text-slate-500 block">Vista Activa</label>
              <select
                value={user.role}
                onChange={async (e) => {
                  try {
                    await switchUserRole(e.target.value);
                    toast.success(`Perfil cambiado a ${e.target.value.toLowerCase().replace('_', ' ')}`);
                    navigate('/');
                  } catch (err) {
                    toast.error('No se pudo cambiar de rol');
                  }
                }}
                className="w-full bg-slate-800 border border-white/10 rounded-xl px-3 py-2 text-xs font-bold text-white focus:border-primary outline-none cursor-pointer"
              >
                {switchableRoles.map(r => (
                  <option key={r} value={r}>
                    {r === 'USER' ? '🏃 Atleta / Cliente' :
                     r === 'GYM_OWNER' ? '💼 Dueño (Owner)' :
                     r === 'TRAINER' ? '💪 Coach / Profesor' :
                     r === 'ADMIN' ? '🛡️ Administrador' : r}
                  </option>
                ))}
              </select>
            </div>
          )}

          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-4 py-3 text-red-400 hover:bg-red-500/10 rounded-xl transition-all"
          >
            <LogOut className="w-5 h-5" />
            <span className="font-medium">Cerrar Sesión</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-grow flex flex-col relative overflow-hidden">
        {/* Header Superior con Campanita */}
        <header className="h-20 border-b border-white/5 flex items-center justify-end px-4 lg:px-8 bg-slate-900/50 backdrop-blur-md sticky top-0 z-20">

          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="p-3 bg-white/5 hover:bg-white/10 rounded-full transition-colors relative border border-white/5 active:scale-95"
            >
              <Bell className="w-5 h-5 text-white" />
              {unreadCount > 0 && (
                <span className="absolute top-0 right-0 transform translate-x-1/4 -translate-y-1/4 bg-red-500 text-white text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full border-2 border-slate-900 animate-pulse">
                  {unreadCount}
                </span>
              )}
            </button>

            {/* Dropdown Notificaciones */}
            <AnimatePresence>
              {showNotifications && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowNotifications(false)} />
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                    className="absolute right-0 mt-3 w-80 bg-slate-900 border border-white/10 rounded-2xl shadow-2xl overflow-hidden z-50 ring-1 ring-black/5"
                  >
                    <div className="p-4 border-b border-white/10 bg-slate-800/50 flex justify-between items-center">
                      <h3 className="font-bold text-white flex items-center gap-2"><Bell className="w-4 h-4 text-secondary-light" /> Mis Notificaciones</h3>
                      <button
                        onClick={markAllAsRead}
                        className="text-[11px] font-bold text-primary-light hover:underline"
                      >
                        Marcar leídas
                      </button>
                    </div>
                    <div className="max-h-80 overflow-y-auto">
                      {notifications.length === 0 ? (
                        <div className="p-6 text-center text-slate-500 text-sm">No tienes notificaciones.</div>
                      ) : (
                        notifications.map(n => (
                          <div
                            key={n.id}
                            onClick={() => !n.isRead && markAsRead(n.id)}
                            className={`p-4 border-b border-white/5 hover:bg-white/5 cursor-pointer transition-colors ${!n.isRead ? 'bg-primary/5' : ''}`}
                          >
                            <div className="flex justify-between items-start gap-2 mb-1">
                              <h4 className={`text-sm font-bold ${!n.isRead ? 'text-primary-light' : 'text-slate-300'}`}>{n.title}</h4>
                              <span className="text-[10px] text-slate-500 whitespace-nowrap">
                                {new Date(n.createdAt).toLocaleDateString('es-CO', { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                            <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">{n.description}</p>
                          </div>
                        ))
                      )}
                    </div>
                    <div className="p-3 border-t border-white/10 bg-slate-800/30 text-center cursor-pointer hover:bg-slate-800 transition-colors">
                      <span className="text-xs text-slate-400 font-medium">Ver Todo el Historial</span>
                    </div>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>

        </header>

        <div className="flex-grow p-4 lg:p-8 overflow-y-auto custom-scrollbar">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>

          <footer className="mt-20 py-8 border-t border-white/5 text-center">
            <p className="text-slate-500 text-[10px] uppercase font-bold tracking-[0.3em]">
              © 2026 HERCIX | TODOS LOS DERECHOS RESERVADOS
            </p>
          </footer>
        </div>
      </main>

      {/* AI Chat Widget */}
      <AIChatWidget />

      {/* Complete Profile Onboarding Modal */}
      <CompleteProfileModal 
        isOpen={!!user && user.role !== 'ADMIN' && (!user.dni || !user.phone)} 
        onSuccess={() => console.log('Perfil completado con éxito')}
      />

      {/* Overlay for mobile sidebar */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsSidebarOpen(false)}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-30 lg:hidden"
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default MainLayout;
