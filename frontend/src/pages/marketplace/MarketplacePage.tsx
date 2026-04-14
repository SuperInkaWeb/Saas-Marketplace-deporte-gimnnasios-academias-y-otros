import React, { useState, useEffect } from 'react';
import api from '../../api/api-client';
import { useAuth } from '../../context/auth-context';
import { 
  ShoppingBag, 
  ShoppingCart, 
  Plus, 
  Search,
  Loader2,
  CheckCircle2,
  Package,
  X,
  Trash2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { PayMeModal } from '../../components/payment/PayMeModal';
import { AddProductModal } from '../../components/marketplace/AddProductModal';

const ProductCard: React.FC<{ 
  product: any; 
  onAddToCart: (p: any) => void;
  onEdit?: (p: any) => void;
  onDelete?: (id: string) => void;
  user: any;
}> = ({ product, onAddToCart, onEdit, onDelete, user }) => {
  const isOwner = user?.id === product.gym?.ownerId;

  return (
    <motion.div 
      whileHover={{ y: -5 }}
      className="glass-card overflow-hidden border-white/5 hover:border-secondary/30 transition-all group relative"
    >
      {isOwner && (
        <div className="absolute top-3 left-3 z-30 flex gap-2">
          {onEdit && (
            <button 
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); onEdit(product); }}
              className="bg-slate-800/80 hover:bg-slate-700 text-white p-2 rounded-xl transition-all shadow-lg active:scale-95 border border-white/10"
              title="Editar"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path></svg>
            </button>
          )}
          {onDelete && (
            <button 
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); onDelete(product.id); }}
              className="bg-red-500/80 hover:bg-red-500 text-white p-2 rounded-xl transition-all shadow-lg active:scale-95 border border-white/10"
              title="Eliminar"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      )}

      <div className="h-48 bg-slate-800 relative overflow-hidden flex items-center justify-center">
      {product.imageUrl ? (
        <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
      ) : (
        <ShoppingBag className="w-12 h-12 text-slate-700" />
      )}
      <div className="absolute top-3 right-3">
        <span className="bg-secondary/80 text-white text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wider backdrop-blur-sm">
          {product.category || 'Deportes'}
        </span>
      </div>
    </div>
    
    <div className="p-5">
      <h3 className="text-lg font-bold text-white mb-1">{product.name}</h3>
      <p className="text-slate-500 text-xs mb-4 line-clamp-1">{product.description || 'Sin descripción.'}</p>
      
      <div className="flex items-center justify-between mt-auto">
        <span className="text-xl font-extrabold text-white">${Number(product.price).toFixed(2)}</span>
        {!isOwner && (
          <button 
            onClick={() => onAddToCart(product)}
            className="bg-secondary hover:bg-secondary-dark p-2.5 rounded-xl transition-all shadow-lg shadow-secondary/20 active:scale-95"
          >
            <ShoppingCart className="w-5 h-5 text-white" />
          </button>
        )}
      </div>
    </div>
  </motion.div>
  );
};

