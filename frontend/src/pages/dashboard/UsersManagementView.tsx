import React, { useState, useEffect } from 'react';
import api from '../../api/api-client';
import { useAuth } from '../../context/auth-context';
import UserProfileModal from './components/UserProfileModal';
import { useSearchParams } from 'react-router-dom';
import {
  Users,
  Search,
  Plus,
  Trash2,
  ShieldCheck,
  Building,
  Dumbbell,
  Star,
  Loader2,
  X,
  Clock,
  CheckCircle,
  XCircle,
  Bell,
  UserCheck,
  Edit2,
  Power,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

const ROLE_KEYS = ['ALL', 'USER', 'GYM_OWNER', 'TRAINER', 'ADMIN'] as const;
const STATUS_KEYS = ['ALL', 'ACTIVE', 'INACTIVE'] as const;
type RoleFilter = typeof ROLE_KEYS[number];
type StatusFilter = typeof STATUS_KEYS[number];

const UsersManagementView: React.FC = () => {
  const { user } = useAuth();
  const [usersList, setUsersList] = useState<any[]>([]);
  const [roleRequests, setRoleRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingRequests, setLoadingRequests] = useState(true);
  const [search, setSearch] = useState('');
  const [searchRequests, setSearchRequests] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'users' | 'requests'>('users');
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [searchParams, setSearchParams] = useSearchParams();
  const [showDateDropdown, setShowDateDropdown] = useState(false);

// Se leen de la URL y se validan; si el valor es inválido cae en 'ALL'
const roleParam = searchParams.get('role');
const statusParam = searchParams.get('status');
const startDateParam = searchParams.get('startDate');
const endDateParam = searchParams.get('endDate');
const selectedRoleFilter: RoleFilter = ROLE_KEYS.includes(roleParam as RoleFilter)
  ? (roleParam as RoleFilter)
  : 'ALL';
const selectedStatusFilter: StatusFilter = STATUS_KEYS.includes(statusParam as StatusFilter)
  ? (statusParam as StatusFilter)
  : 'ALL';

const updateFilter = (key: 'role' | 'status' | 'startDate' | 'endDate', value: string) => {
  setSearchParams(prev => {
    const next = new URLSearchParams(prev);
    if (!value || value === 'ALL') next.delete(key);
    else next.set(key, value);
    return next;
  }, { replace: true });
};

  // Modal Form State
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'GYM_OWNER',
    phone: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Edit Modal State
  const [showEditModal, setShowEditModal] = useState(false);
  const [editFormData, setEditFormData] = useState({
    id: '',
    name: '',
    email: '',
    phone: '',
    dni: '',
    role: 'USER',
    isActive: true,
  });
  const [isEditing, setIsEditing] = useState(false);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/users');
      setUsersList(data);
    } catch (err) {
      toast.error('Error al cargar la lista de usuarios');
    } finally {
      setLoading(false);
    }
  };

  const fetchRoleRequests = async () => {
    try {
      setLoadingRequests(true);
      const { data } = await api.get('/users/role-requests');
      setRoleRequests(data);
    } catch (err) {
      // silently fail if endpoint not yet available
    } finally {
      setLoadingRequests(false);
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchRoleRequests();
  }, []);

  const handleDelete = async (id: string, role: string) => {
    if (role === 'ADMIN') {
      toast.error('No puedes eliminar a un Administrador.');
      return;
    }
    if (window.confirm('¿Estás seguro de que deseas eliminar permanentemente a este usuario? Esto borrará sus gimnasios y datos asociados.')) {
      try {
        await api.delete(`/users/${id}`);
        toast.success('Usuario eliminado exitosamente');
        setUsersList(usersList.filter(u => u.id !== id));
      } catch (err: any) {
        toast.error(err.response?.data?.message || 'Error al eliminar usuario');
      }
    }
  };

  const handleToggleActive = async (u: any) => {
     try {
       const { data } = await api.patch(`/users/${u.id}`, {
         name: u.name, email: u.email,
         phone: u.phone ?? undefined, dni: u.dni ?? undefined,
         role: u.role, isActive: u.isActive === false,
       });
       setUsersList(prev => prev.map(x => x.id === u.id ? { ...x, isActive: data.isActive } : x));
       toast.success(data.isActive ? 'Usuario activado' : 'Usuario desactivado');
     } catch (err: any) {
       toast.error(err.response?.data?.message || 'Error al cambiar el estado');
     }
   };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      await api.post('/users', formData);
      toast.success('Usuario creado exitosamente');
      setShowModal(false);
      setFormData({ name: '', email: '', password: '', role: 'GYM_OWNER', phone: '' });
      fetchUsers();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Error al crear usuario');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditClick = (user: any) => {
    setEditFormData({
      id: user.id,
      name: user.name || '',
      email: user.email || '',
      phone: user.phone || '',
      dni: user.dni || '',
      role: user.role || 'USER',
      isActive: user.isActive !== false,
    });
    setShowEditModal(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsEditing(true);
      await api.patch(`/users/${editFormData.id}`, {
        name: editFormData.name,
        email: editFormData.email,
        phone: editFormData.phone,
        dni: editFormData.dni,
        role: editFormData.role,
        isActive: editFormData.isActive,
      });
      toast.success('Usuario actualizado exitosamente');
      setShowEditModal(false);
      fetchUsers();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Error al actualizar usuario');
    } finally {
      setIsEditing(false);
    }
  };

  const handleApprove = async (id: string) => {
    try {
      await api.patch(`/users/role-requests/${id}/approve`, {});
      toast.success('✅ Solicitud aprobada. Rol asignado al usuario.');
      fetchRoleRequests();
      fetchUsers();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Error al aprobar solicitud');
    }
  };

  const handleReject = async (id: string) => {
    const note = window.prompt('(Opcional) Escribe una nota para el usuario sobre el rechazo:') || '';
    try {
      await api.patch(`/users/role-requests/${id}/reject`, { adminNote: note });
      toast.success('Solicitud rechazada.');
      fetchRoleRequests();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Error al rechazar solicitud');
    }
  };

  const formatDate = (date: string | null | undefined) => {
    if (!date) return <span className="text-slate-600 italic text-xs">Nunca</span>;
    const d = new Date(date);
    return (
      <span className="text-slate-400 text-xs">
        {d.toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' })}
        {' '}
        <span className="text-slate-600">{d.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })}</span>
      </span>
    );
  };

