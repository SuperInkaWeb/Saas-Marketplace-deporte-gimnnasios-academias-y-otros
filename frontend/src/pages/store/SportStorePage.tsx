import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ShoppingBag, Search, Star, ShoppingCart, Package, X } from 'lucide-react';
import { toast } from 'sonner';

const SPORT_CATEGORIES = [
  { label: 'Todo', value: '' },
  { label: '👕 Ropa Deportiva', value: 'ropa' },
  { label: '💊 Suplementos', value: 'suplementos' },
  { label: '🏋️ Equipos', value: 'equipos' },
  { label: '🥋 Karate', value: 'karate' },
  { label: '🏊 Natación', value: 'natacion' },
  { label: '🥊 Box', value: 'box' },
  { label: '⚽ Fútbol', value: 'futbol' },
];

// Tienda Deportiva data (productos reales con sus categorías)
const SPORTS_STORE_PRODUCTS = [
  // Ropa Deportiva General
  { id: 's1', name: 'Camiseta Dry-Fit Performance', price: 45, category: 'ropa', store: 'SportWear Pro', rating: 4.8, img: '👕', desc: 'Tela transpirable de alto rendimiento para entrenamientos intensos. Tallas XS-XXL.' },
  { id: 's2', name: 'Short de Entrenamiento', price: 38, category: 'ropa', store: 'SportWear Pro', rating: 4.6, img: '🩳', desc: 'Short con bolsillos y tejido elástico cuádruple. Ideal para cualquier deporte.' },
  { id: 's3', name: 'Buzo Térmico Compresión', price: 75, category: 'ropa', store: 'SportWear Pro', rating: 4.9, img: '🧥', desc: 'Compresión muscular para reducir fatiga y acelerar recuperación.' },
  { id: 's4', name: 'Zapatillas Trail Running', price: 120, category: 'ropa', store: 'SportWear Pro', rating: 4.7, img: '👟', desc: 'Suela antideslizante y amortiguación Gel para terrenos mixtos.' },

  // Suplementos
  { id: 's5', name: 'Proteína Whey Gold 5Lbs', price: 180, category: 'suplementos', store: 'NutriSport', rating: 4.9, img: '🥤', desc: 'Proteína de suero de leche. 25g de proteína por porción. Sabor chocolate y vainilla.' },
  { id: 's6', name: 'Creatina Monohidratada 500g', price: 65, category: 'suplementos', store: 'NutriSport', rating: 4.8, img: '💊', desc: 'Aumenta fuerza y masa muscular. Certificada libre de dopaje.' },
  { id: 's7', name: 'Quemador de Grasa Termogénico', price: 55, category: 'suplementos', store: 'NutriSport', rating: 4.5, img: '🔥', desc: 'Acelera el metabolismo con cafeína natural y extracto de té verde.' },
  { id: 's8', name: 'Vitaminas Multideportivo x90', price: 40, category: 'suplementos', store: 'NutriSport', rating: 4.7, img: '🌿', desc: 'Complejo vitamínico con Zinc, Magnesio y Vitamina D3 para deportistas.' },
  { id: 's9', name: 'BCAA Aminoácidos Esenciales', price: 48, category: 'suplementos', store: 'NutriSport', rating: 4.6, img: '⚗️', desc: 'Leucina, Isoleucina y Valina para recuperación muscular post-entrenamiento.' },

  // Equipos Deportivos
  { id: 's10', name: 'Mancuernas Hexagonales 20kg', price: 95, category: 'equipos', store: 'FitEquipos', rating: 4.8, img: '🏋️', desc: 'Par de mancuernas de goma hexagonal. Anti-rodadura y resistentes al impacto.' },
  { id: 's11', name: 'Bicicleta Estacionaria Magnética', price: 450, category: 'equipos', store: 'FitEquipos', rating: 4.9, img: '🚴', desc: '8 niveles de resistencia, pantalla LCD, sillin regulable. Silenciosa.' },
  { id: 's12', name: 'Barra de Dominadas Puerta', price: 55, category: 'equipos', store: 'FitEquipos', rating: 4.6, img: '🏗️', desc: 'Sin tornillos, soporta hasta 150kg. Compatible con puertas de 60-100cm.' },
  { id: 's13', name: 'Colchoneta Yoga Premium 10mm', price: 35, category: 'equipos', store: 'FitEquipos', rating: 4.7, img: '🧘', desc: 'Superficie antideslizante ECO-PVC. Incluye correa de transporte.' },
  { id: 's14', name: 'Cuerda de Saltar Velocidad', price: 22, category: 'equipos', store: 'FitEquipos', rating: 4.5, img: '🏃', desc: 'Cable de acero con manijas ergonómicas. Ideal para cardio y crossfit.' },

  // Karate
  { id: 's15', name: 'Kimono Karate WKF Aprobado', price: 85, category: 'karate', store: 'Artes Marciales Perú', rating: 4.8, img: '🥋', desc: 'Tela 100% algodón 8oz. Aprobado por World Karate Federation. Tallas infantil y adulto.' },
  { id: 's16', name: 'Cinturón Karate Premium', price: 18, category: 'karate', store: 'Artes Marciales Perú', rating: 4.6, img: '🎗️', desc: 'Algodón reforzado de doble capa. Disponible en todos los colores de grado.' },
  { id: 's17', name: 'Protector Bucal Karate', price: 15, category: 'karate', store: 'Artes Marciales Perú', rating: 4.5, img: '😁', desc: 'Doble capa de silicona termoplástica. Moldeable con agua caliente.' },
  { id: 's18', name: 'Set Protectores Karate Niño', price: 65, category: 'karate', store: 'Artes Marciales Perú', rating: 4.7, img: '🛡️', desc: 'Incluye: peto, casco, tibiales, guantes y bucal. Para niños 5-12 años.' },

  // Natación
  { id: 's19', name: 'Traje de Baño Competencia', price: 55, category: 'natacion', store: 'AquaSport', rating: 4.8, img: '🩱', desc: 'Lycra de alta resistencia al cloro. Reduce resistencia hidrodinámica.' },
  { id: 's20', name: 'Lentes Natación Antivaho', price: 28, category: 'natacion', store: 'AquaSport', rating: 4.9, img: '🥽', desc: 'Cristal de policarbonato UV400. Junta de silicona doble para máxima estanqueidad.' },
  { id: 's21', name: 'Gorro Silicona Natación', price: 12, category: 'natacion', store: 'AquaSport', rating: 4.6, img: '🏊', desc: 'Silicona de alta calidad. No tira el cabello. Varios colores disponibles.' },
  { id: 's22', name: 'Tabla de Natación Pull-Boy', price: 20, category: 'natacion', store: 'AquaSport', rating: 4.5, img: '🏄', desc: 'EVA de alta densidad. Para entrenamiento de piernas y brazos por separado.' },

  // Box
  { id: 's23', name: 'Guantes de Box Cuero 16oz', price: 95, category: 'box', store: 'KO Fighter', rating: 4.9, img: '🥊', desc: 'Cuero genuino con relleno de espuma triple densidad. Para saco y sparring.' },
  { id: 's24', name: 'Vendas Boxeo 3.5m x2', price: 18, category: 'box', store: 'KO Fighter', rating: 4.7, img: '🩹', desc: 'Semielásticas de algodón. Protegen muñeca, nudillos y metacarpos.' },
  { id: 's25', name: 'Casco Box con Visor', price: 75, category: 'box', store: 'KO Fighter', rating: 4.8, img: '⛑️', desc: 'Cuero sintético de alta densidad. Protección mejorada en pómulos y mentón.' },

  // Fútbol
  { id: 's26', name: 'Balón Fútbol Pro Match', price: 45, category: 'futbol', store: 'Gol Total Sport', rating: 4.8, img: '⚽', desc: 'PU de 32 paneles termosoldados. Talla 5 oficial. Para césped natural y sintético.' },
  { id: 's27', name: 'Canilleras Fútbol Fibra', price: 22, category: 'futbol', store: 'Gol Total Sport', rating: 4.6, img: '🦵', desc: 'Fibra de carbono ultraligera. Con tobillera integrada de neoprene.' },
  { id: 's28', name: 'Guantes Portero Pro', price: 55, category: 'futbol', store: 'Gol Total Sport', rating: 4.7, img: '🧤', desc: 'Látex negativo para máximo agarre. Cierre con doble velcro regulable.' },
];

