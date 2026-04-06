import React, { useState, useEffect } from 'react';
import api from '../../api/api-client';
import { motion } from 'framer-motion';
import { MapPin, Navigation, Map, Navigation2 } from 'lucide-react';

const MapSearchPage: React.FC = () => {
  const [gyms, setGyms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchGyms = async () => {
      try {
        const { data } = await api.get('/gyms');
        setGyms(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchGyms();
  }, []);

  return (
    <div className="space-y-6 h-[calc(100vh-120px)] flex flex-col">
      <header className="flex-shrink-0">
        <h1 className="text-3xl font-bold text-white flex items-center gap-3">
          <Map className="text-primary-light" /> Descubrir Gimnasios
        </h1>
        <p className="text-slate-400 mt-2">Encuentra los mejores centros deportivos cerca de ti usando geolocalización.</p>
      </header>

      <div className="flex-grow flex gap-6 relative">
        {/* Mock Map Container */}
        <div className="w-2/3 bg-slate-800/50 rounded-3xl border border-white/10 relative overflow-hidden hidden lg:block">
          <div className="absolute inset-0 pattern-dots opacity-20"></div>
          <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-500">
             <Navigation className="w-24 h-24 mb-4 text-slate-700 animate-pulse" />
             <p className="text-xl font-bold">Mapa Interactivo (Módulo de Fase 1)</p>
             <p className="text-sm mt-2">Aquí se visualizarán los gimnasios que tienen lat/lng usando Google Maps.</p>
          </div>
          
          {/* Simulated Map Pins */}
          {!loading && gyms.length > 0 && (
             <div className="absolute top-1/3 left-1/3 flex flex-col items-center group cursor-pointer">
               <div className="bg-primary text-white p-2 text-xs rounded-lg font-bold shadow-xl absolute -top-10 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                 {gyms[0].name}
               </div>
               <MapPin className="text-primary-light w-10 h-10 -mt-5" fill="currentColor" />
             </div>
          )}
        </div>

        {/* List Container */}
        <div className="w-full lg:w-1/3 flex flex-col gap-4 overflow-y-auto pr-2 pb-10">
          <div className="glass-card p-4 flex items-center justify-between border-white/5 bg-primary/10 mb-2">
            <div>
              <p className="text-white font-bold text-sm">Gimnasios Cercanos</p>
              <p className="text-primary-light text-xs">Basado en tu ubicación</p>
            </div>
            <button className="bg-primary-dark/50 p-2 rounded-lg text-primary-light hover:bg-primary transition-colors hover:text-white">
              <Navigation2 className="w-5 h-5" />
            </button>
          </div>

          {loading ? (
             <p className="text-slate-500 text-center py-10">Buscando señales GPS...</p>
          ) : gyms.length === 0 ? (
             <p className="text-slate-500 text-center py-10">No se encontraron gimnasios.</p>
          ) : (
            gyms.map(gym => (
              <motion.div 
                whileHover={{ x: 5 }}
                key={gym.id} 
                className="glass-card p-5 border-white/5 hover:border-primary-light/30 cursor-pointer relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 py-1 px-3 bg-white/10 text-xs font-bold rounded-bl-xl text-primary-light">
                  A 2.5 km
                </div>
                <h3 className="text-white font-bold text-lg mb-1 pr-16">{gym.name}</h3>
                <p className="text-slate-400 text-sm mb-3 flex items-start gap-1">
                  <MapPin className="w-4 h-4 shrink-0 mt-0.5" />
                  <span className="line-clamp-2">{gym.address}, {gym.city}</span>
                </p>
                <div className="flex justify-between items-center text-xs">
                  <span className="bg-slate-800 text-slate-300 px-2 py-1 rounded">Valoración 4.8</span>
                  <button className="text-primary-light font-bold hover:underline">Ver detalles</button>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default MapSearchPage;
