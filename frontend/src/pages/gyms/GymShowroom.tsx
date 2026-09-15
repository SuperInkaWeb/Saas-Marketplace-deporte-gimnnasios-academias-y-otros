import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../api/api-client';
import { useAuth } from '../../context/auth-context';
import { 
  ArrowLeft, 
  ShoppingBag, 
  Calendar, 
  CreditCard, 
  MapPin, 
  Phone, 
  Globe, 
  Loader2,
  CheckCircle2,
  Star,
  Activity,
  Plus,
  Pencil,
  Trash2,
  Settings,
  ShoppingCart,
  X,
  Minus
} from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { AddProductModal } from '../../components/marketplace/AddProductModal';
import { AddPlanModal } from '../../components/gyms/AddPlanModal';
import { PayMeModal } from '../../components/payment/PayMeModal';

const GymShowroom: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [gym, setGym] = useState<any>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [plans, setPlans] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'products' | 'plans' | 'classes'>('products');
  const [bookingId, setBookingId] = useState<string | null>(null);

  // Shopping cart state
  const [cart, setCart] = useState<any[]>([]);
  const [showCart, setShowCart] = useState(false);

  // Owner product management state
  const [showProductModal, setShowProductModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [deletingProductId, setDeletingProductId] = useState<string | null>(null);

  // Owner membership plan state
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [editingPlan, setEditingPlan] = useState<any>(null);

  // Payment integration state
  const [selectedPlanForPay, setSelectedPlanForPay] = useState<any>(null);
  const [showPayMeModal, setShowPayMeModal] = useState(false);
  const [isCartPayment, setIsCartPayment] = useState(false);

  const isOwner = user?.role === 'GYM_OWNER' || user?.role === 'ADMIN';
  const isMyGym = isOwner && gym && gym.ownerId === user?.id;

  const handlePlanSuccess = async () => {
    toast.success(editingPlan ? 'Plan actualizado ✅' : '¡Plan de membresía creado exitosamente! ✅');
    const { data } = await api.get(`/memberships/plans?gymId=${id}`);
    setPlans(data);
  };

  const handlePaySuccess = async () => {
    if (isCartPayment) {
      try {
        const orderItems = cart.map(item => ({
          productId: item.id,
          quantity: item.qty
        }));
        await api.post('/marketplace/orders', {
          gymId: id,
          items: orderItems,
          notes: 'Compra desde vitrina de gimnasio con pasarela Pay-me'
        });
        toast.success('¡Pedido confirmado y pagado exitosamente! 🎉');
        setCart([]);
        setShowCart(false);
        setShowPayMeModal(false);
        setIsCartPayment(false);
        fetchData();
      } catch (err: any) {
        toast.error(err.response?.data?.message || 'Error al procesar tu pedido.');
      }
      return;
    }

    if (!selectedPlanForPay) return;
    try {
      await api.post('/memberships/subscribe', { planId: selectedPlanForPay.id });
      toast.success(`🎉 ¡Te has suscrito exitosamente al plan "${selectedPlanForPay.name}"!`);
      setShowPayMeModal(false);
      setSelectedPlanForPay(null);
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Error al procesar tu suscripción.');
    }
  };

  const handleDeletePlan = async (planId: string, planName: string) => {
    if (!window.confirm(`¿Eliminar el plan de membresía "${planName}"? Esta acción no se puede deshacer.`)) return;
    try {
      await api.delete(`/memberships/plans/${planId}`);
      toast.success('Plan de membresía eliminado correctamente');
      setPlans(prev => prev.filter(p => p.id !== planId));
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Error al eliminar el plan');
    }
  };

  const handleEditPlan = (plan: any) => {
    setEditingPlan(plan);
    setShowPlanModal(true);
  };

  const getBannerImage = () => {
    if (gym?.logoUrl) return gym.logoUrl;
    if (gym?.bannerUrl) return gym.bannerUrl;
    if (gym?.imageUrl) return gym.imageUrl;
    
    const name = gym?.name || '';
    if (name.includes('Fútbol')) return 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?q=80&w=1200&auto=format&fit=crop';
    if (name.includes('Box')) return 'https://images.unsplash.com/photo-1549719386-74dfcbf7dbed?q=80&w=1200&auto=format&fit=crop';
    if (name.includes('Natación')) return 'https://images.unsplash.com/photo-1519315901367-f34ff9154487?q=80&w=1200&auto=format&fit=crop';
    if (name.includes('Tenis')) return 'https://images.unsplash.com/photo-1595435934249-5df7ed86e1c0?q=80&w=1200&auto=format&fit=crop';
    if (name.includes('Básquet')) return 'https://images.unsplash.com/photo-1544698310-74ea9d1c8258?q=80&w=1200&auto=format&fit=crop';
    
    // Default high-end gym background
    return 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=1200&auto=format&fit=crop';
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const [gymRes, productsRes, plansRes, classesRes] = await Promise.all([
        api.get(`/gyms/${id}`),
        api.get(`/marketplace/products?gymId=${id}`),
        api.get(`/memberships/plans?gymId=${id}`),
        api.get(`/classes?gymId=${id}`)
      ]);

      setGym(gymRes.data);
      setProducts(productsRes.data);
      setPlans(plansRes.data);
      setClasses(classesRes.data);
      
      if (productsRes.data.length > 0) setActiveTab('products');
      else if (plansRes.data.length > 0) setActiveTab('plans');
      else if (classesRes.data.length > 0) setActiveTab('classes');
      
    } catch (err) {
      console.error('Error cargando vitrina:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [id]);

  const handleBook = async (classId: string) => {
    try {
      setBookingId(classId);
      await api.post(`/classes/${classId}/book`);
      toast.success('¡Reserva confirmada exitosamente!');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Error al reservar la clase');
    } finally {
      setBookingId(null);
    }
  };

  const handleDeleteProduct = async (productId: string, productName: string) => {
    if (!window.confirm(`¿Eliminar el producto "${productName}"? Esta acción no se puede deshacer.`)) return;
    try {
      setDeletingProductId(productId);
      await api.delete(`/marketplace/products/${productId}`);
      toast.success('Producto eliminado correctamente');
      setProducts(prev => prev.filter(p => p.id !== productId));
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Error al eliminar producto');
    } finally {
      setDeletingProductId(null);
    }
  };

  const handleEditProduct = (product: any) => {
    setEditingProduct(product);
    setShowProductModal(true);
  };

  const handleCloseProductModal = () => {
    setShowProductModal(false);
    setEditingProduct(null);
  };

  const handleProductSuccess = async () => {
    toast.success(editingProduct ? 'Producto actualizado ✅' : '¡Producto añadido a tu tienda! ✅');
    const { data } = await api.get(`/marketplace/products?gymId=${id}`);
    setProducts(data);
  };

  // Cart functions
  const addToCart = (product: any) => {
    setCart(prev => {
      const exists = prev.find(i => i.id === product.id);
      if (exists) return prev.map(i => i.id === product.id ? { ...i, qty: i.qty + 1 } : i);
      return [...prev, { ...product, qty: 1 }];
    });
    toast.success(`${product.name} agregado al carrito 🛒`);
  };

  const removeFromCart = (id: string) => setCart(prev => prev.filter(i => i.id !== id));
  const changeQty = (id: string, delta: number) => setCart(prev =>
    prev.map(i => i.id === id ? { ...i, qty: Math.max(1, i.qty + delta) } : i)
  );
  const cartTotal = cart.reduce((s, i) => s + Number(i.price) * i.qty, 0);
  const cartCount = cart.reduce((s, i) => s + i.qty, 0);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="text-primary w-12 h-12 animate-spin" />
      </div>
    );
  }

  if (!gym) return <div>Negocio no encontrado</div>;

  return (
    <div className="space-y-8 pb-20 animate-in fade-in duration-700">
      {/* Owner Product Modal */}
      <AddProductModal
        isOpen={showProductModal}
        onClose={handleCloseProductModal}
        onSuccess={handleProductSuccess}
        initialData={editingProduct ? { ...editingProduct, gymId: id } : undefined}
      />

      {/* Hero Section */}
      <div className="relative h-64 md:h-80 rounded-[2.5rem] overflow-hidden group">
        {/* Beautiful Dynamic Cover Image */}
        <div className="absolute inset-0 bg-slate-950">
          <img 
            src={getBannerImage()} 
            alt={gym.name}
            className="w-full h-full object-cover opacity-40 group-hover:scale-105 group-hover:opacity-50 transition-all duration-1000" 
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-[#0f172a] via-[#0f172a]/40 to-transparent z-10"></div>
        
        <div className="absolute bottom-10 left-10 right-10 z-20 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-4">
            <button 
              onClick={() => navigate('/gyms')}
              className="flex items-center gap-2 text-white/60 hover:text-white mb-4 text-sm font-bold transition-all bg-white/5 w-fit px-4 py-2 rounded-full backdrop-blur-md border border-white/5"
            >
              <ArrowLeft className="w-4 h-4" /> Volver a Negocios
            </button>
            <div className="flex items-center gap-4">
              <div className="bg-primary/20 p-4 rounded-3xl backdrop-blur-xl border border-primary/30">
                <Activity className="w-10 h-10 text-primary-light" />
              </div>
              <div>
                <h1 className="text-4xl md:text-5xl font-black text-white tracking-tighter">{gym.name}</h1>
                <div className="flex flex-wrap items-center gap-4 mt-2">
                  <span className="flex items-center gap-1.5 text-slate-400 text-sm font-bold bg-white/5 px-3 py-1 rounded-full border border-white/5">
                    <MapPin className="w-3.5 h-3.5 text-primary-light" /> {gym.city || 'Sede Central'}
                  </span>
                  <span className="flex items-center gap-1.5 text-slate-400 text-sm font-bold bg-white/5 px-3 py-1 rounded-full border border-white/5">
                    <Star className="w-3.5 h-3.5 text-yellow-400 fill-current" /> 4.9 (Verificado)
                  </span>
                  {isMyGym && (
                    <span className="flex items-center gap-1.5 text-primary-light text-sm font-bold bg-primary/10 px-3 py-1 rounded-full border border-primary/20">
                      <Settings className="w-3.5 h-3.5" /> Tu Local
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex gap-3">
            {isMyGym ? (
              <button
                onClick={() => {
                  if (activeTab === 'plans') {
                    setEditingPlan(null);
                    setShowPlanModal(true);
                  } else {
                    setEditingProduct(null);
                    setShowProductModal(true);
                  }
                }}
                className="bg-primary text-white font-black px-6 py-3 rounded-2xl shadow-xl hover:bg-primary-dark transition-all text-sm flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                <span>{activeTab === 'plans' ? 'Añadir Membresía' : 'Añadir Producto'}</span>
              </button>
            ) : (
              <>
                {cartCount > 0 && (
                  <button
                    onClick={() => setShowCart(true)}
                    className="relative bg-white/10 text-white font-black px-5 py-3 rounded-2xl shadow-xl hover:bg-white/20 transition-all text-sm flex items-center gap-2 border border-white/20"
                  >
                    <ShoppingCart className="w-4 h-4" />
                    Carrito
                    <span className="absolute -top-2 -right-2 bg-primary text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold">{cartCount}</span>
                  </button>
                )}
                <button className="bg-white text-slate-900 font-black px-8 py-3 rounded-2xl shadow-xl hover:scale-105 transition-all text-sm">
                  Seguir Negocio
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Info & Navigation */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Sidebar Info */}
        <div className="lg:col-span-1 space-y-6">
          <div className="glass-card p-6 border-white/5 space-y-4">
             <h3 className="text-white font-bold text-sm uppercase tracking-widest opacity-50">Información</h3>
             <p className="text-slate-400 text-sm leading-relaxed">
               {gym.description ? gym.description.split('\n\n[Categorías:')[0] : 'Este negocio ofrece los mejores servicios deportivos del sector.'}
             </p>
             <div className="space-y-3 pt-4">
               <div className="flex flex-col gap-2">
                 <div className="flex items-center justify-between gap-3 text-sm text-slate-300">
                   <div className="flex items-center gap-3">
                     <Phone className="w-4 h-4 text-primary-light" /> {gym.phone || '+51 900 100 200'}
                   </div>
                   {gym.phone && (
                     <a
                       href={`https://api.whatsapp.com/send?phone=${gym.phone.replace(/[^0-9+]/g, '')}&text=${encodeURIComponent(`Hola ${gym.name}, me gustaría consultar sobre sus planes y clases en Hercix.`)}`}
                       target="_blank"
                       rel="noopener noreferrer"
                       className="bg-green-500/10 hover:bg-green-500/20 text-green-400 px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all border border-green-500/20 flex items-center gap-1"
                       title="Chatear con el local"
                     >
                       <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                       Chatear
                     </a>
                   )}
                 </div>
               </div>
               <div className="flex items-center gap-3 text-sm text-slate-300">
                 <Globe className="w-4 h-4 text-primary-light" /> {gym.website || 'www.negocio.com'}
               </div>
             </div>
          </div>

          <div className="glass-card p-6 border-white/5">
             <div className="flex justify-between items-center mb-4">
               <span className="text-xs text-slate-500 font-bold uppercase tracking-widest">Estado</span>
               <span className="bg-green-500/10 text-green-400 text-[10px] px-2 py-0.5 rounded border border-green-500/20 font-black">OPEN</span>
             </div>
             <p className="text-white text-sm font-bold">{gym.openDays || 'Lunes a Sábado'}</p>
             <p className="text-slate-500 text-xs mt-1">{gym.openTime || '06:00 AM'} - {gym.closeTime || '10:00 PM'}</p>
          </div>
        </div>

        {/* Content Tabs */}
        <div className="lg:col-span-3 space-y-6">
          <div className="flex p-1 bg-slate-900/50 rounded-2xl border border-white/5 max-w-md">
            {[
              { id: 'products', label: 'Tienda', icon: ShoppingBag, count: products.length },
              { id: 'plans', label: 'Membresías', icon: CreditCard, count: plans.length },
              { id: 'classes', label: 'Clases', icon: Calendar, count: classes.length },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all ${
                  activeTab === tab.id 
                    ? 'bg-primary text-white shadow-lg' 
                    : 'text-slate-500 hover:text-white hover:bg-white/5'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                <span>{tab.label}</span>
                {tab.count > 0 && <span className="text-[10px] bg-white/10 px-1.5 py-0.5 rounded-md">{tab.count}</span>}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="min-h-[400px]">
            <AnimatePresence mode="wait">
              {activeTab === 'products' && (
                <motion.div 
                  key="products" 
                  initial={{ opacity: 0, y: 10 }} 
                  animate={{ opacity: 1, y: 0 }} 
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-4"
                >
                  {/* Owner: Add Product Banner */}
                  {isMyGym && (
                    <button
                      onClick={() => { setEditingProduct(null); setShowProductModal(true); }}
                      className="w-full border-2 border-dashed border-primary/30 hover:border-primary/60 bg-primary/5 hover:bg-primary/10 rounded-2xl py-5 flex items-center justify-center gap-3 text-primary-light font-bold transition-all group"
                    >
                      <Plus className="w-5 h-5 group-hover:scale-125 transition-transform" />
                      Añadir Nuevo Producto a tu Tienda
                    </button>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {products.length > 0 ? products.map(p => (
                      <div key={p.id} className="glass-card p-4 border-white/5 hover:border-primary/20 transition-all group relative">
                        {/* Owner Controls */}
                        {isMyGym && (
                          <div className="absolute top-3 right-3 flex gap-1.5 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => handleEditProduct(p)} className="p-1.5 bg-slate-700 hover:bg-primary rounded-lg text-white transition-colors" title="Editar">
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            <button onClick={() => handleDeleteProduct(p.id, p.name)} disabled={deletingProductId === p.id} className="p-1.5 bg-slate-700 hover:bg-red-500 rounded-lg text-white transition-colors disabled:opacity-50" title="Eliminar">
                              {deletingProductId === p.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                            </button>
                          </div>
                        )}
                        <div className="h-40 bg-slate-800 rounded-xl mb-4 overflow-hidden flex items-center justify-center">
                          {p.imageUrl ? (
                            <img src={p.imageUrl} alt={p.name} className="w-full h-full object-cover" />
                          ) : (
                            <ShoppingBag className="w-12 h-12 text-slate-700 opacity-20 group-hover:scale-110 transition-transform" />
                          )}
                        </div>
                        <span className="text-[10px] font-black text-primary-light uppercase tracking-widest">{p.category}</span>
                        <h4 className="text-white font-bold mt-1">{p.name}</h4>
                        <p className="text-slate-500 text-xs mt-1 line-clamp-1">{p.description}</p>
                        <div className="mt-4 flex justify-between items-center">
                          <span className="text-xl font-black text-white">${Number(p.price).toFixed(2)}</span>
                          {!isMyGym ? (
                            <button
                              onClick={() => addToCart(p)}
                              className="flex items-center gap-1.5 bg-primary/20 hover:bg-primary text-primary-light hover:text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-all border border-primary/20 hover:border-primary active:scale-95"
                            >
                              <ShoppingCart className="w-3.5 h-3.5" /> Añadir
                            </button>
                          ) : (
                            <span className="text-xs text-slate-500 bg-white/5 px-2 py-1 rounded-lg">Stock: {p.stock ?? '—'}</span>
                          )}
                        </div>
                      </div>
                    )) : (
                      <div className="col-span-full py-20 text-center text-slate-500 italic">
                        {isMyGym ? 'Aún no has añadido productos. ¡Usa el botón de arriba!' : 'No hay productos disponibles para este local aún.'}
                      </div>
                    )}
                  </div>
                </motion.div>
              )}

              {activeTab === 'plans' && (
                <motion.div 
                  key="plans" 
                  initial={{ opacity: 0, y: 10 }} 
                  animate={{ opacity: 1, y: 0 }} 
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-4"
                >
                  {/* Owner: Add Plan Banner */}
                  {isMyGym && (
                    <button
                      onClick={() => { setEditingPlan(null); setShowPlanModal(true); }}
                      className="w-full border-2 border-dashed border-primary/30 hover:border-primary/60 bg-primary/5 hover:bg-primary/10 rounded-2xl py-5 flex items-center justify-center gap-3 text-primary-light font-bold transition-all group"
                    >
                      <Plus className="w-5 h-5 group-hover:scale-125 transition-transform" />
                      Añadir Nuevo Plan de Membresía
                    </button>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    {plans.length > 0 ? plans.map(p => (
                      <div key={p.id} className="glass-card p-8 border-white/5 relative overflow-hidden group">
                        {/* Owner Controls */}
                        {isMyGym && (
                          <div className="absolute top-3 right-3 flex gap-1.5 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => handleEditPlan(p)} className="p-1.5 bg-slate-700 hover:bg-primary rounded-lg text-white transition-colors" title="Editar">
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            <button onClick={() => handleDeletePlan(p.id, p.name)} className="p-1.5 bg-slate-700 hover:bg-red-500 rounded-lg text-white transition-colors" title="Eliminar">
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                        <div className="absolute -right-4 -bottom-4 p-8 opacity-5">
                           <CreditCard className="w-24 h-24 text-white" />
                        </div>
                        <h4 className="text-2xl font-black text-white">{p.name}</h4>
                        <p className="text-slate-400 text-sm mt-2">{p.description}</p>
                        <div className="mt-8 flex items-baseline gap-1">
                          <span className="text-4xl font-black text-white px-2">${Number(p.price).toFixed(0)}</span>
                          <span className="text-slate-500 text-sm uppercase font-bold tracking-widest">/ {p.durationDays} Días</span>
                        </div>
                        <ul className="mt-6 space-y-3">
                           {[
                             'Acceso completo a instalaciones', 
                             'Entrenador de piso corporativo', 
                             'App de seguimiento incluida'
                           ].map((f, i) => (
                             <li key={i} className="flex items-center gap-2 text-xs text-slate-400">
                               <CheckCircle2 className="w-3.5 h-3.5 text-primary-light" /> {f}
                             </li>
                           ))}
                        </ul>
                        <button 
                          onClick={() => {
                            if (isOwner) {
                              toast.error('Los administradores/dueños no pueden suscribirse a planes.');
                              return;
                            }
                            setIsCartPayment(false);
                            setSelectedPlanForPay(p);
                            setShowPayMeModal(true);
                          }}
                          className="w-full mt-8 py-3 bg-primary hover:bg-primary-dark text-white font-black rounded-xl transition-all shadow-lg shadow-primary/20 active:scale-95"
                        >
                          Suscribirme Hoy
                        </button>
                      </div>
                    )) : (
                      <div className="col-span-full py-20 text-center text-slate-500 italic">No hay planes de membresía activos.</div>
                    )}
                  </div>
                </motion.div>
              )}

              {activeTab === 'classes' && (
                <motion.div 
                  key="classes" 
                  initial={{ opacity: 0, y: 10 }} 
                  animate={{ opacity: 1, y: 0 }} 
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-4"
                >
                  {classes.length > 0 ? classes.map(c => (
                    <div key={c.id} className="glass-card p-6 border-white/5 flex flex-col md:flex-row md:items-center justify-between gap-6 group">
                      <div className="flex items-center gap-4">
                        <div className="bg-slate-800 p-4 rounded-2xl group-hover:bg-primary/20 transition-colors">
                          <Calendar className={`w-6 h-6 ${true ? 'text-primary-light' : 'text-slate-500'}`} />
                        </div>
                        <div>
                          <h4 className="text-white font-bold text-lg">{c.title}</h4>
                          <div className="flex items-center gap-3 text-xs text-slate-500 mt-1 uppercase font-bold tracking-widest">
                            <span className="flex items-center gap-1"><Activity className="w-3 h-3" /> {c.capacity} Cupos</span>
                            <span>•</span>
                            <span className="text-primary-light">Programado</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 border-t md:border-t-0 pt-4 md:pt-0 border-white/5">
                        <div className="text-right">
                          <p className="text-white font-black">{new Date(c.scheduledAt).toLocaleDateString()}</p>
                          <p className="text-slate-500 text-xs uppercase font-bold">10:00 AM</p>
                        </div>
                        <button 
                          onClick={() => handleBook(c.id)}
                          disabled={bookingId === c.id}
                          className="bg-white/5 hover:bg-white/10 disabled:opacity-50 text-white px-6 py-2 rounded-xl text-sm font-bold border border-white/10 transition-all flex items-center justify-center min-w-[120px]">
                          {bookingId === c.id ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Reservar'}
                        </button>
                      </div>
                    </div>
                  )) : (
                    <div className="col-span-full py-20 text-center text-slate-500 italic">No hay clases programadas actualmente.</div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Cart Drawer - Athletes only */}
      {showCart && !isMyGym && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div onClick={() => setShowCart(false)} className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <motion.div
            initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
            className="relative w-full max-w-sm bg-slate-900 border-l border-white/10 h-full flex flex-col shadow-2xl z-10"
          >
            <div className="p-5 border-b border-white/10 flex justify-between items-center">
              <h2 className="text-white font-bold text-lg flex items-center gap-2"><ShoppingCart className="w-5 h-5 text-primary-light" /> Mi Carrito</h2>
              <button onClick={() => setShowCart(false)} className="text-slate-400 hover:text-white"><X className="w-5 h-5" /></button>
            </div>
            <div className="flex-grow overflow-y-auto p-5 space-y-3">
              {cart.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <ShoppingCart className="w-12 h-12 text-slate-700 mb-3" />
                  <p className="text-slate-500">Tu carrito está vacío.</p>
                  <p className="text-slate-600 text-xs mt-1">Agrega productos de la tienda.</p>
                </div>
              ) : cart.map(item => (
                <div key={item.id} className="glass-card p-3 border-white/5 flex items-center gap-3">
                  <div className="w-12 h-12 bg-slate-800 rounded-xl flex items-center justify-center flex-shrink-0">
                    {item.imageUrl
                      ? <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover rounded-xl" />
                      : <ShoppingBag className="w-6 h-6 text-slate-600" />}
                  </div>
                  <div className="flex-grow min-w-0">
                    <p className="text-white text-sm font-bold truncate">{item.name}</p>
                    <p className="text-primary-light text-xs font-bold">${Number(item.price).toFixed(2)}</p>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button onClick={() => changeQty(item.id, -1)} className="w-6 h-6 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors">
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="text-white text-sm font-bold w-5 text-center">{item.qty}</span>
                    <button onClick={() => changeQty(item.id, 1)} className="w-6 h-6 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors">
                      <Plus className="w-3 h-3" />
                    </button>
                    <button onClick={() => removeFromCart(item.id)} className="ml-1 text-slate-600 hover:text-red-400 transition-colors">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
            {cart.length > 0 && (
              <div className="p-5 border-t border-white/10 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-slate-400 text-sm">{cartCount} artículo(s)</span>
                  <span className="text-white font-black text-xl">${cartTotal.toFixed(2)}</span>
                </div>
                <button
                  onClick={() => {
                    if (isOwner) {
                      toast.error('Los administradores/dueños no pueden realizar pedidos.');
                      return;
                    }
                    setIsCartPayment(true);
                    setSelectedPlanForPay(null);
                    setShowPayMeModal(true);
                  }}
                  className="btn-primary w-full py-3 text-center font-black flex items-center justify-center gap-2"
                >
                  <ShoppingCart className="w-4 h-4" /> Confirmar y Pagar Pedido
                </button>
              </div>
            )}
          </motion.div>
        </div>
      )}
      <AddPlanModal
        isOpen={showPlanModal}
        onClose={() => { setShowPlanModal(false); setEditingPlan(null); }}
        onSuccess={handlePlanSuccess}
        gymId={id || ''}
        initialData={editingPlan}
      />
      <PayMeModal
        isOpen={showPayMeModal}
        onClose={() => { setShowPayMeModal(false); setSelectedPlanForPay(null); setIsCartPayment(false); }}
        onSuccess={handlePaySuccess}
        amount={isCartPayment ? cartTotal : (selectedPlanForPay ? Number(selectedPlanForPay.price) : 0)}
        description={isCartPayment ? `Compra de productos deportivos - ${gym.name}` : (selectedPlanForPay ? `Membresía ${selectedPlanForPay.name} - ${gym.name}` : '')}
      />
    </div>
  );
};

export default GymShowroom;
