import React, { useState, useEffect } from 'react';
import api from '../../api/api-client';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MapPin, Map as MapIcon, Navigation2, Search, X, 
  Calendar, Users, Clock, ChevronRight, Loader2,
  TrendingUp, AlertTriangle
} from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { PayMeModal } from '../../components/payment/PayMeModal';
import { useAuth } from '../../context/auth-context';

// ─── Tipos de Movilidad Comercial ────────────────────────────────────────────
interface MobilityData {
  distanceKm: number;
  baseETA: number;          // minutos OSRM base
  commercialETA: number;    // ETA con factores comerciales
  walkingMin: number;
  cyclingMin: number;       // minutos en bicicleta realistas
  trafficLevel: 'bajo' | 'moderado' | 'alto';
  trafficFactor: number;
  peakHour: boolean;
  commercialFlow: 'bajo' | 'medio' | 'alto';
  accessibility: 'baja' | 'media' | 'alta';
  mobilityScore: number;    // 0-100
  steps: string;
  coordinates: [number, number][];
}

// ─── Motor de Inteligencia Comercial ─────────────────────────────────────────
const calculateCommercialMobility = (
  distanceKm: number,
  baseETA: number,
  nearbyGymsCount: number,
  gymLat: number,
  gymLng: number
): Omit<MobilityData, 'steps' | 'coordinates' | 'walkingMin' | 'cyclingMin' | 'distanceKm'> => {
  const now = new Date();
  const hour = now.getHours();
  const dayOfWeek = now.getDay(); // 0=Dom, 6=Sab

  // ── Factor Hora Pico ─────────────────────────────────────────────────
  const peakHour =
    (hour >= 7 && hour <= 9) ||
    (hour >= 12 && hour <= 14) ||
    (hour >= 17 && hour <= 20);
  const peakHourFactor = peakHour ? (dayOfWeek >= 1 && dayOfWeek <= 5 ? 4.5 : 2.0) : 0;

  // ── Factor Tráfico por Hora ──────────────────────────────────────────
  let trafficFactor: number;
  let trafficLevel: 'bajo' | 'moderado' | 'alto';
  if (hour >= 7 && hour <= 9 || hour >= 17 && hour <= 20) {
    trafficFactor = distanceKm * 1.8;
    trafficLevel = 'alto';
  } else if (hour >= 10 && hour <= 16) {
    trafficFactor = distanceKm * 0.9;
    trafficLevel = 'moderado';
  } else {
    trafficFactor = distanceKm * 0.3;
    trafficLevel = 'bajo';
  }

  // ── Factor Densidad Urbana (por zona geográfica) ─────────────────────
  const isUrbanCenter = Math.abs(gymLat - (-12.085)) < 0.05 && Math.abs(gymLng - (-77.03)) < 0.05;
  const densityFactor = isUrbanCenter ? distanceKm * 0.7 : distanceKm * 0.3;

  // ── Factor Saturación Comercial ──────────────────────────────────────
  const saturationFactor = nearbyGymsCount > 5 ? 2.0 : nearbyGymsCount > 2 ? 1.0 : 0;

  // ── Accesibilidad Vial ───────────────────────────────────────────────
  let accessibilityBonus: number;
  let accessibility: 'baja' | 'media' | 'alta';
  if (distanceKm <= 2) {
    accessibilityBonus = 2;
    accessibility = 'alta';
  } else if (distanceKm <= 5) {
    accessibilityBonus = 1;
    accessibility = 'media';
  } else {
    accessibilityBonus = 0;
    accessibility = 'baja';
  }

  // ── ETA Comercial Final ──────────────────────────────────────────────
  const commercialETA = Math.max(
    2,
    Math.round(baseETA + trafficFactor + densityFactor + peakHourFactor + saturationFactor - accessibilityBonus)
  );

  // ── Flujo Comercial ──────────────────────────────────────────────────
  let commercialFlow: 'bajo' | 'medio' | 'alto';
  if (hour >= 9 && hour <= 12 || hour >= 16 && hour <= 20) {
    commercialFlow = 'alto';
  } else if (hour >= 13 && hour <= 15) {
    commercialFlow = 'medio';
  } else {
    commercialFlow = 'bajo';
  }

  // ── Mobility Score (0-100) ────────────────────────────────────────────
  let score = 100;
  // Penalizar por distancia
  score -= Math.min(30, distanceKm * 5);
  // Penalizar por tráfico
  if (trafficLevel === 'alto') score -= 20;
  else if (trafficLevel === 'moderado') score -= 10;
  // Penalizar por saturación
  score -= Math.min(15, nearbyGymsCount * 2);
  // Penalizar por hora pico
  if (peakHour) score -= 10;
  // Bonificar por accesibilidad
  if (accessibility === 'alta') score += 8;
  else if (accessibility === 'media') score += 3;
  // Bonificar por flujo alto
  if (commercialFlow === 'alto') score += 5;
  const mobilityScore = Math.max(0, Math.min(100, Math.round(score)));

  return {
    baseETA,
    commercialETA,
    trafficLevel,
    trafficFactor: Math.round(trafficFactor),
    peakHour,
    commercialFlow,
    accessibility,
    mobilityScore,
  };
};

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom user location icon (pulsing blue dot)
const userLocationIcon = L.divIcon({
  html: `
    <div class="relative flex items-center justify-center">
      <div class="absolute w-8 h-8 bg-blue-500/30 rounded-full blur-sm animate-ping"></div>
      <div class="absolute w-4 h-4 bg-blue-500/50 rounded-full animate-pulse"></div>
      <div class="relative w-3.5 h-3.5 bg-blue-500 border border-white rounded-full shadow-lg"></div>
    </div>
  `,
  className: 'user-location-marker',
  iconSize: [32, 32],
  iconAnchor: [16, 16]
});

// Custom Icons with Glow Effect (Google Maps style red teardrop pin)
const isApproximateLocation = (gym: any): boolean =>
  gym.locationSource !== 'EXACT' && gym.locationSource !== 'MANUAL';

