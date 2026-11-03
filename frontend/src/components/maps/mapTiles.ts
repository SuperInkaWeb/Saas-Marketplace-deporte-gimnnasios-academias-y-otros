// Fondos de mapa (Leaflet).
// Desde 2026 CARTO exige una API key en basemaps.cartocdn.com; sin ella devuelve una imagen
// "API KEY REQUIRED". La clave (gratuita) se configura en Vercel como VITE_CARTO_API_KEY.
// Sin clave se usa el fondo estándar de OpenStreetMap (claro), que no requiere registro.
const cartoKey = (import.meta.env.VITE_CARTO_API_KEY ?? '').trim();

const OSM_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

export const DARK_TILES = cartoKey
  ? {
      url: `https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png?key=${encodeURIComponent(cartoKey)}`,
      attribution: `${OSM_ATTRIBUTION} &copy; <a href="https://carto.com/attributions">CARTO</a>`,
    }
  : {
      url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
      attribution: OSM_ATTRIBUTION,
    };

export const SATELLITE_TILES = {
  url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
  attribution:
    'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EBP, and the GIS User Community',
};

// Miniaturas del botón "Capas" (una tesela de Lima).
export const DARK_THUMBNAIL = cartoKey
  ? `https://a.basemaps.cartocdn.com/dark_all/15/9372/17489.png?key=${encodeURIComponent(cartoKey)}`
  : 'https://tile.openstreetmap.org/15/9372/17489.png';
export const SATELLITE_THUMBNAIL =
  'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/15/17489/9372';
