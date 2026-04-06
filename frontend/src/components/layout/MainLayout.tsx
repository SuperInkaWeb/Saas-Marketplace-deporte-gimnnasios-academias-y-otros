import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/auth-context';
import { 
  LayoutDashboard, 
  Dumbbell, 
  Calendar, 
  ShoppingBag, 
  LogOut, 
  Menu, 
  X,
  CreditCard,
  Users,
  Map,
  Trophy
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import AIChatWidget from '../ai/AIChatWidget';

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
    className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
      active 
        ? 'bg-primary text-white shadow-lg shadow-primary/20' 
        : 'text-slate-400 hover:bg-white/5 hover:text-white'
    }`}
  >
    <Icon className="w-5 h-5" />
    <span className="font-medium">{label}</span>
  </Link>
);

const MainLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard', roles: ['USER', 'GYM_OWNER', 'TRAINER', 'ADMIN'] },
    { to: '/gyms', icon: Dumbbell, label: 'Gimnasios', roles: ['USER', 'GYM_OWNER', 'TRAINER', 'ADMIN'] },
    { to: '/classes', icon: Calendar, label: 'Clases', roles: ['USER', 'TRAINER', 'GYM_OWNER', 'ADMIN'] },
    { to: '/events', icon: Trophy, label: 'Eventos', roles: ['USER', 'GYM_OWNER', 'TRAINER', 'ADMIN'] },
    { to: '/marketplace', icon: ShoppingBag, label: 'Tienda', roles: ['USER', 'GYM_OWNER', 'ADMIN'] },
    { to: '/professionals', icon: Users, label: 'Servicios', roles: ['USER', 'GYM_OWNER', 'ADMIN'] },
    { to: '/discovery', icon: Map, label: 'Descubrir', roles: ['USER', 'GYM_OWNER', 'TRAINER', 'ADMIN'] },
    { to: '/memberships', icon: CreditCard, label: 'Membresías', roles: ['USER', 'GYM_OWNER', 'ADMIN'] },
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
        lg:relative lg:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="flex items-center gap-3 mb-10 px-2">
          <div className="bg-primary/20 p-2 rounded-lg">
            <Dumbbell className="text-primary-light w-6 h-6" />
          </div>
          <span className="font-bold text-xl tracking-tight">SportNexus</span>
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
            <div className="overflow-hidden">
              <p className="font-medium text-sm truncate">{user?.name}</p>
              <p className="text-slate-500 text-xs truncate capitalize">{user?.role.toLowerCase().replace('_', ' ')}</p>
            </div>
          </div>
          
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
      <main className="flex-grow p-4 lg:p-8 overflow-y-auto">
        <div className="max-w-7xl mx-auto">
          {children}
        </div>
      </main>

      {/* AI Chat Widget — visible en todas las páginas */}
      <AIChatWidget />

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