export const MarketplacePage: React.FC = () => {
  const [products, setProducts] = useState<any[]>([]);
  const [cart, setCart] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isPayMeOpen, setIsPayMeOpen] = useState(false);
  const [isAddProductOpen, setIsAddProductOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [search, setSearch] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const { user } = useAuth();

  const fetchProducts = async () => {
    try {
      const { data } = await api.get('/marketplace/products');
      setProducts(data);
    } catch (err) {
      console.error('Error fetching products:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleDeleteProduct = async (id: string) => {
    if (!window.confirm("¿Seguro que deseas eliminar este producto permanentemente?")) return;
    try {
      await api.delete(`/marketplace/products/${id}`);
      setMessage('¡Producto eliminado correctamente!');
      fetchProducts();
      setTimeout(() => setMessage(null), 3000);
    } catch (err: any) {
      setMessage(err.response?.data?.message || 'Error al eliminar el producto');
      setTimeout(() => setMessage(null), 3000);
    }
  };

  const addToCart = (product: any) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, { ...product, quantity: 1 }];
    });
    setIsCartOpen(true);
  };

  const removeFromCart = (id: string) => {
    setCart(prev => prev.filter(item => item.id !== id));
  };

  const handleCheckoutClick = () => {
    if (cart.length === 0) return;
    setIsPayMeOpen(true);
  };

  const processOrderAfterPayment = async () => {
    try {
      const orderData = {
        gymId: cart[0].gymId, // Assuming items from same gym for simplicity
        items: cart.map(item => ({ productId: item.id, quantity: item.quantity })),
      };
      await api.post('/marketplace/orders', orderData);
      setMessage('¡Pago aprobado por Pay-Me! Tu pedido ha sido realizado con éxito.');
      setCart([]);
      setIsCartOpen(false);
      setIsPayMeOpen(false);
      setTimeout(() => setMessage(null), 4000);
    } catch (err) {
      console.error('Error logic:', err);
      alert('Error al procesar el pedido después del pago.');
      setIsPayMeOpen(false);
    }
  };

  const filteredProducts = products.filter(p => p.name.toLowerCase().includes(search.toLowerCase()));
  const cartTotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  return (
    <div className="space-y-8 relative">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">Marketplace</h1>
          <p className="text-slate-400 mt-1">Equípate con los mejores productos deportivos.</p>
        </div>
        <div className="flex gap-4">
          <button 
            onClick={() => setIsCartOpen(true)}
            className="glass-card px-4 py-2 flex items-center gap-2 hover:bg-white/10 relative"
          >
            <ShoppingCart className="w-5 h-5 text-secondary-light" />
            <span className="hidden sm:inline">Carrito</span>
            {cart.length > 0 && (
              <span className="absolute -top-2 -right-2 bg-accent text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center animate-bounce">
                {cart.length}
              </span>
            )}
          </button>
          {(user?.role === 'GYM_OWNER' || user?.role === 'TRAINER' || user?.role === 'ADMIN') && (
            <button 
              onClick={() => setIsAddProductOpen(true)}
              className="btn-secondary flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              <span className="hidden sm:inline">Vender</span>
            </button>
          )}
        </div>
      </header>

      {/* Search */}
      <div className="relative">
        <Search className="absolute top-1/2 left-4 -translate-y-1/2 text-slate-500 w-5 h-5" />
        <input 
          type="text"
          placeholder="Buscar equipamiento, suplementos..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="bg-white/5 border-white/10 focus:border-secondary-light w-full py-4 pr-4 pl-12 border rounded-2xl text-white outline-none transition-all"
        />
      </div>

      {message && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-green-500/10 border border-green-500/20 p-4 rounded-xl text-green-400 flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5" /> {message}
        </motion.div>
      )}

      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="text-secondary w-12 h-12 animate-spin" />
        </div>
      ) : filteredProducts.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {filteredProducts.map(p => (
            <ProductCard 
              key={p.id} 
              product={p} 
              onAddToCart={addToCart} 
              onEdit={setEditingProduct}
              onDelete={handleDeleteProduct}
              user={user}
            />
          ))}
        </div>
      ) : (
        <div className="glass-card p-20 flex flex-col items-center justify-center text-center">
          <Package className="text-slate-700 w-16 h-16 mb-4" />
          <h2 className="text-white font-bold text-xl">No hay productos disponibles</h2>
        </div>
      )}

      {/* Shopping Cart Drawer */}
      <AnimatePresence>
        {isCartOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setIsCartOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            />
            <motion.aside 
              initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
              className="fixed inset-y-0 right-0 w-80 bg-slate-900 border-l border-white/10 z-[60] p-6 shadow-2xl flex flex-col"
            >
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <ShoppingCart className="w-5 h-5 text-secondary-light" /> Carrito
                </h2>
                <button onClick={() => setIsCartOpen(false)} className="text-slate-500 hover:text-white"><X /></button>
              </div>

              <div className="flex-grow space-y-4 overflow-y-auto pr-2">
                {cart.length === 0 ? (
                  <p className="text-slate-500 text-center mt-20">Tu carrito está vacío.</p>
                ) : cart.map(item => (
                  <div key={item.id} className="flex gap-4 items-center bg-white/5 p-3 rounded-xl border border-white/5">
                    <div className="w-12 h-12 rounded-lg bg-slate-800 flex-shrink-0"></div>
                    <div className="flex-grow min-w-0">
                      <h4 className="text-white text-sm font-bold truncate">{item.name}</h4>
                      <p className="text-slate-400 text-xs">{item.quantity} x ${item.price}</p>
                    </div>
                    <button onClick={() => removeFromCart(item.id)} className="text-red-400/60 hover:text-red-400"><X className="w-4 h-4" /></button>
                  </div>
                ))}
              </div>

              <div className="mt-8 pt-6 border-t border-white/10 space-y-4">
                <div className="flex justify-between items-center text-slate-300">
                  <span>Total estimado</span>
                  <span className="text-xl font-bold text-white">${cartTotal.toFixed(2)}</span>
                </div>
                <button 
                  onClick={handleCheckoutClick}
                  disabled={cart.length === 0}
                  className="btn-secondary w-full py-3"
                >
                  Pagar Pedido
                </button>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      <PayMeModal
        isOpen={isPayMeOpen}
        onClose={() => setIsPayMeOpen(false)}
        onSuccess={processOrderAfterPayment}
        amount={cartTotal}
        description={`Pago de ${cart.length} producto(s) en Marketplace SportNexus`}
      />

      <AddProductModal 
        isOpen={isAddProductOpen || !!editingProduct}
        initialData={editingProduct}
        onClose={() => { setIsAddProductOpen(false); setEditingProduct(null); }}
        onSuccess={() => {
          fetchProducts();
          setMessage(editingProduct ? '¡Producto editado exitosamente!' : '¡Producto añadido exitosamente a la tienda!');
          setTimeout(() => setMessage(null), 3500);
          setEditingProduct(null);
        }}
      />
    </div>
  );
};

export default MarketplacePage;