// Producto de la tienda de demostración y su versión en el carrito
type StoreProduct = typeof SPORTS_STORE_PRODUCTS[number];
type StoreCartItem = StoreProduct & { qty: number };

const ProductCard: React.FC<{ product: StoreProduct; onAdd: (p: StoreProduct) => void }> = ({ product, onAdd }) => (
  <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}
    whileHover={{ y: -3 }}
    className="glass-card border border-white/5 hover:border-primary/30 transition-all flex flex-col overflow-hidden group">
    <div className="h-36 bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center text-6xl">
      {product.img}
    </div>
    <div className="p-4 flex flex-col flex-grow">
      <div className="flex items-start justify-between gap-2 mb-1">
        <h3 className="text-white font-bold text-sm leading-tight">{product.name}</h3>
        <span className="text-primary-light font-bold text-sm shrink-0">${product.price}</span>
      </div>
      <p className="text-slate-500 text-xs mb-1">{product.store}</p>
      <p className="text-slate-400 text-xs line-clamp-2 flex-grow">{product.desc}</p>
      <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/5">
        <span className="text-yellow-400 text-xs flex items-center gap-1">
          <Star className="w-3 h-3 fill-yellow-400" /> {product.rating}
        </span>
        <button onClick={() => onAdd(product)}
          className="bg-primary/10 hover:bg-primary text-primary-light hover:text-white border border-primary/20 hover:border-primary px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1">
          <ShoppingCart className="w-3.5 h-3.5" /> Agregar
        </button>
      </div>
    </div>
  </motion.div>
);

