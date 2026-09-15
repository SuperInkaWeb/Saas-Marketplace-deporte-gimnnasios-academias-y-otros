import React, { useState, useEffect } from 'react';
import api from '../../api/api-client';
import { toast } from 'sonner';
import { X, Loader2, Dumbbell, MapPin, Phone, Globe, Plus, Clock, CalendarDays, Navigation } from 'lucide-react';
import { motion } from 'framer-motion';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

const redPinIcon = L.divIcon({
  html: `
    <div class="relative flex items-center justify-center">
      <svg width="32" height="40" viewBox="0 0 24 30" fill="none" xmlns="http://www.w3.org/2000/svg" style="filter: drop-shadow(0px 4px 6px rgba(0, 0, 0, 0.4));">
        <path d="M12 0C5.37 0 0 5.37 0 12C0 21 12 30 12 30C12 30 24 21 24 12C24 5.37 18.63 0 12 0Z" fill="#ef4444"/>
        <circle cx="12" cy="12" r="5" fill="#0f172a" stroke="#ffffff" stroke-width="1.5"/>
      </svg>
    </div>
  `,
  className: 'custom-red-pin-icon',
  iconSize: [32, 40],
  iconAnchor: [16, 40],
});

const MapController = ({ position }: { position: [number, number] | null }) => {
  const map = useMap();
  useEffect(() => {
    if (position) {
      map.setView(position, map.getZoom());
    }
  }, [position, map]);
  return null;
};

const LocationMarker = ({ 
  position, 
  setPosition, 
  setFormData 
}: { 
  position: [number, number] | null; 
  setPosition: React.Dispatch<React.SetStateAction<[number, number] | null>>; 
  setFormData: React.Dispatch<React.SetStateAction<any>>; 
}) => {
  useMapEvents({
    click(e) {
      const { lat, lng } = e.latlng;
      setPosition([lat, lng]);
      setFormData((prev: any) => ({ ...prev, latitude: lat, longitude: lng }));
    },
  });

  return position === null ? null : (
    <Marker 
      position={position} 
      draggable={true}
      eventHandlers={{
        dragend(e) {
          const marker = e.target;
          const { lat, lng } = marker.getLatLng();
          setPosition([lat, lng]);
          setFormData((prev: any) => ({ ...prev, latitude: lat, longitude: lng }));
        }
      }}
      icon={redPinIcon}
    />
  );
};

const DAYS_OPTIONS = [
  'Lunes a Viernes',
  'Lunes a Sábado',
  'Lunes a Domingo',
  'Martes a Domingo',
  'Solo Fines de Semana',
];

const TIME_OPTIONS = [
  '04:00 AM', '05:00 AM', '06:00 AM', '07:00 AM', '08:00 AM', '09:00 AM', '10:00 AM', '11:00 AM', '12:00 PM',
  '01:00 PM', '02:00 PM', '03:00 PM', '04:00 PM', '05:00 PM', '06:00 PM', '07:00 PM', '08:00 PM',
  '09:00 PM', '10:00 PM', '11:00 PM', '12:00 AM',
];

interface CreateGymModalProps {
  onClose: () => void;
  onCreated: () => void;
  initialData?: any;
}

const AVAILABLE_SPORTS = [
  { id: 'Gimnasio', label: '🏋️ Gimnasio' },
  { id: 'Fútbol', label: '⚽ Fútbol' },
  { id: 'Vóley', label: '🏐 Vóley' },
  { id: 'Básquetbol', label: '🏀 Básquetbol' },
  { id: 'Tenis', label: '🎾 Tenis' },
  { id: 'Natación', label: '🏊 Natación' },
  { id: 'Box', label: '🥊 Box' },
  { id: 'Atletismo', label: '🏃 Atletismo' },
];

