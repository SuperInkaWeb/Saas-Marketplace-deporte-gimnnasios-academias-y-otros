import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/auth-context';
import { motion } from 'framer-motion';
import { 
  Building2, 
  Dumbbell, 
  Users, 
  Search, 
  ArrowRight, 
  ShieldCheck 
} from 'lucide-react';
import LeagueHero from '../../components/league/LeagueHero';
import LeagueFlyers from '../../components/league/LeagueFlyers';
import { LEAGUE_CAMPAIGN, isLeagueActive } from '../../components/league/leagueCampaign';

const LandingPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [currentImage, setCurrentImage] = useState(0);
  const leagueActive = isLeagueActive();

  const carouselImages = [
    'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=1920&q=80', // Gym/Crossfit (High energy)
    'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?auto=format&fit=crop&w=1920&q=80', // Coach/Personal trainer
    'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=1920&q=80'  // Athlete track / Running
  ];

  useEffect(() => {
    // Con la campaña activa el fondo es el banner fijo del evento: no hace falta rotar.
    if (leagueActive) return;
    const interval = setInterval(() => {
      setCurrentImage((prev) => (prev + 1) % carouselImages.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [leagueActive]);

  const handlePortalAccess = () => {
    if (user) {
      if (user.role === 'ADMIN') navigate('/super-admin');
      else if (user.role === 'GYM_OWNER') navigate('/owner-dashboard');
      else if (user.role === 'TRAINER') navigate('/coach-dashboard');
      else navigate('/dashboard');
    } else {
      navigate('/login');
    }
  };

  // CTA de HERCIX League: con sesión va al panel; sin sesión, a ingresar/registrarse.
  const handleLeagueCta = (path: string) => {
    if (user) handlePortalAccess();
    else navigate(path);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    handlePortalAccess();
  };

  const categories = [
    '#Crossfit',
    '#Gimnasios',
    '#MMA',
    '#EntrenamientoFuncional',
    '#Nutrición',
    '#Spinning',
    '#Yoga'
  ];

  const pillars = [
    {
      title: 'Academias & Gimnasios',
      icon: Building2,
      desc: 'Control comercial de membresías, facturación automatizada y reportes en tiempo real para tu negocio deportivo.',
      color: 'border-primary/20 hover:border-primary/50 text-primary-lightHover',
      accentBg: 'bg-primary/10 text-primary',
      bullets: ['Control de accesos QR', 'Pasarela integrada PayMe', 'Módulo de contratos automáticos']
    },
    {
      title: 'Coaches & Profesionales',
      icon: Dumbbell,
      desc: 'Diseño inteligente de rutinas con IA, agenda digital de clases y seguimiento personalizado del rendimiento físico.',
      color: 'border-accent/20 hover:border-accent/50 text-accentHover',
      accentBg: 'bg-accent/10 text-accent',
      bullets: ['Generador de rutinas con Gemini', 'Agenda interactiva', 'Monitoreo de asistencia digital']
    },
    {
      title: 'Atletas & Usuarios',
      icon: Users,
      desc: 'Reserva tus clases al instante, conecta tus wearables de salud y compra suplementos en el marketplace exclusivo.',
      color: 'border-green-500/20 hover:border-green-500/50 text-green-400',
      accentBg: 'bg-green-500/10 text-green-400',
      bullets: ['Sincronización de Fitbit/Apple', 'Buscador con mapas interactivos', 'Chat motivacional de IA']
    }
  ];

  return (
    <div className="bg-background-darker min-h-screen text-white overflow-hidden font-sans relative">
      {/* Background Image Carousel with smooth cross-fade */}
      <div className="absolute inset-0 z-0 transition-opacity duration-1000 ease-in-out pointer-events-none overflow-hidden">
        {leagueActive && (
          <div
            className="absolute inset-x-0 top-0 h-[900px] md:h-[1000px] bg-cover bg-[center_30%] opacity-45"
            style={{ backgroundImage: `url(${LEAGUE_CAMPAIGN.heroImage})` }}
          >
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background-darker/40 to-background-darker"></div>
          </div>
        )}
        {!leagueActive && carouselImages.map((img, index) => (
          <div
            key={index}
            className={`absolute inset-0 bg-cover bg-center transition-opacity duration-1000 ease-in-out ${
              index === currentImage ? 'opacity-20' : 'opacity-0'
            }`}
            style={{ backgroundImage: `url(${img})` }}
          />
        ))}
        {/* Dark gradient overlay to ensure text is perfectly readable and beautiful */}
        <div className="absolute inset-0 bg-gradient-to-b from-background-darker/60 via-background-darker/80 to-background-darker"></div>
      </div>

      {/* Dynamic Glowing Accents */}
      <div className="absolute top-[-20%] left-[-10%] rounded-full w-[800px] h-[800px] bg-primary/5 blur-[150px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] rounded-full w-[800px] h-[800px] bg-accent/5 blur-[150px] pointer-events-none"></div>

      {/* Header / Navigation Bar */}
      <header className="sticky top-0 z-50 backdrop-blur-md bg-background-darker/75 border-b border-white/5 px-6 py-4 transition-all duration-300">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/')}>
            <img src="/hercix-logo.png" alt="Hercix" className="h-10 object-contain" />
          </div>

          {/* Nav Items (Desktop) */}
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-300">
            <span onClick={handlePortalAccess} className="hover:text-primary-lightHover cursor-pointer transition-colors">Marketplace</span>
            <span onClick={handlePortalAccess} className="hover:text-primary-lightHover cursor-pointer transition-colors">Gimnasios</span>
            <span onClick={handlePortalAccess} className="hover:text-primary-lightHover cursor-pointer transition-colors">Profesionales</span>
            <span onClick={handlePortalAccess} className="hover:text-primary-lightHover cursor-pointer transition-colors">IA Health</span>
          </nav>

          {/* Access Buttons */}
          <div className="flex items-center gap-4">
            {user ? (
              <button 
                onClick={handlePortalAccess} 
                className="text-sm font-semibold bg-white text-black hover:bg-slate-200 px-6 py-2.5 rounded-full transition-all shadow-lg hover:scale-105 active:scale-95 duration-200"
              >
                Ir al Panel
              </button>
            ) : (
              <>
                <button 
                  onClick={() => navigate('/login')} 
                  className="text-sm font-semibold text-slate-200 hover:text-white px-4 py-2 rounded-lg hover:bg-white/5 transition-all"
                >
                  Ingresar
                </button>
                <button 
                  onClick={() => navigate('/login')} 
                  className="text-sm font-semibold bg-white text-black hover:bg-slate-200 px-5 py-2.5 rounded-full transition-all shadow-lg hover:scale-105 active:scale-95 duration-200"
                >
                  Registrarse
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-6 pt-16 pb-24 relative z-10 flex flex-col items-center">
        {leagueActive ? (
          <>
            <LeagueHero onJoin={() => handleLeagueCta('/login')} />
            <LeagueFlyers onCta={handleLeagueCta} />
          </>
        ) : (
        <>
        {/* Badge Notification */}
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="inline-flex items-center gap-2 bg-gradient-to-r from-primary/15 to-accent/15 border border-white/10 px-4 py-1.5 rounded-full text-xs font-semibold tracking-wider text-slate-200 mb-8"
        >
          <span className="w-2 h-2 rounded-full bg-accent animate-pulse"></span>
          ¡BIENVENIDO A LA NUEVA INTELIGENCIA DEPORTIVA!
        </motion.div>

        {/* Hero Main Headlines */}
        <motion.h1 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="text-5xl md:text-7xl font-black text-center tracking-tight leading-none max-w-4xl"
        >
          MÁXIMO <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary via-accent to-green-400">RENDIMIENTO.</span>
          <br />
          <span className="text-white">INTELIGENCIA DEPORTIVA.</span>
        </motion.h1>

        {/* Hero Subtitle */}
        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-slate-400 text-lg md:text-xl text-center max-w-2xl mt-6 leading-relaxed"
        >
          La suite definitiva para dueños de gimnasios, entrenadores y atletas. Gestiona, entrena y optimiza tu salud en una sola marca unificada.
        </motion.p>

        {/* Search Bar Block (AbogHub style but Sports themed) */}
        <motion.form 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          onSubmit={handleSearch}
          className="w-full max-w-3xl mt-12 bg-white/5 border border-white/10 hover:border-white/20 p-2 rounded-2xl md:rounded-full flex flex-col md:flex-row gap-2 shadow-2xl backdrop-blur-lg"
        >
          <div className="flex-1 flex items-center gap-3 px-4 py-2">
            <Search className="text-slate-400 w-5 h-5 flex-shrink-0" />
            <input 
              type="text" 
              placeholder="Busca por especialidad, nombre de gimnasio o entrenador..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-transparent border-none outline-none w-full text-white placeholder-slate-400 text-base"
            />
          </div>
          <button 
            type="submit"
            className="bg-white text-black hover:bg-slate-200 px-8 py-3.5 rounded-xl md:rounded-full font-bold flex items-center justify-center gap-2 hover:scale-[1.02] transition-all duration-200"
          >
            Buscar Ahora
            <ArrowRight className="w-4 h-4" />
          </button>
        </motion.form>

        {/* Category Tag Pills */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="flex flex-wrap items-center justify-center gap-3 mt-6 max-w-xl text-sm font-semibold text-slate-400"
        >
          {categories.map((c, i) => (
            <span 
              key={i} 
              onClick={handlePortalAccess}
              className="px-3.5 py-1 rounded-full border border-white/5 hover:border-white/10 hover:text-white cursor-pointer bg-white/[0.02] transition-all"
            >
              {c}
            </span>
          ))}
        </motion.div>
        </>
        )}

        {/* Features / Solutions Grid (Symmetric showcases) */}
        <section className="w-full max-w-6xl mt-32">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-black text-white tracking-tight">TRES ROLES, UNA SOLA PLATAFORMA</h2>
            <p className="text-slate-400 mt-2 text-base max-w-lg mx-auto">
              Hercix unifica y conecta a todo el ecosistema fitness en una sola base encriptada de alto rendimiento.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {pillars.map((p, i) => {
              const Icon = p.icon;
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: i * 0.1 }}
                  onClick={handlePortalAccess}
                  className={`bg-white/[0.02] border ${p.color} p-8 rounded-3xl flex flex-col justify-between hover:bg-white/[0.04] transition-all cursor-pointer group shadow-lg duration-300 hover:shadow-2xl hover:-translate-y-1`}
                >
                  <div>
                    {/* Icon & Title */}
                    <div className="flex items-center gap-4 mb-6">
                      <div className={`p-3 rounded-2xl ${p.accentBg} flex items-center justify-center`}>
                        <Icon className="w-6 h-6" />
                      </div>
                      <h3 className="text-xl font-bold text-white tracking-tight">{p.title}</h3>
                    </div>

                    {/* Description */}
                    <p className="text-slate-400 text-sm leading-relaxed mb-6">
                      {p.desc}
                    </p>

                    {/* Features list */}
                    <ul className="space-y-3 mb-8">
                      {p.bullets.map((b, bi) => (
                        <li key={bi} className="flex items-center gap-2 text-xs font-semibold text-slate-300">
                          <span className="w-1.5 h-1.5 rounded-full bg-accent"></span>
                          {b}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* CTA Arrow */}
                  <div className="flex items-center justify-between pt-4 border-t border-white/5 text-sm font-bold text-white group-hover:text-primary-lightHover transition-colors">
                    <span>Acceder a mi Portal</span>
                    <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1.5 transition-transform duration-300" />
                  </div>
                </motion.div>
              );
            })}
          </div>
        </section>

        {/* Small trust banner */}
        <section className="w-full max-w-6xl mt-28 border-t border-white/5 pt-12 flex flex-col md:flex-row items-center justify-between gap-6 text-slate-400 text-sm">
          <div className="flex items-center gap-2 font-semibold">
            <ShieldCheck className="text-green-500 w-5 h-5" />
            <span>Infraestructura Segura & Encriptación AES-256</span>
          </div>
          <div className="flex items-center gap-6">
            <span className="text-[10px] uppercase tracking-widest font-bold">© 2026 HERCIX | TODOS LOS DERECHOS RESERVADOS</span>
          </div>
        </section>
      </main>
    </div>
  );
};

export default LandingPage;