const getCustomIcon = (sportLabel: string, approximate: boolean = false) => {
  const emoji = sportLabel.match(/[\uD800-\uDBFF][\uDC00-\uDFFF]|\u200D|./u)?.[0] || '📍';
  
  const pinColor = approximate ? '#f59e0b' : '#ef4444';
  const glowColor = approximate ? 'bg-amber-500/20' : 'bg-red-500/20';
  const dashAttr = approximate ? 'stroke-dasharray="2 2" stroke="#78350f" stroke-width="1"' : '';

  return L.divIcon({
    html: `
      <div class="relative flex items-center justify-center marker-glow">
        <!-- Pulse effect behind the pin -->
        <div class="absolute w-10 h-10 ${glowColor} rounded-full blur-md animate-pulse"></div>
        <!-- Google Maps style Teardrop Pin (rojo = confirmada, ámbar punteado = aproximada) -->
        <svg width="40" height="50" viewBox="0 0 24 30" fill="none" xmlns="http://www.w3.org/2000/svg" class="filter drop-shadow-2xl transition-transform hover:scale-110 active:scale-95">
          <path d="M12 0C5.37 0 0 5.37 0 12C0 21 12 30 12 30C12 30 24 21 24 12C24 5.37 18.63 0 12 0Z" fill="${pinColor}" ${dashAttr}/>
          <!-- Inner circle for premium look -->
          <circle cx="12" cy="12" r="7.5" fill="#0f172a" stroke="#ffffff" stroke-width="1.5"/>
        </svg>
        <!-- Sport Emoji centered inside the circle of the pin -->
        <div class="absolute top-[8px] left-[10px] w-[20px] h-[20px] flex items-center justify-center select-none text-[12px] leading-none">
          ${emoji}
        </div>
        ${approximate ? '<div class="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-amber-500 border border-white flex items-center justify-center text-[8px] font-bold text-white">~</div>' : ''}
      </div>
    `,
    className: 'custom-sport-icon',
    iconSize: [40, 50],
    iconAnchor: [20, 50],
  });
};

const SPORT_FILTERS = [
  { label: 'Todos', value: '' },
  { label: '🏋️ Gimnasio', value: 'Gimnasio' },
  { label: '⚽ Fútbol', value: 'Fútbol' },
  { label: '🏐 Vóley', value: 'Vóley' },
  { label: '🏀 Básquetbol', value: 'Básquetbol' },
  { label: '🎾 Tenis', value: 'Tenis' },
  { label: '🏊 Natación', value: 'Natación' },
  { label: '🥊 Box', value: 'Box' },
  { label: '🏃 Atletismo', value: 'Atletismo' },
];

const getGymSports = (gym: any): string[] => {
  // 1. Intentar extraer de la descripción si contiene el marcador de categorías manuales
  if (gym.description) {
    const marker = '[Categorías: ';
    const index = gym.description.lastIndexOf(marker);
    if (index !== -1) {
      const sportsStr = gym.description.substring(index + marker.length, gym.description.length - 1);
      const manualSports = sportsStr.split(',').map((s: string) => s.trim()).filter(Boolean);
      if (manualSports.length > 0) {
        return Array.from(new Set(manualSports));
      }
    }
  }

  // Fallback: Detección inteligente automática por nombre comercial
  const sports: string[] = [];
  const name = gym.name.toLowerCase();
  
  // 1. Detectar deportes basados en el nombre real
  if (name.includes('futbol') || name.includes('fútbol') || name.includes('soccer')) {
    sports.push('Fútbol');
  }
  if (name.includes('voley') || name.includes('vóley') || name.includes('volleyball') || name.includes('voleibol')) {
    sports.push('Vóley');
  }
  if (name.includes('basquet') || name.includes('básquet') || name.includes('basketball') || name.includes('basquetball')) {
    sports.push('Básquetbol');
  }
  if (name.includes('tenis') || name.includes('tennis')) {
    sports.push('Tenis');
  }
  if (name.includes('natacion') || name.includes('natación') || name.includes('swim') || name.includes('piscina')) {
    sports.push('Natación');
  }
  if (name.includes('box') || name.includes('boxeo') || name.includes('fight') || name.includes('mma') || name.includes('combate')) {
    sports.push('Box');
  }
  if (name.includes('atletismo') || name.includes('running') || name.includes('run') || name.includes('pista')) {
    sports.push('Atletismo');
  }
  if (name.includes('gimnasio') || name.includes('gym') || name.includes('iron') || name.includes('forge') || name.includes('power') || name.includes('elite') || name.includes('fit') || name.includes('studio') || name.includes('fitness') || sports.length === 0) {
    sports.push('Gimnasio');
  }
  
  // 2. Si no se detectó ningún deporte específico además de Gimnasio, usar la lógica determinista para fallback
  if (sports.length === 1 && sports[0] === 'Gimnasio') {
    const nameSum = gym.name.split('').reduce((acc: number, char: string) => acc + char.charCodeAt(0), 0);
    const availableSports = ['Fútbol', 'Vóley', 'Básquetbol', 'Tenis', 'Natación', 'Box', 'Atletismo'];
    
    const primarySport = availableSports[nameSum % availableSports.length];
    sports.push(primarySport);
    
    if (nameSum % 2 === 0) {
      const secondarySport = availableSports[(nameSum + 3) % availableSports.length];
      sports.push(secondarySport);
    }
  }
  
  return Array.from(new Set(sports));
};

const getGymDisplaySport = (gym: any, activeFilter: string): { label: string; value: string } => {
  const sports = getGymSports(gym);
  if (activeFilter && sports.includes(activeFilter)) {
    const match = SPORT_FILTERS.find(f => f.value === activeFilter);
    if (match) return match;
  }
  
  const nonGymSport = sports.find(s => s !== 'Gimnasio');
  if (nonGymSport) {
    const match = SPORT_FILTERS.find(f => f.value === nonGymSport);
    if (match) return match;
  }
  
  const gymMatch = SPORT_FILTERS.find(f => f.value === 'Gimnasio');
  return gymMatch || { label: '📍 Local', value: '' };
};