const SportStorePage: React.FC = () => {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [cart, setCart] = useState<StoreCartItem[]>([]);
  const [showCart, setShowCart] = useState(false);

  const filtered = SPORTS_STORE_PRODUCTS.filter(p => {
    const matchSearch = !search || p.name.toLowerCase().includes(search.toLowerCase()) || p.store.toLowerCase().includes(search.toLowerCase());
    const matchCat = !category || p.category === category;
    return matchSearch && matchCat;
  });

  const addToCart = (product: StoreProduct) => {
    setCart(prev => {
      const exists = prev.find(i => i.id === product.id);
      if (exists) return prev.map(i => i.id === product.id ? { ...i, qty: i.qty + 1 } : i);
      return [...prev, { ...product, qty: 1 }];
    });
    toast.success(`${product.name} agregado al carrito 🛒`);
  };

  const cartTotal = cart.reduce((sum, i) => sum + i.price * i.qty, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <ShoppingBag className="text-primary-light" /> Tienda Deportiva
          </h1>
          <p className="text-slate-400 mt-1">Equipamiento, ropa y suplementos para tu deporte favorito.</p>
        </div>
        <button onClick={() => setShowCart(true)} className="relative bg-primary/10 hover:bg-primary/20 border border-primary/20 text-primary-light px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-all">
          <ShoppingCart className="w-5 h-5" /> Carrito
          {cart.length > 0 && <span className="absolute -top-2 -right-2 bg-primary text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold">{cart.reduce((s, i) => s + i.qty, 0)}</span>}
        </button>
      </div>

      {/* Search + Filters */}
      <div className="space-y-3">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4" />
          <input type="text" placeholder="Buscar producto o tienda..."
            value={search} onChange={e => setSearch(e.target.value)}
            className="w-full bg-slate-900 border border-white/10 rounded-xl py-3 pl-11 pr-4 text-white outline-none focus:border-primary transition-all" />
        </div>
        <div className="flex flex-wrap gap-2">
          {SPORT_CATEGORIES.map(c => (
            <button key={c.value} onClick={() => setCategory(c.value)}
              className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-all ${category === c.value ? 'bg-primary text-white border-primary' : 'bg-white/5 text-slate-400 border-white/10 hover:border-white/30'}`}>
              {c.label}
            </button>
          ))}
        </div>
        <p className="text-slate-500 text-xs">{filtered.length} productos encontrados</p>
      </div>

      {/* Products Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {filtered.map(p => <ProductCard key={p.id} product={p} onAdd={addToCart} />)}
        {filtered.length === 0 && (
          <div className="col-span-full glass-card p-12 text-center text-slate-500">
            <Package className="w-10 h-10 mx-auto mb-3 text-slate-700" />
            No se encontraron productos para "{search}".
          </div>
        )}
      </div>

      {/* Cart Drawer */}
      {showCart && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div onClick={() => setShowCart(false)} className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
            className="relative w-full max-w-sm bg-slate-900 border-l border-white/10 h-full flex flex-col shadow-2xl z-10">
            <div className="p-5 border-b border-white/10 flex justify-between items-center">
              <h2 className="text-white font-bold text-lg">🛒 Mi Carrito</h2>
              <button onClick={() => setShowCart(false)} className="text-slate-400 hover:text-white"><X className="w-5 h-5" /></button>
            </div>
            <div className="flex-grow overflow-y-auto p-5 space-y-4">
              {cart.length === 0 ? (
                <p className="text-slate-500 text-center mt-12">Tu carrito está vacío.</p>
              ) : cart.map(item => (
                <div key={item.id} className="flex items-center gap-3 glass-card p-3 border-white/5">
                  <span className="text-3xl">{item.img}</span>
                  <div className="flex-grow min-w-0">
                    <p className="text-white text-sm font-bold truncate">{item.name}</p>
                    <p className="text-slate-400 text-xs">${item.price} × {item.qty}</p>
                  </div>
                  <button onClick={() => setCart(prev => prev.filter(i => i.id !== item.id))}
                    className="text-slate-600 hover:text-red-400"><X className="w-4 h-4" /></button>
                </div>
              ))}
            </div>
            {cart.length > 0 && (
              <div className="p-5 border-t border-white/10 space-y-3">
                <div className="flex justify-between text-white font-bold text-lg">
                  <span>Total:</span><span>${cartTotal.toFixed(0)}</span>
                </div>
                <button onClick={() => { toast.success('¡Pedido procesado! Próximamente con pago real.'); setCart([]); setShowCart(false); }}
                  className="btn-primary w-full py-3 text-center">
                  Proceder al Pago
                </button>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default SportStorePage;
