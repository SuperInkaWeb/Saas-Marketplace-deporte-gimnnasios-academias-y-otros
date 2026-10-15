import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
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
      <App />
    </Auth0Provider>
  </StrictMode>,
)