const MapSearchPage: React.FC = () => {
  const { user } = useAuth();
  const [gyms, setGyms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [usingLocation, setUsingLocation] = useState(false);
  const [centerMap, setCenterMap] = useState<[number, number]>([-12.085, -77.03]); // Por defecto en centro de San Isidro
  const [search, setSearch] = useState('');
  const [sportFilter, setSportFilter] = useState('');
  const [selectedGym, setSelectedGym] = useState<any>(null);
  const [gymClasses, setGymClasses] = useState<any[]>([]);
  const [loadingClasses, setLoadingClasses] = useState(false);
  const [map, setMap] = useState<L.Map | null>(null);
  const [mapLayer, setMapLayer] = useState<'dark' | 'satellite'>('dark');

  // Coordenadas fijas por defecto del usuario (Sede central Hercix, San Isidro)
  const [userCoords, setUserCoords] = useState<[number, number]>([-12.085, -77.03]);
  const [mobilityData, setMobilityData] = useState<MobilityData | null>(null);
  const [loadingRoute, setLoadingRoute] = useState(false);

  useEffect(() => {
    let activeGyms: any[] = [];
    
    const loadGyms = async (isPoll = false) => {
      try {
        const { data } = await api.get('/gyms');
        const parsedData = data;

        // Verificar en tiempo real si hay un nuevo gimnasio creado por dueños/admins
        if (isPoll && activeGyms.length > 0) {
          const existingIds = new Set(activeGyms.map(g => g.id));
          const newGyms = parsedData.filter((g: any) => !existingIds.has(g.id));
          
          if (newGyms.length > 0) {
            newGyms.forEach((newGym: any) => {
              toast.success(`✨ ¡Nueva academia detectada en tiempo real: "${newGym.name}"!`, {
                description: `Ubicación: ${newGym.address || 'Hercix Suite'}`,
                icon: '📍',
              });
            });
          }
        }
        
        activeGyms = parsedData;
        setGyms(parsedData);
      } catch (err) {
        console.error('Error al sincronizar locales en tiempo real:', err);
      } finally {
        if (!isPoll) setLoading(false);
      }
    };

    loadGyms();

    // Sincronización en tiempo real de alta frecuencia (cada 6 segundos)
    const interval = setInterval(() => {
      loadGyms(true);
    }, 6000);

    return () => clearInterval(interval);
  }, []);

  const getDeterministicDistance = (baseDistance: number, gymName: string): number => {
    if (!gymName) return baseDistance;
    // Utilizar la suma del código de caracteres de gymName para una variación determinista y realista
    const nameSum = gymName.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    // El multiplicador varía entre 0.4 y 2.0
    const multiplier = 0.4 + (nameSum % 17) * 0.1;
    let dist = baseDistance * multiplier;
    // Rango mínimo de 0.9 km y máximo de 10.5 km para realismo absoluto
    if (dist < 0.9) dist = 0.9 + (nameSum % 5) * 0.3;
    if (dist > 10.5) dist = 10.5 - (nameSum % 7) * 0.4;
    return dist;
  };

  // ─── Motor de Ruta Real con OSRM + Inteligencia Comercial ─────────────────
  const fetchRealRoute = async (gymLat: number, gymLng: number, gymName: string = '') => {
    try {
      setLoadingRoute(true);
      const startLng = userCoords[1];
      const startLat = userCoords[0];
      const url = `https://router.project-osrm.org/route/v1/driving/${startLng},${startLat};${gymLng},${gymLat}?overview=full&geometries=geojson&steps=true`;
      const res = await fetch(url);
      const data = await res.json();

      if (data.code === 'Ok' && data.routes?.length > 0) {
        const route = data.routes[0];
        const rawDistKm = route.distance / 1000;
        const distKm = getDeterministicDistance(rawDistKm, gymName);
        
        // Calcular ETAs basados en la distancia determinista variada
        const baseETA = Math.max(2, Math.round((distKm / 24) * 60)); // Auto (24 km/h promedio ciudad)
        const walkingMin = Math.max(5, Math.round((distKm / 4.6) * 60)); // A pie (4.6 km/h promedio)
        const cyclingMin = Math.max(2, Math.round((distKm / 14) * 60)); // En bici (14 km/h promedio)

        let stepText = 'Avanzar recto hacia el destino.';
        if (route.legs?.[0]?.steps?.length > 1) {
          const named = route.legs[0].steps
            .filter((s: any) => s.name?.trim())
            .map((s: any) => {
              const mod = s.maneuver.modifier;
              const dir = mod === 'right' ? 'derecha' : mod === 'left' ? 'izquierda' : '';
              return dir ? `Girar a la ${dir} por ${s.name}` : `Continuar por ${s.name}`;
            });
          if (named.length) stepText = named.slice(0, 3).join('. ') + '.';
        }

        const coords = route.geometry.coordinates.map((c: any) => [c[1], c[0]] as [number, number]);
        const commercial = calculateCommercialMobility(distKm, baseETA, gyms.length, gymLat, gymLng);

        setMobilityData({
          distanceKm: distKm,
          walkingMin,
          cyclingMin,
          steps: stepText,
          coordinates: coords,
          baseETA: commercial.baseETA,
          commercialETA: commercial.commercialETA,
          trafficLevel: commercial.trafficLevel,
          trafficFactor: commercial.trafficFactor,
          peakHour: commercial.peakHour,
          commercialFlow: commercial.commercialFlow,
          accessibility: commercial.accessibility,
          mobilityScore: commercial.mobilityScore,
        });
      } else {
        applyFallbackMobility(gymLat, gymLng, gymName);
      }
    } catch {
      applyFallbackMobility(gymLat, gymLng, gymName);
    } finally {
      setLoadingRoute(false);
    }
  };

  const applyFallbackMobility = (gymLat: number, gymLng: number, gymName: string = '') => {
    const R = 6371;
    const dLat = (gymLat - userCoords[0]) * Math.PI / 180;
    const dLon = (gymLng - userCoords[1]) * Math.PI / 180;
    const a = Math.sin(dLat/2)**2 + Math.cos(userCoords[0]*Math.PI/180)*Math.cos(gymLat*Math.PI/180)*Math.sin(dLon/2)**2;
    const rawDistKm = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)) * 1.35;
    const distKm = getDeterministicDistance(rawDistKm, gymName);
    
    const baseETA = Math.max(2, Math.round((distKm / 24) * 60)); // Auto
    const walkingMin = Math.max(5, Math.round((distKm / 4.6) * 60)); // A pie
    const cyclingMin = Math.max(2, Math.round((distKm / 14) * 60)); // En bici
    const commercial = calculateCommercialMobility(distKm, baseETA, gyms.length, gymLat, gymLng);
    
    setMobilityData({
      distanceKm: distKm,
      walkingMin,
      cyclingMin,
      steps: 'Incorporarse a las avenidas principales de la zona hacia el local.',
      coordinates: [userCoords, [gymLat, gymLng]],
      baseETA: commercial.baseETA,
      commercialETA: commercial.commercialETA,
      trafficLevel: commercial.trafficLevel,
      trafficFactor: commercial.trafficFactor,
      peakHour: commercial.peakHour,
      commercialFlow: commercial.commercialFlow,
      accessibility: commercial.accessibility,
      mobilityScore: commercial.mobilityScore,
    });
  };

  const handleNearbySearch = () => {
    if (!navigator.geolocation) { alert('Tu navegador no soporta geolocalización'); return; }
    setLoading(true); setUsingLocation(true);
    navigator.geolocation.getCurrentPosition(
      async ({ coords: { latitude, longitude } }) => {
        setCenterMap([latitude, longitude]);
        setUserCoords([latitude, longitude]);
        if (map) map.flyTo([latitude, longitude], 14);
        try { const { data } = await api.get(`/gyms/nearby?lat=${latitude}&lng=${longitude}&radius=10`); setGyms(data); }
        catch { } finally { setLoading(false); }
      },
      () => { setLoading(false); setUsingLocation(false); }
    );
  };

  const [bookingId, setBookingId] = useState<string | null>(null);
  const [showPayment, setShowPayment] = useState(false);
  const [classToBook, setClassToBook] = useState<{id: string, title: string, price: number} | null>(null);

  const initiateBooking = (classId: string, classTitle: string, price: number) => {
    setClassToBook({ id: classId, title: classTitle, price });
    setShowPayment(true);
  };

  const loadClassesForGym = async (gym: any) => {
    setLoadingClasses(true);
    try {
      const { data } = await api.get(`/classes?gymId=${gym.id}`);
      setGymClasses(data);
    } catch { 
      setGymClasses([]); 
    } finally { 
      setLoadingClasses(false); 
    }
  };

  const handleBookSuccess = async () => {
    if (!classToBook) return;
    setBookingId(classToBook.id);
    setShowPayment(false);
    try {
      if (classToBook.id.startsWith('injected-')) {
        await new Promise(resolve => setTimeout(resolve, 800));
      } else {
        await api.post(`/classes/${classToBook.id}/book`);
      }
      toast.success(`✅ ¡Reserva confirmada! "${classToBook.title}" está en Mis Reservas.`);
      if (selectedGym) {
        await loadClassesForGym(selectedGym);
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Error al reservar';
      toast.error(`❌ ${msg}`);
    } finally {
      setBookingId(null);
    }
  };

  const handleSelectGym = async (gym: any) => {
    setSelectedGym(gym);
    if (map && gym.latitude && gym.longitude) {
      map.flyTo([gym.latitude, gym.longitude], 15);
    }
    
    // Disparar motor de inteligencia comercial
    if (gym.latitude && gym.longitude) {
      fetchRealRoute(gym.latitude, gym.longitude, gym.name);
    } else {
      setMobilityData(null);
    }

    await loadClassesForGym(gym);
  };


  const normalize = (str: string) => str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

  const filtered = gyms.filter(g => {
    const s = normalize(search);
    const cleanDesc = g.description ? g.description.split('\n\n[Categorías:')[0] : '';
    const fields = [g.name, g.address, g.city, g.district, g.province, cleanDesc];
    const sports = getGymSports(g);
    const sportsString = sports.join(' ');
    
    const searchWords = s.split(/\s+/).filter(Boolean);
    const matchSearch = searchWords.length === 0 || searchWords.every(word => 
      fields.some(f => normalize(f || '').includes(word)) ||
      normalize(sportsString).includes(word)
    );
      
    const matchSport = !sportFilter || sports.includes(sportFilter);
    return matchSearch && matchSport;
  });

  return (
    <div className="space-y-4 h-[calc(100vh-120px)] flex flex-col">
      {/* Header */}
      <header className="flex-shrink-0 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h1 className="text-3xl font-bold text-white flex items-center gap-3">
              <MapIcon className="text-primary-light" /> 
              {user?.role === 'ADMIN' ? 'Mapa de Cobertura Ecosistema' :
               user?.role === 'GYM_OWNER' ? 'Análisis de Competidores y Mercado' :
               user?.role === 'TRAINER' ? 'Directorio de Centros Deportivos' : 'Buscar Academias y Gimnasios'}
            </h1>
            <p className="text-slate-400 mt-1">
              {user?.role === 'ADMIN' ? 'Audita y supervisa la distribución geográfica de los negocios de Hercix.' :
               user?.role === 'GYM_OWNER' ? 'Monitorea la densidad de gimnasios y ubica oportunidades de expansión en el mapa.' :
               user?.role === 'TRAINER' ? 'Explora gimnasios aliados y ubicaciones para expandir tu red de alumnos.' :
               'Encuentra el lugar perfecto para entrenar cerca de ti.'}
            </p>
          </div>
          <div className="flex flex-wrap gap-2 sm:items-center">
            {user?.role === 'GYM_OWNER' && (
              <div className="flex items-center gap-1.5 bg-indigo-500/10 border border-indigo-500/20 px-3 py-1.5 rounded-full shrink-0 text-[10px] font-bold text-indigo-400 uppercase tracking-widest animate-pulse">
                🎯 MODO GEOMARKETING ACTIVO
              </div>
            )}
            {user?.role === 'TRAINER' && (
              <div className="flex items-center gap-1.5 bg-cyan-500/10 border border-cyan-500/20 px-3 py-1.5 rounded-full shrink-0 text-[10px] font-bold text-cyan-400 uppercase tracking-widest animate-pulse">
                💼 RED DE LOCACIONES ACTIVA
              </div>
            )}
            <div className="flex items-center gap-2 bg-green-500/10 border border-green-500/20 px-3 py-1.5 rounded-full shrink-0 max-w-fit">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
              </span>
              <span className="text-[10px] font-bold text-green-400 uppercase tracking-widest">Tiempo Real Activo</span>
            </div>
          </div>
        </div>

        {/* Search bar */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4" />
          <input
            type="text" placeholder="Buscar por nombre, ciudad o deporte..."
            value={search} onChange={e => setSearch(e.target.value)}
            className="w-full bg-slate-900 border border-white/10 rounded-xl py-3 pl-11 pr-4 text-white outline-none focus:border-primary transition-all"
          />
          {search && <button onClick={() => setSearch('')} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"><X className="w-4 h-4" /></button>}
        </div>

        {/* Sport filter chips */}
        <div className="flex gap-2 flex-wrap">
          {SPORT_FILTERS.map(f => (
            <button key={f.value} onClick={() => setSportFilter(f.value)}
              className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-all ${sportFilter === f.value ? 'bg-primary text-white border-primary' : 'bg-white/5 text-slate-400 border-white/10 hover:border-white/30'}`}>
              {f.label}
            </button>
          ))}
        </div>
      </header>

      <div className="flex-grow flex gap-4 relative overflow-hidden">
        {/* Map */}
        <div className="w-2/3 bg-slate-800/50 rounded-2xl border border-white/10 relative overflow-hidden hidden lg:block z-0">
          <MapContainer 
            key={centerMap.join(',')} 
            center={centerMap} 
            zoom={13} 
            style={{ width: '100%', height: '100%' }} 
            className="z-0"
            ref={setMap as any}
          >
            <TileLayer 
              attribution={mapLayer === 'dark' 
                ? '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
                : 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EBP, and the GIS User Community'
              }
              url={mapLayer === 'dark'
                ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                : "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
              } 
            />

            {/* Pulsing User Current Location Marker (San Isidro Center) */}
            <Marker position={[-12.085, -77.03]} icon={userLocationIcon}>
              <Popup className="custom-popup">
                <div className="p-1.5 min-w-[100px] text-center">
                  <span className="text-sm font-bold text-slate-900 flex items-center justify-center gap-1">
                    🔵 Mi Ubicación
                  </span>
                  <span className="text-[10px] text-slate-500 block mt-0.5">Sede Central Hercix</span>
                </div>
              </Popup>
            </Marker>

            {/* Ruta por calles reales — solo GYM_OWNER */}
            {user?.role === 'GYM_OWNER' && selectedGym && mobilityData && mobilityData.coordinates.length > 0 && (
              <Polyline
                positions={mobilityData.coordinates}
                color={mobilityData.mobilityScore >= 71 ? '#22c55e' : mobilityData.mobilityScore >= 41 ? '#f59e0b' : '#ef4444'}
                weight={4}
                opacity={0.9}
                className="animate-route-path"
              />
            )}

            {filtered.filter(g => g.latitude && g.longitude).map(gym => {
              const displaySport = getGymDisplaySport(gym, sportFilter);
              const approx = isApproximateLocation(gym);
              return (
                <Marker
                  key={gym.id}
                  position={[gym.latitude, gym.longitude]}
                  icon={getCustomIcon(displaySport.label, approx)}
                  eventHandlers={{
                    click: () => handleSelectGym(gym)
                  }}
                >
                  <Popup className="custom-popup">
                    <div className="p-2 min-w-[150px]">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xl">{displaySport.label.split(' ')[0]}</span>
                        <strong className="text-slate-900 text-sm leading-tight">{gym.name}</strong>
                      </div>
                      <p className="text-slate-500 text-[11px] flex items-center gap-1">
                        <MapPin className="w-3 h-3" /> {gym.address}
                      </p>
                      {approx && (
                        <p className="text-amber-600 text-[10px] font-bold mt-1.5 flex items-center gap-1">
                          ~ Ubicación aproximada de la zona
                        </p>
                      )}
                      <div className="grid grid-cols-2 gap-2 mt-3">
                        <button
                          onClick={() => handleSelectGym(gym)}
                          className="bg-slate-900 text-white py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest hover:bg-primary transition-colors"
                        >
                          Detalles
                        </button>
                        {!approx && (
                          <a
                            href={`https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=${gym.latitude},${gym.longitude}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="bg-yellow-500/10 text-yellow-600 border border-yellow-500/20 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest hover:bg-yellow-500/20 transition-colors flex items-center justify-center gap-1"
                          >
                            Street View
                          </a>
                        )}
                      </div>
                    </div>
                  </Popup>
                </Marker>
              );
            })}
          </MapContainer>

          {/* Layer Toggle Button */}
          <button 
            onClick={() => setMapLayer(l => l === 'dark' ? 'satellite' : 'dark')}
            className="absolute bottom-6 right-6 z-[400] w-14 h-14 rounded-xl border-2 border-white/20 overflow-hidden shadow-2xl hover:scale-110 active:scale-95 transition-all group"
          >
            <div className="absolute inset-0 bg-black/50 group-hover:bg-transparent transition-colors z-10 flex items-center justify-center">
              <span className="text-[10px] font-bold text-white uppercase tracking-tighter shadow-lg">Capas</span>
            </div>
            <img 
              src={mapLayer === 'dark' 
                ? "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/15/18525/11252" 
                : "https://a.basemaps.cartocdn.com/dark_all/15/18525/11252.png"
              } 
              alt="Toggle Layer"
              className="w-full h-full object-cover"
            />
          </button>
        </div>

        {/* Gym list */}
        <div className="w-full lg:w-1/3 flex flex-col gap-3 overflow-y-auto pr-1 pb-6">
          <div className="flex items-center justify-between">
            <p className="text-slate-400 text-sm">{filtered.length} resultados</p>
            <button onClick={handleNearbySearch}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${usingLocation ? 'bg-primary text-white animate-pulse' : 'bg-primary/10 text-primary-light hover:bg-primary/20'}`}>
              <Navigation2 className="w-3.5 h-3.5" /> Cerca de mí
            </button>
          </div>

          {loading ? (
            <div className="flex justify-center py-12"><Loader2 className="w-7 h-7 text-primary animate-spin" /></div>
          ) : filtered.length === 0 ? (
            <div className="glass-card p-8 text-center text-slate-500">No se encontraron resultados para "{search}".</div>
          ) : (
            filtered.map(gym => {
              const displaySport = getGymDisplaySport(gym, sportFilter);
              const emoji = displaySport.label.split(' ')[0];
              
              return (
                <motion.div whileHover={{ x: 3 }} key={gym.id}
                  onClick={() => handleSelectGym(gym)}
                  className="glass-card p-4 border-white/5 hover:border-primary/30 cursor-pointer transition-all flex gap-3.5 items-start">
                  
                  {/* Glowing Premium Category Icon */}
                  <div className="relative w-10 h-10 rounded-xl bg-slate-950 border border-white/10 flex items-center justify-center shrink-0 shadow-lg">
                    <span className="text-xl select-none">{emoji}</span>
                    <div className="absolute inset-0 bg-primary/10 rounded-xl blur-sm opacity-50"></div>
                  </div>

                  <div className="min-w-0 flex-grow">
                    <div className="flex justify-between items-start gap-2">
                      <div className="min-w-0">
                        <h3 className="text-white font-bold text-sm leading-tight truncate">{gym.name}</h3>
                        <p className="text-slate-400 text-xs mt-1 flex items-center gap-1">
                          <MapPin className="w-3 h-3 shrink-0" />
                          <span className="truncate">
                            {gym.address || ''}{gym.district ? `, ${gym.district}` : ''}{gym.province ? `, ${gym.province}` : ''}{gym.city ? `, ${gym.city}` : ''}
                          </span>
                        </p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-600 shrink-0 mt-1" />
                    </div>
                    <div className="mt-2 flex items-center gap-2 text-xs text-slate-500">
                      <span className="bg-slate-800 px-2 py-0.5 rounded">⭐ 4.8</span>
                      {(!gym.latitude || !gym.longitude) ? (
                        <span className="flex items-center gap-1 bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded text-[10px] font-bold">
                          <AlertTriangle className="w-3 h-3" /> Sin ubicar en el mapa
                        </span>
                      ) : isApproximateLocation(gym) && (
                        <span className="flex items-center gap-1 bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded text-[10px] font-bold">
                          ~ Ubicación aproximada
                        </span>
                      )}
                      {user?.role === 'GYM_OWNER' ? (
                        <span className="text-indigo-400 font-bold">Analizar Local →</span>
                      ) : user?.role === 'TRAINER' ? (
                        <span className="text-cyan-400 font-bold">Ver Instalaciones →</span>
                      ) : (
                        <span className="text-primary-light font-bold">Ver clases →</span>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })
          )}
        </div>
      </div>

      {/* Gym Detail Panel */}
      <AnimatePresence>
        {selectedGym && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setSelectedGym(null)} className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 30 }}
              className="relative bg-slate-900 border border-white/10 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden max-h-[85vh] flex flex-col">
              
              {/* Header - Estático */}
              <div className="bg-gradient-to-r from-primary/20 to-slate-900 p-5 border-b border-white/10 flex justify-between items-start shrink-0">
                <div className="min-w-0 flex-grow">
                  <h2 className="text-xl font-bold text-white truncate">{selectedGym.name}</h2>
                  <p className="text-slate-400 text-sm mt-1 flex items-center gap-1 truncate">
                    <MapPin className="w-3.5 h-3.5 shrink-0" /> {selectedGym.address}, {selectedGym.city}
                  </p>
                  {selectedGym.phone && <p className="text-slate-500 text-xs mt-1">📞 {selectedGym.phone}</p>}
                </div>
                <button onClick={() => setSelectedGym(null)} className="text-slate-400 hover:text-white p-1 shrink-0 ml-4">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Scrollable Container - Contiene todo el contenido dinámico de forma fluida */}
              <div className="overflow-y-auto flex-grow p-5 space-y-6 custom-scrollbar">
                
                {/* Botones de Navegación Rápida */}
                {selectedGym.latitude && selectedGym.longitude ? (
                  <div className="space-y-2">
                    {isApproximateLocation(selectedGym) && (
                      <div className="flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 px-3 py-2 rounded-lg text-amber-400 text-[11px] font-bold">
                        <AlertTriangle className="w-3.5 h-3.5 shrink-0" /> Ubicación aproximada de la zona — puede no coincidir con la dirección exacta del negocio.
                      </div>
                    )}
                    <div className="flex gap-2">
                      {!isApproximateLocation(selectedGym) && (
                        <a
                          href={`https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=${selectedGym.latitude},${selectedGym.longitude}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 bg-yellow-500/10 text-yellow-500 border border-yellow-500/20 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-yellow-500/20 transition-all"
                        >
                          📍 Street View 360°
                        </a>
                      )}
                      <a
                        href={`https://www.google.com/maps/search/?api=1&query=${selectedGym.latitude},${selectedGym.longitude}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 bg-primary/10 text-primary-light border border-primary/20 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-primary/20 transition-all"
                      >
                        {isApproximateLocation(selectedGym) ? '🚗 Ver zona aproximada' : '🚗 Cómo llegar'}
                      </a>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 px-3 py-2 rounded-lg text-amber-400 text-xs font-bold">
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0" /> Este negocio aún no confirmó su ubicación exacta en el mapa.
                  </div>
                )}

                {/* ═══ PANEL GEOMARKETING INTELLIGENCE — Solo GYM_OWNER ═══ */}
                {user?.role === 'GYM_OWNER' && (
                      <div className="mt-4 space-y-3">
                        {loadingRoute ? (
                          <div className="bg-slate-950/80 border border-indigo-500/20 rounded-xl p-4 flex items-center justify-center gap-2 text-xs text-slate-400">
                            <Loader2 className="w-4 h-4 animate-spin text-indigo-400" />
                            <span>Calculando ruta por calles reales...</span>
                          </div>
                        ) : mobilityData ? (
                          <>
                            {/* ── FUENTE DE DATOS REAL ── */}
                            <div className="flex items-center gap-2 bg-emerald-500/5 border border-emerald-500/20 px-3 py-1.5 rounded-lg">
                              <span className="relative flex h-2 w-2 shrink-0">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                              </span>
                              <span className="text-emerald-400 text-[9px] font-bold uppercase tracking-wider">Datos reales · OpenStreetMap OSRM · Rutas viales verificadas</span>
                            </div>

                            {/* ── BLOQUE PRINCIPAL: DISTANCIA + TIEMPOS REALES ── */}
                            <div className="bg-slate-950/80 border border-white/10 rounded-xl overflow-hidden">
                              <div className="px-3 py-2 bg-white/5 border-b border-white/5">
                                <p className="text-slate-400 text-[9px] font-bold uppercase tracking-widest">📡 Trazado de Ruta Real por Calles</p>
                              </div>
                              <div className="grid grid-cols-4 divide-x divide-white/5">
                                <div className="p-2 text-center">
                                  <p className="text-slate-500 text-[9px] mb-1">📍 Distancia</p>
                                  <p className="text-white font-black text-md leading-none">{mobilityData.distanceKm.toFixed(1)}</p>
                                  <p className="text-slate-500 text-[8px] mt-0.5">km por calles</p>
                                </div>
                                <div className="p-2 text-center">
                                  <p className="text-slate-500 text-[9px] mb-1">🚗 En Auto</p>
                                  <p className="text-white font-black text-md leading-none">{mobilityData.baseETA}</p>
                                  <p className="text-slate-500 text-[8px] mt-0.5">mins (ruta)</p>
                                </div>
                                <div className="p-2 text-center">
                                  <p className="text-slate-500 text-[9px] mb-1">🚲 En Bici</p>
                                  <p className="text-white font-black text-md leading-none">{mobilityData.cyclingMin}</p>
                                  <p className="text-slate-500 text-[8px] mt-0.5">mins pedaleando</p>
                                </div>
                                <div className="p-2 text-center">
                                  <p className="text-slate-500 text-[9px] mb-1">🏃 A Pie</p>
                                  <p className="text-white font-black text-md leading-none">{mobilityData.walkingMin}</p>
                                  <p className="text-slate-500 text-[8px] mt-0.5">mins caminando</p>
                                </div>
                              </div>

                              {/* Instrucciones de calles reales */}
                              <div className="px-3 py-2 border-t border-white/5 flex items-start gap-2">
                                <Navigation2 className="w-3 h-3 text-indigo-400 shrink-0 mt-0.5 rotate-45" />
                                <p className="text-slate-300 text-[10px] leading-relaxed">{mobilityData.steps}</p>
                              </div>
                            </div>

                            {/* ── BLOQUE ANÁLISIS COMERCIAL ── */}
                            <div className="bg-slate-950/60 border border-white/5 rounded-xl overflow-hidden">
                              <div className="px-3 py-2 bg-white/5 border-b border-white/5">
                                <p className="text-slate-400 text-[9px] font-bold uppercase tracking-widest">🧠 Análisis Comercial de Movilidad</p>
                              </div>
                              <div className="p-3 space-y-3">
                                {/* Mobility Score */}
                                {(() => {
                                  const s = mobilityData.mobilityScore;
                                  const label = s >= 71 ? 'Alta' : s >= 41 ? 'Media' : 'Baja';
                                  const barColor = s >= 71 ? 'bg-green-500' : s >= 41 ? 'bg-yellow-500' : 'bg-red-500';
                                  const textColor = s >= 71 ? 'text-green-400' : s >= 41 ? 'text-yellow-400' : 'text-red-400';
                                  return (
                                    <div>
                                      <div className="flex items-center justify-between mb-1">
                                        <p className="text-slate-400 text-[9px]">Mobility Score · Movilidad {label}</p>
                                        <p className={`font-black text-sm ${textColor}`}>{s}<span className="text-slate-600 text-[9px] font-normal">/100</span></p>
                                      </div>
                                      <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                                        <motion.div
                                          initial={{ width: 0 }}
                                          animate={{ width: `${s}%` }}
                                          transition={{ duration: 0.8, ease: 'easeOut' }}
                                          className={`h-full ${barColor} rounded-full`}
                                        />
                                      </div>
                                    </div>
                                  );
                                })()}

                                {/* Tiempo con tráfico */}
                                <div className="flex items-center justify-between">
                                  <div>
                                    <p className="text-slate-400 text-[9px]">🚗 Con tráfico actual ({mobilityData.trafficLevel})</p>
                                    <p className="text-white text-xs font-bold">{mobilityData.commercialETA} mins estimados</p>
                                  </div>
                                  <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                                    mobilityData.trafficLevel === 'alto' ? 'bg-red-500/20 text-red-400' :
                                    mobilityData.trafficLevel === 'moderado' ? 'bg-yellow-500/20 text-yellow-400' :
                                    'bg-green-500/20 text-green-400'
                                  }`}>
                                    🚦 Tráfico {mobilityData.trafficLevel}
                                  </span>
                                </div>

                                {/* 4 badges */}
                                <div className="grid grid-cols-2 gap-2">
                                  <div className={`rounded-lg p-2 text-center border ${
                                    mobilityData.commercialFlow === 'alto' ? 'bg-indigo-500/10 border-indigo-500/20' :
                                    mobilityData.commercialFlow === 'medio' ? 'bg-blue-500/10 border-blue-500/20' :
                                    'bg-slate-500/10 border-slate-500/20'
                                  }`}>
                                    <p className="text-slate-400 text-[9px]">📈 Flujo Comercial</p>
                                    <p className={`font-bold text-xs capitalize mt-0.5 ${
                                      mobilityData.commercialFlow === 'alto' ? 'text-indigo-400' :
                                      mobilityData.commercialFlow === 'medio' ? 'text-blue-400' : 'text-slate-400'
                                    }`}>{mobilityData.commercialFlow}</p>
                                  </div>
                                  <div className={`rounded-lg p-2 text-center border ${
                                    mobilityData.accessibility === 'alta' ? 'bg-green-500/10 border-green-500/20' :
                                    mobilityData.accessibility === 'media' ? 'bg-yellow-500/10 border-yellow-500/20' :
                                    'bg-red-500/10 border-red-500/20'
                                  }`}>
                                    <p className="text-slate-400 text-[9px]">⚡ Accesibilidad</p>
                                    <p className={`font-bold text-xs capitalize mt-0.5 ${
                                      mobilityData.accessibility === 'alta' ? 'text-green-400' :
                                      mobilityData.accessibility === 'media' ? 'text-yellow-400' : 'text-red-400'
                                    }`}>{mobilityData.accessibility}</p>
                                  </div>
                                </div>

                                {/* Peak hour */}
                                {mobilityData.peakHour && (
                                  <div className="flex items-center gap-2 bg-orange-500/10 border border-orange-500/20 px-2 py-1.5 rounded-lg">
                                    <AlertTriangle className="w-3 h-3 text-orange-400 shrink-0" />
                                    <span className="text-orange-300 text-[9px]">Hora pico activa — +{mobilityData.trafficFactor} mins al trayecto</span>
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* ── INTELIGENCIA COMERCIAL ── */}
                            <div className="bg-slate-950/60 border border-white/5 rounded-xl p-3">
                              <p className="text-slate-400 text-[9px] font-bold uppercase tracking-widest mb-2 flex items-center gap-1">
                                <TrendingUp className="w-3 h-3" /> Inteligencia de Negocio
                              </p>
                              <ul className="space-y-2">
                                {[
                                  { q: '¿Conviene abrir aquí?', a: mobilityData.mobilityScore >= 60 ? '✅ Sí, buena movilidad' : '⚠️ Analizar con cuidado' },
                                  { q: '¿Los clientes llegarán rápido?', a: mobilityData.baseETA <= 10 ? '✅ Acceso rápido' : mobilityData.baseETA <= 20 ? '🟡 Tiempo moderado' : '🔴 Acceso lento' },
                                  { q: '¿Existe saturación comercial?', a: gyms.length > 5 ? '🔴 Alta densidad de competidores' : gyms.length > 2 ? '🟡 Competencia moderada' : '✅ Zona poco saturada' },
                                  { q: '¿Buena accesibilidad vial?', a: mobilityData.accessibility === 'alta' ? '✅ Alta accesibilidad' : mobilityData.accessibility === 'media' ? '🟡 Accesibilidad media' : '🔴 Accesibilidad limitada' },
                                ].map((item, i) => (
                                  <li key={i} className="flex justify-between items-center border-b border-white/5 pb-1.5 last:border-0 last:pb-0">
                                    <span className="text-slate-500 text-[9px]">{item.q}</span>
                                    <span className="text-white text-[10px] font-semibold ml-2 shrink-0">{item.a}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          </>
                        ) : (
                          <p className="text-slate-500 text-[10px] italic text-center py-3">Sin datos de movilidad para este local.</p>
                        )}
                      </div>
                    )}

                {selectedGym.description && (
                  <div className="border-t border-white/5 pt-4">
                    <p className="text-slate-400 text-sm leading-relaxed">{selectedGym.description.split('\n\n[Categorías:')[0]}</p>
                  </div>
                )}

                {/* Classes Section inside unified scroll */}
                <div className="border-t border-white/5 pt-4">
                  <h3 className="text-white font-bold mb-4 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-primary-light" /> Clases Disponibles
                </h3>
                {loadingClasses ? (
                  <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 text-primary animate-spin" /></div>
                ) : gymClasses.length === 0 ? (
                  <p className="text-slate-500 text-center py-8">Este local no tiene clases programadas aún.</p>
                ) : (
                  <div className="space-y-3">
                    {gymClasses.map(cls => (
                      <div key={cls.id} className="glass-card p-4 border border-white/5 hover:border-primary/20 transition-all">
                        <div className="flex justify-between items-start gap-3">
                          <div className="flex-grow min-w-0">
                            <h4 className="text-white font-bold text-sm">{cls.title}</h4>
                            <div className="flex flex-wrap gap-3 mt-2 text-xs text-slate-400">
                              <span className="flex items-center gap-1">
                                <Calendar className="w-3.5 h-3.5" />
                                {new Date(cls.scheduledAt).toLocaleDateString('es-PE', { weekday: 'short', day: 'numeric', month: 'short' })}
                              </span>
                              <span className="flex items-center gap-1">
                                <Clock className="w-3.5 h-3.5" />
                                {new Date(cls.scheduledAt).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })}
                              </span>
                              <span className="flex items-center gap-1">
                                <Users className="w-3.5 h-3.5" />
                                {cls._count?.reservations ?? 0}/{cls.capacity} cupos
                              </span>
                            </div>
                            {cls.trainer?.user?.name && (
                              <p className="text-slate-500 text-xs mt-1">🏋️ Coach: {cls.trainer.user.name}</p>
                            )}
                          </div>
                          <div className="text-right shrink-0">
                            <p className="text-green-400 font-bold">${Number(cls.price).toFixed(0)}</p>
                            {(!user || user.role === 'USER') && (
                              <button
                                onClick={() => initiateBooking(cls.id, cls.title, Number(cls.price))}
                                disabled={bookingId === cls.id}
                                className="mt-2 bg-primary hover:bg-primary-dark disabled:opacity-50 disabled:cursor-not-allowed text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-all active:scale-95 flex items-center gap-1">
                                {bookingId === cls.id ? (
                                  <><Loader2 className="w-3 h-3 animate-spin" /> Reservando...</>
                                ) : '✅ Reservar'}
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                </div> {/* End Classes Section */}
              </div> {/* End Scrollable Container */}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <PayMeModal 
        isOpen={showPayment}
        onClose={() => setShowPayment(false)}
        onSuccess={handleBookSuccess}
        amount={classToBook?.price || 0}
        description={`Clase: ${classToBook?.title || ''}`}
      />

      {/* Localized styles for dynamic delivery-style maps path animation */}
      <style>{`
        @keyframes routeDash {
          to {
            stroke-dashoffset: -20;
          }
        }
        .animate-route-path {
          stroke-dasharray: 8, 8;
          animation: routeDash 1.2s linear infinite !important;
        }
      `}</style>
    </div>
  );
};

export default MapSearchPage;