const CreateGymModal: React.FC<CreateGymModalProps> = ({ onClose, onCreated, initialData }) => {
  const parseAddress = (fullAddress: string) => {
    if (!fullAddress) return { address: '', urbanization: '' };
    const urbPattern = /,\s*(urb\.|urbanización|urbanizacion)\s*/i;
    const match = fullAddress.match(urbPattern);
    if (match && match.index !== undefined) {
      const address = fullAddress.substring(0, match.index).trim();
      const urbanization = fullAddress.substring(match.index + match[0].length).trim();
      return { address, urbanization };
    }
    return { address: fullAddress, urbanization: '' };
  };

  const parseDescription = (desc: string) => {
    if (!desc) return { cleanDesc: '', sports: [] as string[] };
    const marker = '\n\n[Categorías: ';
    const index = desc.lastIndexOf(marker);
    if (index !== -1) {
      const cleanDesc = desc.substring(0, index).trim();
      const sportsStr = desc.substring(index + marker.length, desc.length - 1);
      const sports = sportsStr.split(',').map(s => s.trim()).filter(Boolean);
      return { cleanDesc, sports };
    }
    return { cleanDesc: desc, sports: [] as string[] };
  };

  const parsed = parseAddress(initialData?.address || '');
  const parsedDesc = parseDescription(initialData?.description || '');

  const [formData, setFormData] = useState({
    name: initialData?.name || '',
    description: parsedDesc.cleanDesc,
    address: parsed.address,
    urbanization: parsed.urbanization,
    city: initialData?.city || '',
    district: initialData?.district || '',
    province: initialData?.province || '',
    phone: initialData?.phone || '',
    website: initialData?.website || '',
    openDays: initialData?.openDays || 'Lunes a Sábado',
    openTime: initialData?.openTime || '06:00 AM',
    closeTime: initialData?.closeTime || '10:00 PM',
    logoUrl: initialData?.logoUrl || '',
    latitude: initialData?.latitude || undefined,
    longitude: initialData?.longitude || undefined,
  });

  const [selectedSports, setSelectedSports] = useState<string[]>(parsedDesc.sports);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [position, setPosition] = useState<[number, number] | null>(
    initialData?.latitude && initialData?.longitude 
      ? [initialData.latitude, initialData.longitude] 
      : null
  );
  
  const [renderMap, setRenderMap] = useState(false);
  const [searchingCoords, setSearchingCoords] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setRenderMap(true), 350);
    return () => clearTimeout(timer);
  }, []);

  const locateAddressOnMap = async () => {
    if (!formData.address) {
      alert("Por favor ingresa primero la dirección física.");
      return;
    }
    setSearchingCoords(true);
    try {
      // 1. Intento con dirección completa (con urbanización si existe)
      const fullAddressQuery = formData.urbanization 
        ? `${formData.address}, Urb. ${formData.urbanization}` 
        : formData.address;
      const queryParts = [fullAddressQuery, formData.district, formData.province, formData.city].filter(Boolean);
      const query = queryParts.join(', ');
      
      let response = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1`, {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'User-Agent': 'HercixPlatform/1.0 (contact@hercix.com)'
        }
      });
      let data = await response.json();

      // 2. Si falló y teníamos urbanización, intentamos sin urbanización
      if ((!Array.isArray(data) || data.length === 0) && formData.urbanization) {
        const fallbackParts = [formData.address, formData.district, formData.province, formData.city].filter(Boolean);
        const fallbackQuery = fallbackParts.join(', ');
        response = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(fallbackQuery)}&format=json&limit=1`, {
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'User-Agent': 'HercixPlatform/1.0 (contact@hercix.com)'
          }
        });
        data = await response.json();
      }

      // 3. Si sigue fallando, intentamos una búsqueda muy simplificada: dirección y distrito
      if (!Array.isArray(data) || data.length === 0) {
        const superFallbackParts = [formData.address, formData.district].filter(Boolean);
        const superFallbackQuery = superFallbackParts.join(', ');
        response = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(superFallbackQuery)}&format=json&limit=1`, {
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'User-Agent': 'HercixPlatform/1.0 (contact@hercix.com)'
          }
        });
        data = await response.json();
      }

      if (Array.isArray(data) && data.length > 0) {
        const lat = parseFloat(data[0].lat);
        const lon = parseFloat(data[0].lon);
        setPosition([lat, lon]);
        setFormData(prev => ({ ...prev, latitude: lat, longitude: lon }));
      } else {
        alert("No se pudo ubicar la dirección automáticamente. Por favor haz clic directamente en el mapa para posicionar el pin rojo.");
      }
    } catch (err) {
      console.error(err);
      alert("Error buscando la dirección. Intenta colocar el pin manualmente haciendo clic en el mapa.");
    } finally {
      setSearchingCoords(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const finalAddress = formData.urbanization 
      ? `${formData.address}, Urb. ${formData.urbanization}` 
      : formData.address;

    const finalDescription = selectedSports.length > 0
      ? `${formData.description}\n\n[Categorías: ${selectedSports.join(', ')}]`
      : formData.description;

    const payload = {
      ...formData,
      description: finalDescription,
      address: finalAddress,
    };
    delete (payload as any).urbanization;

    try {
      const { data: savedGym } = initialData
        ? await api.patch(`/gyms/${initialData.id}`, payload)
        : await api.post('/gyms', payload);

      if (savedGym?.locationSource === 'APPROXIMATE') {
        toast.warning('⚠️ No pudimos encontrar la dirección exacta en el mapa', {
          description: 'Usamos una ubicación aproximada de la zona. Edita el gimnasio y ajusta el pin rojo manualmente para que aparezca en el sitio correcto.',
          duration: 8000,
        });
      } else if (!savedGym?.latitude || !savedGym?.longitude) {
        toast.warning('⚠️ No pudimos ubicar tu negocio en el mapa', {
          description: 'La dirección o el distrito ingresados no se pudieron reconocer. Edita el gimnasio y fija el pin manualmente en el mapa para que aparezca en discovery.',
          duration: 8000,
        });
      }

      onCreated();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al guardar el gimnasio');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="glass-card w-full max-w-lg bg-slate-900 border-white/10 p-8 relative max-h-[90vh] overflow-y-auto"
      >
        <button onClick={onClose} className="absolute top-6 right-6 text-slate-500 hover:text-white transition-colors">
          <X />
        </button>

        <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
          <Dumbbell className="text-primary-light" /> {initialData ? 'Editar Gimnasio' : 'Registrar Mi Gimnasio'}
        </h2>

        {error && (
          <div className="bg-red-500/10 border-red-500/20 p-4 border rounded-xl text-red-400 text-sm mb-6">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Nombre */}
          <div className="space-y-2">
            <label className="text-slate-400 text-xs font-bold uppercase tracking-wider">Nombre del Gimnasio / Academia</label>
            <input
              required
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
              className="bg-white/5 border-white/10 focus:border-primary-light w-full py-3 px-4 border rounded-xl text-white outline-none"
              placeholder="Ej: Elite Fitness Center"
            />
          </div>

          {/* Descripción */}
          <div className="space-y-2">
            <label className="text-slate-400 text-xs font-bold uppercase tracking-wider">Descripción</label>
            <textarea
              value={formData.description}
              onChange={e => setFormData({ ...formData, description: e.target.value })}
              className="bg-white/5 border-white/10 focus:border-primary-light w-full py-3 px-4 border rounded-xl text-white outline-none min-h-[80px]"
              placeholder="Cuenta un poco sobre tu gimnasio..."
            />
          </div>

          {/* Categorías Deportivas */}
          <div className="space-y-3">
            <label className="text-slate-400 text-xs font-bold uppercase tracking-wider block">
              🏷️ Categorías / Deportes que ofrece
            </label>
            <div className="grid grid-cols-2 gap-3">
              {AVAILABLE_SPORTS.map((sport) => {
                const isSelected = selectedSports.includes(sport.id);
                return (
                  <button
                    key={sport.id}
                    type="button"
                    onClick={() => {
                      if (isSelected) {
                        setSelectedSports(selectedSports.filter(s => s !== sport.id));
                      } else {
                        setSelectedSports([...selectedSports, sport.id]);
                      }
                    }}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl border text-left transition-all ${
                      isSelected
                        ? 'bg-primary/20 border-primary text-white shadow-lg shadow-primary/10'
                        : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    <div className={`w-5 h-5 rounded flex items-center justify-center border transition-colors ${
                      isSelected ? 'bg-primary border-primary text-white' : 'border-white/20'
                    }`}>
                      {isSelected && (
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>
                    <span className="text-xs font-bold">{sport.label}</span>
                  </button>
                );
              })}
            </div>
            <p className="text-[10px] text-slate-500 italic">
              * Selecciona uno o más deportes para aparecer en los filtros del buscador y mapa de Hercix.
            </p>
          </div>

          {/* Imagen de Portada / Logo */}
          <div className="space-y-2">
            <label className="text-slate-400 text-xs font-bold uppercase tracking-wider flex items-center justify-between">
              <span>🖼️ Imagen de Portada / Logo</span>
              <span className="text-[10px] text-slate-500 normal-case">(Subir archivo local o pegar URL)</span>
            </label>
            
            <div className="flex flex-col sm:flex-row gap-3">
              {/* Paste URL */}
              <input
                value={formData.logoUrl}
                onChange={e => setFormData({ ...formData, logoUrl: e.target.value })}
                className="bg-white/5 border-white/10 focus:border-primary-light flex-grow py-3 px-4 border rounded-xl text-white outline-none text-sm"
                placeholder="Pegar enlace https://..."
              />
              
              {/* Local File Selector Button */}
              <label className="bg-primary/20 hover:bg-primary text-primary-light hover:text-white border border-primary/30 px-4 py-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shrink-0">
                <span>📁 Subir desde mi PC</span>
                <input 
                  type="file" 
                  accept="image/*" 
                  className="hidden" 
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      // Validar límite de 5MB
                      if (file.size > 5 * 1024 * 1024) {
                        alert("La imagen es demasiado grande. Para mantener una carga veloz en móviles y excelente calidad, el límite es de 5MB (Recomendado: menos de 2MB).");
                        return;
                      }
                      const reader = new FileReader();
                      reader.onloadend = () => {
                        setFormData({ ...formData, logoUrl: reader.result as string });
                      };
                      reader.readAsDataURL(file);
                    }
                  }} 
                />
              </label>
            </div>

            {/* Premium Preview */}
            {formData.logoUrl && (
              <div className="relative h-28 w-full rounded-xl overflow-hidden mt-3 border border-white/10 group">
                <img 
                  src={formData.logoUrl} 
                  alt="Vista previa" 
                  className="w-full h-full object-cover" 
                />
                <button 
                  type="button"
                  onClick={() => setFormData({ ...formData, logoUrl: '' })}
                  className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white p-1.5 rounded-lg text-xs font-bold transition-colors"
                >
                  ✕ Quitar
                </button>
              </div>
            )}
          </div>

          {/* Dirección */}
          <div className="space-y-2">
            <label className="text-slate-400 text-xs font-bold uppercase tracking-wider">Dirección Física (Ej: Manzana D Lote 40)</label>
            <div className="flex gap-2">
              <div className="relative flex-grow">
                <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-primary-light w-4 h-4" />
                <input
                  required
                  value={formData.address}
                  onChange={e => setFormData({ ...formData, address: e.target.value })}
                  className="bg-white/5 border-white/10 focus:border-primary-light w-full py-3 pl-12 pr-4 border rounded-xl text-white outline-none"
                  placeholder="Av. Principal 123, Ciudad"
                />
              </div>
              <button
                type="button"
                onClick={locateAddressOnMap}
                disabled={searchingCoords}
                className="bg-primary/20 hover:bg-primary border border-primary/30 text-primary-light hover:text-white px-4 py-3 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 active:scale-95 disabled:opacity-50"
              >
                {searchingCoords ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Navigation className="w-3.5 h-3.5" />
                )}
                <span>Ubicar</span>
              </button>
            </div>

            {/* Interactive Map Selector */}
            <div className="space-y-1.5 mt-2">
              <label className="text-slate-500 text-[11px] font-medium flex items-center justify-between">
                <span>📍 Ubicación en el Mapa</span>
                {formData.latitude && formData.longitude ? (
                  <span className="text-emerald-400 font-bold">Ubicación fijada ✓</span>
                ) : (
                  <span className="text-amber-400 font-bold">Ubicación no fijada (se usará aproximación)</span>
                )}
              </label>
              
              <div className="h-52 w-full rounded-2xl border border-white/10 overflow-hidden relative z-10 bg-slate-950">
                {renderMap ? (
                  <MapContainer
                    center={position || [-12.085, -77.03]}
                    zoom={13}
                    style={{ width: '100%', height: '100%' }}
                    zoomControl={false}
                  >
                    <TileLayer
                      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
                      url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                    />
                    <LocationMarker 
                      position={position} 
                      setPosition={setPosition} 
                      setFormData={setFormData} 
                    />
                    <MapController position={position} />
                  </MapContainer>
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-500 text-xs gap-2">
                    <Loader2 className="w-4 h-4 animate-spin text-primary" />
                    <span>Cargando mapa interactivo...</span>
                  </div>
                )}
              </div>
              <p className="text-[10px] text-slate-400 leading-relaxed italic">
                * Haz clic en el mapa o arrastra el marcador rojo para posicionar tu gimnasio de forma exacta.
              </p>
              {formData.latitude && formData.longitude && (
                <div className="bg-slate-950/50 border border-white/5 rounded-lg p-2 text-[10px] text-slate-400 font-mono flex justify-between items-center">
                  <span>Lat: {formData.latitude.toFixed(6)}</span>
                  <span>Lng: {formData.longitude.toFixed(6)}</span>
                  <button
                    type="button"
                    onClick={() => {
                      setPosition(null);
                      setFormData((prev: any) => ({ ...prev, latitude: undefined, longitude: undefined }));
                    }}
                    className="text-red-400 hover:text-red-300 font-bold uppercase tracking-wider text-[9px]"
                  >
                    Limpiar
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Urbanización */}
          <div className="space-y-2">
            <label className="text-slate-400 text-xs font-bold uppercase tracking-wider">Urbanización (Ej: Las Begonias)</label>
            <input
              value={formData.urbanization}
              onChange={e => setFormData({ ...formData, urbanization: e.target.value })}
              className="bg-white/5 border-white/10 focus:border-primary-light w-full py-3 px-4 border rounded-xl text-white outline-none"
              placeholder="Urb. Nombre de tu Urbanización"
            />
          </div>

          {/* Departamento, Provincia, Distrito */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-slate-400 text-xs font-bold uppercase tracking-wider">Departamento</label>
              <input
                value={formData.city}
                onChange={e => setFormData({ ...formData, city: e.target.value })}
                className="bg-white/5 border-white/10 focus:border-primary-light w-full py-3 px-4 border rounded-xl text-white outline-none"
                placeholder="Ej: Lima"
              />
            </div>
            <div className="space-y-2">
              <label className="text-slate-400 text-xs font-bold uppercase tracking-wider">Provincia</label>
              <input
                value={formData.province}
                onChange={e => setFormData({ ...formData, province: e.target.value })}
                className="bg-white/5 border-white/10 focus:border-primary-light w-full py-3 px-4 border rounded-xl text-white outline-none"
                placeholder="Ej: Lima"
              />
            </div>
            <div className="space-y-2">
              <label className="text-slate-400 text-xs font-bold uppercase tracking-wider">Distrito</label>
              <input
                value={formData.district}
                onChange={e => setFormData({ ...formData, district: e.target.value })}
                className="bg-white/5 border-white/10 focus:border-primary-light w-full py-3 px-4 border rounded-xl text-white outline-none"
                placeholder="Ej: Chorrillos"
              />
            </div>
          </div>

          {/* Teléfono y Web */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-slate-400 text-xs font-bold uppercase tracking-wider">Teléfono</label>
              <div className="relative">
                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-primary-light w-4 h-4" />
                <input
                  value={formData.phone}
                  onChange={e => setFormData({ ...formData, phone: e.target.value })}
                  className="bg-white/5 border-white/10 focus:border-primary-light w-full py-3 pl-12 pr-4 border rounded-xl text-white outline-none"
                  placeholder="+51 987..."
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-slate-400 text-xs font-bold uppercase tracking-wider">Sitio Web</label>
              <div className="relative">
                <Globe className="absolute left-4 top-1/2 -translate-y-1/2 text-primary-light w-4 h-4" />
                <input
                  value={formData.website}
                  onChange={e => setFormData({ ...formData, website: e.target.value })}
                  className="bg-white/5 border-white/10 focus:border-primary-light w-full py-3 pl-12 pr-4 border rounded-xl text-white outline-none"
                  placeholder="www.tusitio.com"
                />
              </div>
            </div>
          </div>

          {/* Horario */}
          <div className="space-y-3 border-t border-white/10 pt-5">
            <label className="text-slate-400 text-xs font-bold uppercase tracking-wider flex items-center gap-2">
              <Clock className="w-4 h-4 text-primary-light" /> Horario de Atención
            </label>

            {/* Días */}
            <div className="space-y-2">
              <label className="text-slate-500 text-xs">Días de apertura</label>
              <div className="relative">
                <CalendarDays className="absolute left-4 top-1/2 -translate-y-1/2 text-primary-light w-4 h-4" />
                <select
                  value={formData.openDays}
                  onChange={e => setFormData({ ...formData, openDays: e.target.value })}
                  className="bg-white/5 border-white/10 focus:border-primary-light w-full py-3 pl-12 pr-4 border rounded-xl text-white outline-none appearance-none"
                >
                  {DAYS_OPTIONS.map(d => <option key={d} value={d} className="bg-slate-900">{d}</option>)}
                </select>
              </div>
            </div>

            {/* Apertura y Cierre */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-slate-500 text-xs">Hora de apertura</label>
                <select
                  value={formData.openTime}
                  onChange={e => setFormData({ ...formData, openTime: e.target.value })}
                  className="bg-white/5 border-white/10 focus:border-primary-light w-full py-3 px-4 border rounded-xl text-white outline-none appearance-none"
                >
                  {TIME_OPTIONS.map(t => <option key={t} value={t} className="bg-slate-900">{t}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-slate-500 text-xs">Hora de cierre</label>
                <select
                  value={formData.closeTime}
                  onChange={e => setFormData({ ...formData, closeTime: e.target.value })}
                  className="bg-white/5 border-white/10 focus:border-primary-light w-full py-3 px-4 border rounded-xl text-white outline-none appearance-none"
                >
                  {TIME_OPTIONS.map(t => <option key={t} value={t} className="bg-slate-900">{t}</option>)}
                </select>
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full py-4 mt-6 flex items-center justify-center gap-2 relative overflow-hidden active:scale-[0.98]"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Plus className="w-5 h-5" /> <span>{initialData ? 'Guardar Cambios' : 'Crear Gimnasio'}</span></>}
          </button>
        </form>
      </motion.div>
    </div>
  );
};

export default CreateGymModal;
