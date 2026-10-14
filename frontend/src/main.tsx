import { StrictMode, Suspense, lazy } from 'react'
import type { ComponentType } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { Auth0Provider } from '@auth0/auth0-react'

let domain = import.meta.env.VITE_AUTH0_DOMAIN || "dev-khvop4d61s5ip8d3.us.auth0.com";
let clientId = import.meta.env.VITE_AUTH0_CLIENT_ID || "3kp2ZDHZYjBxcJaqtGXZdTIShBsK3sJK";
let audience = import.meta.env.VITE_AUTH0_AUDIENCE || "https://hercix-api";

// Si Vercel tiene configuradas las credenciales de desarrollo antiguas de Sebastian, forzar las oficiales de Mario (Hercix)
if (
  domain === "dev-6d0mok1v1ohx5iez.us.auth0.com" || 
  domain === "dev-vdhdedydkqqaxog0.us.auth0.com" || 
  domain === "dev-vdhdedydkqqaxog0" ||
  audience === "https://sportnexus-api"
) {
  domain = "dev-khvop4d61s5ip8d3.us.auth0.com";
  clientId = "3kp2ZDHZYjBxcJaqtGXZdTIShBsK3sJK";
  audience = "https://hercix-api";
}

// ── Sitio de Superadmin ────────────────────────────────────────────────────
// Se activa con `--mode admin` (ver .env.admin y los scripts dev:admin / build:admin).
// El mismo código genera dos sitios: Hercix (por defecto) y Hercix Admin.
const isAdminSite = import.meta.env.VITE_APP_TARGET === 'admin';

// El sitio admin puede usar su propia aplicación de Auth0 (recomendado)
if (isAdminSite && import.meta.env.VITE_AUTH0_ADMIN_CLIENT_ID) {
  clientId = import.meta.env.VITE_AUTH0_ADMIN_CLIENT_ID;
}

// Como la condición es constante en el build, solo se incluye la app que corresponde
const Root = lazy<ComponentType>(() =>
  isAdminSite ? import('./admin/AdminApp') : import('./App.tsx'),
);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Auth0Provider
      domain={domain}
      clientId={clientId}
      authorizationParams={{
        redirect_uri: window.location.origin,
        audience: audience,
        scope: "openid profile email"
      }}
      cacheLocation="localstorage"
      useRefreshTokens={false}
    >
      <Suspense fallback={null}>
        <Root />
      </Suspense>
    </Auth0Provider>
  </StrictMode>,
)