const isUserActive = (u: any) => u.isActive !== false;
const matchesRole = (u: any, role: string) => role === 'ALL' || u.role === role;
const matchesStatus = (u: any, status: string) =>
  status === 'ALL' || (status === 'ACTIVE' ? isUserActive(u) : !isUserActive(u));

const filteredUsers = usersList.filter(u => {
  const q = search.toLowerCase();
  const matchesSearch = u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q);
  
  // Validación de rango de fechas (comparando con u.createdAt)
  const userDate = new Date(u.createdAt).toISOString().split('T')[0];
  const matchesStartDate = !startDateParam || userDate >= startDateParam;
  const matchesEndDate = !endDateParam || userDate <= endDateParam;

  return matchesSearch
    && matchesRole(u, selectedRoleFilter)
    && matchesStatus(u, selectedStatusFilter)
    && matchesStartDate
    && matchesEndDate;
});

// Contadores cruzados: cada grupo de chips cuenta respetando el otro filtro
const roleCount = (key: string) =>
  usersList.filter(u => matchesRole(u, key) && matchesStatus(u, selectedStatusFilter)).length;
const statusCount = (key: string) =>
  usersList.filter(u => matchesStatus(u, key) && matchesRole(u, selectedRoleFilter)).length;

  const filteredRequests = roleRequests.filter(req =>
    (req.user?.name || '').toLowerCase().includes(searchRequests.toLowerCase()) ||
    (req.user?.email || '').toLowerCase().includes(searchRequests.toLowerCase()) ||
    (req.requestedRole || '').toLowerCase().includes(searchRequests.toLowerCase())
  );

  const pendingCount = roleRequests.filter(r => r.status === 'PENDING').length;

  const RoleBadge = ({ role }: { role: string }) => {
    const roleConfig: any = {
      ADMIN: { icon: ShieldCheck, color: 'text-red-400', bg: 'bg-red-500/10 border-red-500/20', label: 'Admin' },
      GYM_OWNER: { icon: Building, color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/20', label: 'Dueño' },
      TRAINER: { icon: Star, color: 'text-yellow-400', bg: 'bg-yellow-500/10 border-yellow-500/20', label: 'Coach' },
      USER: { icon: Dumbbell, color: 'text-green-400', bg: 'bg-green-500/10 border-green-500/20', label: 'Atleta' },
    };
    const config = roleConfig[role] || roleConfig.USER;
    const Icon = config.icon;
    return (
      <span className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-xs font-bold uppercase tracking-wider w-max ${config.color} ${config.bg}`}>
        <Icon className="w-3.5 h-3.5" />
        {config.label}
      </span>
    );
  };

  const StatusBadge = ({ status }: { status: string }) => {
    const cfg: any = {
      PENDING: { color: 'text-yellow-400', bg: 'bg-yellow-500/10 border-yellow-500/20', label: 'Pendiente' },
      APPROVED: { color: 'text-green-400', bg: 'bg-green-500/10 border-green-500/20', label: 'Aprobado' },
      REJECTED: { color: 'text-red-400', bg: 'bg-red-500/10 border-red-500/20', label: 'Rechazado' },
    };
    const c = cfg[status] || cfg.PENDING;
    return (
      <span className={`px-2.5 py-1 rounded-md border text-xs font-bold uppercase tracking-wider ${c.color} ${c.bg}`}>
        {c.label}
      </span>
    );
  };

  if (user?.role !== 'ADMIN') {
    return <div className="text-center py-20 text-slate-400">Acceso denegado. Solo administradores.</div>;
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Users className="text-primary-light" /> Gestión de Usuarios
          </h1>
          <p className="text-slate-400 text-sm">Administra las cuentas y solicitudes de rol de la plataforma.</p>
        </div>
        {activeTab === 'users' && (
          <button
            onClick={() => setShowModal(true)}
            className="btn-primary flex items-center gap-2"
          >
            <Plus className="w-4 h-4" /> Nuevo Usuario
          </button>
        )}
      </header>

      {/* Tabs */}
      <div className="flex gap-2">
        <button
          onClick={() => setActiveTab('users')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${activeTab === 'users' ? 'bg-primary text-white' : 'bg-white/5 text-slate-400 hover:bg-white/10'}`}
        >
          <Users className="w-4 h-4" /> Usuarios ({usersList.length})
        </button>
        <button
          onClick={() => setActiveTab('requests')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all relative ${activeTab === 'requests' ? 'bg-primary text-white' : 'bg-white/5 text-slate-400 hover:bg-white/10'}`}
        >
          <Bell className="w-4 h-4" /> Solicitudes de Rol
          {pendingCount > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
              {pendingCount}
            </span>
          )}
        </button>
      </div>

      {/* USERS TABLE */}
      {activeTab === 'users' && (
        <div className="glass-card p-6 border-white/5">
          <div className="relative mb-6">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 w-5 h-5" />
            <input
              type="text"
              placeholder="Buscar por nombre o correo..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-slate-900 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white focus:border-primary-light outline-none transition-all"
            />
          </div>

{/* Botón y Menú Desplegable de Filtro de Fecha */}
<div className="relative inline-block text-left mb-6">
  <button
    type="button"
    onClick={() => setShowDateDropdown(!showDateDropdown)}
    className="px-4 py-2 bg-slate-900 border border-white/10 rounded-xl text-xs font-bold text-slate-300 hover:border-primary/50 transition-all flex items-center gap-2"
  >
    <Clock className="w-4 h-4 text-primary-light" />
    <span>
      {startDateParam || endDateParam 
        ? `Fecha: ${startDateParam || 'Inicio'} → ${endDateParam || 'Hoy'}` 
        : 'Filtrar por fecha'}
    </span>
    {(startDateParam || endDateParam) && (
      <span 
        onClick={(e) => { e.stopPropagation(); updateFilter('startDate', ''); updateFilter('endDate', ''); }}
        className="ml-1 text-slate-500 hover:text-red-400"
      >
        ✕
      </span>
    )}
  </button>

  {showDateDropdown && (
    <div className="absolute left-0 mt-2 w-72 bg-slate-900 border border-white/10 rounded-2xl shadow-2xl p-4 z-50 text-slate-200">
      <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Rango de Registro</h4>
      
      <div className="space-y-3">
        <div>
          <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Desde:</label>
          <input
            type="date"
            value={startDateParam || ''}
            onChange={(e) => updateFilter('startDate', e.target.value)}
            className="w-full bg-slate-800 border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-primary"
          />
        </div>
        <div>
          <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Hasta:</label>
          <input
            type="date"
            value={endDateParam || ''}
            onChange={(e) => updateFilter('endDate', e.target.value)}
            className="w-full bg-slate-800 border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-primary"
          />
        </div>
      </div>

      <div className="flex justify-end gap-2 mt-4 pt-3 border-t border-white/5">
        <button
          type="button"
          onClick={() => { updateFilter('startDate', ''); updateFilter('endDate', ''); setShowDateDropdown(false); }}
          className="px-3 py-1.5 text-xs text-slate-400 hover:text-white transition-colors"
        >
          Limpiar
        </button>
        <button
          type="button"
          onClick={() => setShowDateDropdown(false)}
          className="px-3 py-1.5 bg-primary hover:bg-primary-dark text-white rounded-lg text-xs font-semibold transition-colors"
        >
          Aplicar
        </button>
      </div>
    </div>
  )}
</div>

          {/* Chips de filtro por rol */}
          <div className="flex flex-wrap gap-2 mb-3 items-center">
  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider mr-2">Filtrar por Rol:</span>
  {[
    { key: 'ALL', label: 'Todos', color: 'hover:border-primary/50', activeBg: 'bg-primary text-white border-primary' },
    { key: 'USER', label: 'Atletas', color: 'hover:border-green-500/50', activeBg: 'bg-green-500/10 text-green-400 border-green-500/30' },
    { key: 'GYM_OWNER', label: 'Dueños', color: 'hover:border-blue-500/50', activeBg: 'bg-blue-500/10 text-blue-400 border-blue-500/30' },
    { key: 'TRAINER', label: 'Coaches', color: 'hover:border-yellow-500/50', activeBg: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30' },
    { key: 'ADMIN', label: 'Admins', color: 'hover:border-red-500/50', activeBg: 'bg-red-500/10 text-red-400 border-red-500/30' },
  ].map(chip => {
    const isActive = selectedRoleFilter === chip.key;
    return (
      <button
        key={chip.key}
        type="button"
        onClick={() => updateFilter('role', chip.key)}
        className={`px-3.5 py-1.5 rounded-xl text-xs font-bold border transition-all flex items-center gap-1.5 ${
          isActive ? chip.activeBg : 'bg-slate-900/50 text-slate-400 border-white/5 ' + chip.color
        }`}
      >
        {chip.label}
        <span className={`px-1.5 py-0.5 rounded-md text-[10px] ${isActive ? 'bg-white/15 text-white' : 'bg-white/5 text-slate-500'}`}>
          {roleCount(chip.key)}
        </span>
      </button>
    );
  })}
</div>

{/* Chips de filtro por estado */}
<div className="flex flex-wrap gap-2 mb-6 items-center">
  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider mr-2">Filtrar por Estado:</span>
  {[
    { key: 'ALL', label: 'Todos', color: 'hover:border-primary/50', activeBg: 'bg-primary text-white border-primary' },
    { key: 'ACTIVE', label: 'Activos', color: 'hover:border-green-500/50', activeBg: 'bg-green-500/10 text-green-400 border-green-500/30' },
    { key: 'INACTIVE', label: 'Inactivos', color: 'hover:border-red-500/50', activeBg: 'bg-red-500/10 text-red-400 border-red-500/30' },
  ].map(chip => {
    const isActive = selectedStatusFilter === chip.key;
    return (
      <button
        key={chip.key}
        type="button"
        onClick={() => updateFilter('status', chip.key)}
        className={`px-3.5 py-1.5 rounded-xl text-xs font-bold border transition-all flex items-center gap-1.5 ${
          isActive ? chip.activeBg : 'bg-slate-900/50 text-slate-400 border-white/5 ' + chip.color
        }`}
      >
        {chip.label}
        <span className={`px-1.5 py-0.5 rounded-md text-[10px] ${isActive ? 'bg-white/15 text-white' : 'bg-white/5 text-slate-500'}`}>
          {statusCount(chip.key)}
        </span>
      </button>
    );
  })}
</div>

          {loading ? (
            <div className="flex justify-center py-20">
              <Loader2 className="w-8 h-8 text-primary animate-spin" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-white/10 text-slate-500 text-xs uppercase tracking-wider">
                    <th className="pb-3 font-medium px-4">Usuario</th>
                    <th className="pb-3 font-medium px-4">Rol</th>
                    <th className="pb-3 font-medium px-4">Estado</th>
                    <th className="pb-3 font-medium px-4">Fecha Registro</th>
                    <th className="pb-3 font-medium px-4">
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5" /> Última Sesión
                      </div>
                    </th>
                    <th className="pb-3 font-medium px-4 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  {filteredUsers.map((u) => (
                    <tr
                      key={u.id}
                      onClick={() => setSelectedUserId(u.id)}
                      className="border-b border-white/5 hover:bg-white/5 transition-colors cursor-pointer group"
                      title="Clic para ver perfil completo"
                    >
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          {u.avatarUrl ? (
                            <img src={u.avatarUrl} alt={u.name} className="w-10 h-10 rounded-full object-cover border border-white/10" />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center font-bold text-primary-light border border-white/10">
                              {u.name.charAt(0).toUpperCase()}
                            </div>
                          )}
                          <div>
                            <p className="font-bold text-white">{u.name}</p>
                            <p className="text-slate-500 text-xs">{u.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <RoleBadge role={u.role} />
                      </td>
                         <td className="py-4 px-4">
                          <span className={`px-2.5 py-1 rounded-md border text-xs font-bold uppercase tracking-wider ${
                            u.isActive !== false
                              ? 'text-green-400 bg-green-500/10 border-green-500/20'
                              : 'text-red-400 bg-red-500/10 border-red-500/20'
                          }`}>
                            {u.isActive !== false ? 'ACTIVO' : 'INACTIVO'}
                          </span>
                        </td>
                      <td className="py-4 px-4 text-slate-400 text-xs">
                        {new Date(u.createdAt).toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </td>
                      <td className="py-4 px-4">
                        {formatDate(u.lastLoginAt)}
                      </td>
                      <td className="py-4 px-4 text-right">
                        <div className="flex justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                             <button
                              onClick={(e) => { e.stopPropagation(); handleToggleActive(u); }}
                              className="p-2 text-slate-500 hover:text-yellow-400 hover:bg-yellow-500/10 rounded-lg transition-colors"
                              title={u.isActive === false ? 'Activar usuario' : 'Desactivar usuario'}
                            >
                              <Power className="w-4 h-4" />
                            </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEditClick(u);
                            }}
                            className="p-2 text-slate-500 hover:text-primary-light hover:bg-primary/10 rounded-lg transition-colors"
                            title="Editar usuario"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          {u.role !== 'ADMIN' && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDelete(u.id, u.role);
                              }}
                              className="p-2 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                              title="Eliminar usuario"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredUsers.length === 0 && (
                    <tr>
                      <td colSpan={6} className="text-center py-8 text-slate-500 italic">No se encontraron usuarios.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ROLE REQUESTS TAB */}
      {activeTab === 'requests' && (
        <div className="glass-card p-6 border-white/5">
          <h2 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
            <UserCheck className="text-primary-light w-5 h-5" /> Solicitudes de Cambio de Rol
            {pendingCount > 0 && (
              <span className="px-2 py-0.5 bg-yellow-500/20 text-yellow-400 text-xs rounded-full border border-yellow-500/30">
                {pendingCount} pendientes
              </span>
            )}
          </h2>

          {/* Buscador de solicitudes */}
          <div className="relative mb-6">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 w-5 h-5" />
            <input
              type="text"
              placeholder="Buscar solicitudes por nombre, correo o rol..."
              value={searchRequests}
              onChange={(e) => setSearchRequests(e.target.value)}
              className="w-full bg-slate-900 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white focus:border-primary-light outline-none transition-all"
            />
          </div>

          {loadingRequests ? (
            <div className="flex justify-center py-20">
              <Loader2 className="w-8 h-8 text-primary animate-spin" />
            </div>
          ) : filteredRequests.length === 0 ? (
            <div className="text-center py-16 text-slate-500 italic">No se encontraron solicitudes.</div>
          ) : (
            <div className="space-y-4">
              {filteredRequests.map((req) => (
                <motion.div
                  key={req.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center justify-between bg-slate-900/60 border border-white/5 rounded-xl p-4 hover:border-white/10 transition-all"
                >
                  <div className="flex items-center gap-4">
                    {req.user?.avatarUrl ? (
                      <img src={req.user.avatarUrl} alt={req.user.name} className="w-10 h-10 rounded-full object-cover border border-white/10" />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center font-bold text-primary-light border border-white/10">
                        {req.user?.name?.charAt(0)?.toUpperCase() || '?'}
                      </div>
                    )}
                    <div>
                      <p className="font-bold text-white">{req.user?.name}</p>
                      <p className="text-slate-500 text-xs">{req.user?.email}</p>
                      {req.reason && (
                        <p className="text-slate-400 text-xs mt-1 italic">"{req.reason}"</p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-3 flex-wrap justify-end">
                    <RoleBadge role={req.user?.role || 'USER'} />
                    <span className="text-slate-600 text-xs">→</span>
                    <RoleBadge role={req.requestedRole} />
                    <StatusBadge status={req.status} />

                    {req.status === 'PENDING' && (
                      <div className="flex gap-2 ml-2">
                        <button
                          onClick={() => handleApprove(req.id)}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-green-500/10 text-green-400 border border-green-500/20 rounded-lg text-xs font-semibold hover:bg-green-500/20 transition-colors"
                        >
                          <CheckCircle className="w-3.5 h-3.5" /> Aprobar
                        </button>
                        <button
                          onClick={() => handleReject(req.id)}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500/10 text-red-400 border border-red-500/20 rounded-lg text-xs font-semibold hover:bg-red-500/20 transition-colors"
                        >
                          <XCircle className="w-3.5 h-3.5" /> Rechazar
                        </button>
                      </div>
                    )}

                    {req.adminNote && (
                      <p className="text-slate-500 text-xs italic w-full text-right">Nota: {req.adminNote}</p>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Modal Crear Usuario */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowModal(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-slate-900 border border-white/10 p-6 rounded-2xl w-full max-w-md relative z-10 shadow-2xl"
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-white">Crear Nueva Cuenta</h2>
                <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreateUser} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Nombre Completo</label>
                  <input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full bg-slate-800 border border-white/10 rounded-xl px-4 py-2.5 text-white outline-none focus:border-primary" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Correo Electrónico</label>
                  <input required type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full bg-slate-800 border border-white/10 rounded-xl px-4 py-2.5 text-white outline-none focus:border-primary" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Contraseña Inicial</label>
                  <input required type="password" minLength={6} value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} className="w-full bg-slate-800 border border-white/10 rounded-xl px-4 py-2.5 text-white outline-none focus:border-primary" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Teléfono</label>
                  <input type="text" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="w-full bg-slate-800 border border-white/10 rounded-xl px-4 py-2.5 text-white outline-none focus:border-primary" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Rol</label>
                  <select value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})} className="w-full bg-slate-800 border border-white/10 rounded-xl px-4 py-2.5 text-white outline-none focus:border-primary">
                    <option value="GYM_OWNER">Dueño de Gimnasio (GYM_OWNER)</option>
                    <option value="TRAINER">Entrenador (TRAINER)</option>
                    <option value="USER">Atleta (USER)</option>
                    <option value="ADMIN">Administrador (ADMIN) — Máx. 4</option>
                  </select>
                  <p className="text-xs text-slate-500 mt-1">* Los roles de Dueño y Coach requieren aprobación cuando se registran solos.</p>
                </div>

                <div className="pt-4 flex gap-3">
                  <button type="button" onClick={() => setShowModal(false)} className="flex-1 px-4 py-2.5 bg-white/5 hover:bg-white/10 text-white rounded-xl transition-colors font-medium">Cancelar</button>
                  <button type="submit" disabled={isSubmitting} className="flex-1 px-4 py-2.5 bg-primary hover:bg-primary-dark text-white rounded-xl transition-colors font-medium flex justify-center items-center">
                    {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Crear Cuenta'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal Editar Usuario */}
      <AnimatePresence>
        {showEditModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowEditModal(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-slate-900 border border-white/10 p-6 rounded-2xl w-full max-w-md relative z-10 shadow-2xl"
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-white">Editar Usuario</h2>
                <button onClick={() => setShowEditModal(false)} className="text-slate-400 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleEditSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Nombre Completo</label>
                  <input required type="text" value={editFormData.name} onChange={e => setEditFormData({...editFormData, name: e.target.value})} className="w-full bg-slate-800 border border-white/10 rounded-xl px-4 py-2.5 text-white outline-none focus:border-primary" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Correo Electrónico</label>
                  <input required type="email" value={editFormData.email} onChange={e => setEditFormData({...editFormData, email: e.target.value})} className="w-full bg-slate-800 border border-white/10 rounded-xl px-4 py-2.5 text-white outline-none focus:border-primary" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Teléfono</label>
                  <input type="text" value={editFormData.phone || ''} onChange={e => setEditFormData({...editFormData, phone: e.target.value})} className="w-full bg-slate-800 border border-white/10 rounded-xl px-4 py-2.5 text-white outline-none focus:border-primary" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-1">DNI</label>
                  <input type="text" value={editFormData.dni || ''} onChange={e => setEditFormData({...editFormData, dni: e.target.value})} className="w-full bg-slate-800 border border-white/10 rounded-xl px-4 py-2.5 text-white outline-none focus:border-primary" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Rol</label>
                  <select value={editFormData.role} onChange={e => setEditFormData({...editFormData, role: e.target.value})} className="w-full bg-slate-800 border border-white/10 rounded-xl px-4 py-2.5 text-white outline-none focus:border-primary">
                    <option value="USER">Atleta (USER)</option>
                    <option value="TRAINER">Entrenador (TRAINER)</option>
                    <option value="GYM_OWNER">Dueño de Gimnasio (GYM_OWNER)</option>
                    <option value="ADMIN">Administrador (ADMIN)</option>
                  </select>
                </div>
                <div className="flex items-center gap-3 py-2">
                  <input 
                    type="checkbox" 
                    id="edit_isActive"
                    checked={editFormData.isActive} 
                    onChange={e => setEditFormData({...editFormData, isActive: e.target.checked})} 
                    className="w-4 h-4 rounded bg-slate-800 border-white/10 text-primary focus:ring-0 focus:ring-offset-0 focus:outline-none cursor-pointer"
                  />
                  <label htmlFor="edit_isActive" className="text-sm font-semibold text-slate-300 cursor-pointer select-none">Cuenta Activa</label>
                </div>

                <div className="pt-4 flex gap-3">
                  <button type="button" onClick={() => setShowEditModal(false)} className="flex-1 px-4 py-2.5 bg-white/5 hover:bg-white/10 text-white rounded-xl transition-colors font-medium">Cancelar</button>
                  <button type="submit" disabled={isEditing} className="flex-1 px-4 py-2.5 bg-primary hover:bg-primary-dark text-white rounded-xl transition-colors font-medium flex justify-center items-center">
                    {isEditing ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Guardar Cambios'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── Modal de Visualización Personalizada por Usuario ── */}
      <UserProfileModal
        userId={selectedUserId}
        onClose={() => setSelectedUserId(null)}
      />
    </div>
  );
};

export default UsersManagementView;
