// Contenido de la campaña HERCIX League (ítem 5: banners del evento).
// Los textos viven aquí para poder cambiarlos sin tocar los componentes.
// Para ocultar la campaña sin desplegar código nuevo: VITE_HERCIX_LEAGUE=off en Vercel.

export type LeagueStageTone = 'red' | 'blue' | 'green';

export interface LeagueStanding {
  position: number;
  gym: string;
  points: number;
}

export interface LeagueStage {
  id: string;
  label: string;
  tone: LeagueStageTone;
  image: string;
  title: string;
  highlight: string;
  kicker?: string;
  description: string;
  // Solo para la etapa de resultados. Vacío hasta que exista el sistema de puntos (ítems 6-8).
  standings?: LeagueStanding[];
  cta: { title: string; subtitle: string; path: string };
}

export const LEAGUE_CAMPAIGN = {
  badge: 'CIRCUITO OFICIAL 2026 | INSCRIPCIONES ABIERTAS',
  title: 'HERCIX LEAGUE &',
  highlight: 'GYM RANKING',
  subtitle: [
    '¿Tu gimnasio tiene a los atletas más fuertes de la ciudad? Demuéstralo en el circuito de 6 meses.',
    'Desafíos express de 60s, ranking digital en tiempo real e incentivos en cada fecha.',
  ],
  heroImage: '/league/hero.webp',
  districts: ['Jesús María', 'Pueblo Libre', 'San Miguel', 'Magdalena'],
  ctaLabel: 'UNIRME AL RANKING',
  tags: ['#MecánicaDelReto', '#RankingInterGyms', '#CalendarioDeFechas', '#MarcasAuspiciadoras'],
  stagesTitle: 'CIRCUITO HERCIX LEAGUE 2026',
  stagesSubtitle: 'Tres etapas, 6 meses y 18 fechas presenciales. Sigue cada fase desde Hercix.',
  stages: [
    {
      id: 'expectativa',
      label: 'ETAPA 1: EXPECTATIVA',
      tone: 'red',
      image: '/league/etapa-1.webp',
      title: '¿CUÁL ES EL GYM',
      highlight: 'MÁS FUERTE?',
      description:
        'Muy pronto arranca el circuito de rendimiento físico más grande de la ciudad. 6 meses, 18 fechas presenciales.',
      cta: { title: 'PRE-REGÍSTRATE AHORA', subtitle: 'Escanea y asegura tu lugar en hercix.com', path: '/login' },
    },
    {
      id: 'lanzamiento',
      label: 'ETAPA 2: LANZAMIENTO',
      tone: 'blue',
      image: '/league/etapa-2.webp',
      title: 'HERCIX LEAGUE',
      highlight: '& GYM RANKING',
      kicker: 'SÁBADO OFICIAL | 9:00 AM',
      description:
        'Retos express de 60s, muestras de suplementación gratis para todos los registrados y premios de marcas aliadas.',
      cta: {
        title: '¡CREA TU CUENTA Y PARTICIPA!',
        subtitle: 'Entrada libre presentando tu perfil activo en Hercix.',
        path: '/login',
      },
    },
    {
      id: 'resultados',
      label: 'ETAPA 3: RESULTADOS',
      tone: 'green',
      image: '/league/etapa-3.webp',
      title: 'TABLA DE',
      highlight: 'POSICIONES',
      description: 'La tabla de cada fecha se publicará aquí al cierre de la jornada. ¡Prepara a tu equipo!',
      standings: [],
      cta: { title: 'RANKING EN VIVO', subtitle: 'Muy pronto podrás revisar tu puesto en hercix.com', path: '/login' },
    },
  ] as LeagueStage[],
};

export const isLeagueActive = () => import.meta.env.VITE_HERCIX_LEAGUE !== 'off';
