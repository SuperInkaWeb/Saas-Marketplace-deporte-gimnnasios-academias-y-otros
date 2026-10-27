# 🔌 Servicios Externos — Hercix Platform

> Lista completa de todos los servicios de terceros utilizados, su propósito y cómo configurarlos.

---

## Resumen de Servicios

| Servicio | Propósito | Plan | Costo |
|---|---|---|---|
| **Render** | Hosting del Backend (NestJS) | Free | $0/mes |
| **Vercel** | Hosting del Frontend (React) | Free | $0/mes |
| **Neon PostgreSQL** | Base de datos en la nube | Free | $0/mes |
| **Resend** | Envío de emails transaccionales y marketing | Free (3,000/mes) | $0/mes |
| **Google Gemini API** | IA para recomendaciones y chat | Free (1M tokens/mes) | $0/mes |
| **Fitbit Developer API** | OAuth2 para sincronización de wearables | Free | $0/mes |
| **Pay-Me** | Procesamiento de pagos (gateway latinoamericano) | Variable | % por transacción |

**Costo total de infraestructura: ~$0/mes** (todos en tier gratuito)

---

## 1. Render — Backend Hosting

**URL**: https://dashboard.render.com  
**Servicio**: `sportnexus-platform` (Web Service)  
**URL producción**: https://sportnexus-platform.onrender.com

### Configuración
- **Runtime**: Node.js 20
- **Build Command**: `npm install --include=dev && npx prisma generate && npm run build`
- **Start Command**: `node dist/src/main` (las migraciones se aplican aparte: ver `docs/MIGRACIONES.md`)
- **Auto-deploy**: Sí (al push en `main`)

### Limitaciones del plan Free
- El servicio se pausa tras 15 min sin tráfico
- 750 horas/mes de compute incluidas
- 512 MB RAM
- Para evitar pausas: considera Starter plan ($7/mes)

### Variables configuradas en Render
```
DATABASE_URL, DIRECT_URL, JWT_SECRET, JWT_REFRESH_SECRET,
FRONTEND_URL, RESEND_API_KEY, RESEND_FROM_EMAIL, RESEND_FROM_NAME,
GEMINI_API_KEY, AUTH0_DOMAIN, AUTH0_AUDIENCE,
FITBIT_CLIENT_ID, FITBIT_CLIENT_SECRET,
NODE_ENV=production, PORT=3000
```

---

## 2. Vercel — Frontend Hosting

**URL**: https://vercel.com  
**Proyecto**: `sportnexus-platform`  
**URL producción**: https://sportnexus-platform.vercel.app

### Configuración
- **Framework**: Vite
- **Root Directory**: `frontend`
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Routing**: SPA (vercel.json con rewrites a index.html)
- **Auto-deploy**: Sí (al push en `main`)

### Variables de entorno en Vercel
```
VITE_API_URL = https://sportnexus-platform.onrender.com/api
```

---

## 3. Neon — Base de Datos PostgreSQL

**URL**: https://console.neon.tech  
**Proyecto**: `mute-cloud-66184395`  
**Base de datos**: `neondb`

### Connection Strings
```bash
# Para pooler (uso general del backend)
DATABASE_URL="postgresql://neondb_owner:PASSWORD@HOST-pooler.c-5.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"

# Para conexión directa (migraciones Prisma)
DIRECT_URL="postgresql://neondb_owner:PASSWORD@HOST.c-5.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"
```

### Limitaciones del plan Free
- 0.5 GB de almacenamiento
- 1 proyecto
- Auto-pause tras 5 min de inactividad (cold start de ~3s)
- Para evitar pausas: Plan Pro ($19/mes)

### Cómo obtener nuevas credenciales
1. Ve a [console.neon.tech](https://console.neon.tech)
2. Proyecto → **"Connect"** → **"Connection string"**
3. Si la contraseña cambió, haz **"Reset password"** y actualiza las variables en Render

---

## 4. Resend — Email Service

**URL**: https://resend.com  
**Uso**: Emails transaccionales y campañas de marketing

### Configuración
```env
RESEND_API_KEY="re_xxxxxxxxxxxxxxxx"
RESEND_FROM_EMAIL="onboarding@resend.dev"
RESEND_FROM_NAME="Hercix"
```

### Límites del plan Free
- 3,000 emails/mes
- 100 emails/día
- Solo puede enviar desde dominios verificados o `@resend.dev`

### Para producción real (dominio propio)
1. Ve a Resend → **"Domains"** → **"Add Domain"**
2. Verifica tu dominio con registros DNS
3. Cambia `RESEND_FROM_EMAIL` a `notificaciones@tudominio.com`

### Uso en el código
```typescript
// backend/src/notifications/email.service.ts
// Envía emails transaccionales (confirmaciones, etc.)

// backend/src/marketing/marketing.service.ts
// Envía campañas de email masivas a miembros del gimnasio
```

---

## 5. Google Gemini API — Inteligencia Artificial

**URL**: https://aistudio.google.com  
**Uso**: Recomendaciones personalizadas + Chat deportivo IA

### Configuración
```env
GEMINI_API_KEY="AIzaSy..."
```

### Obtener API Key gratuita
1. Ve a [aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey)
2. Click **"Create API key"**
3. Copia la clave y pégala en `GEMINI_API_KEY`

### Límites del plan Free
- 1,500 requests/día (Gemini 1.5 Flash)
- 1,000,000 tokens/minuto
- Completamente gratuito para desarrollo

### Uso en el código
```typescript
// backend/src/recommendations/recommendations.service.ts
// Genera recomendaciones personalizadas basadas en historial del usuario
// y responde preguntas del chat deportivo
```

---

## 6. Fitbit Developer API — Wearables OAuth2

**URL**: https://dev.fitbit.com  
**App registrada**: Hercix (`Client ID: 23VJLL`)

### Configuración
```env
FITBIT_CLIENT_ID="<FITBIT_CLIENT_ID>"
FITBIT_CLIENT_SECRET="<FITBIT_CLIENT_SECRET>"
```

### Redirect URLs configuradas
```
http://localhost:5173/dashboard/wearables/fitbit-callback     (desarrollo)
https://sportnexus-platform.vercel.app/dashboard/wearables/fitbit-callback  (producción)
```

### Datos que sincroniza
- **Pasos** diarios
- **Calorías** quemadas
- **Ritmo cardíaco** (promedio y zonas)
- **Minutos activos**
- **Tiempo de sueño**
- **Distancia** recorrida

### Para agregar más URLs de callback
1. Ve a [dev.fitbit.com/apps/details/23VJLL](https://dev.fitbit.com/apps/details/23VJLL)
2. Click **"Edit Application Settings"**
3. Agrega la nueva URL en el campo **"Redirect URL"**

---

## 7. Pay-Me — Procesamiento de Pagos

**Uso**: Gateway de pago latinoamericano para suscripciones y compras

### Configuración
```env
PAYME_ACQUIRER_ID="tu_acquirer_id"
PAYME_COMMERCE_ID="tu_commerce_id"
PAYME_API_KEY="tu_api_key"
```

### Obtener credenciales
Contacta al equipo de Pay-Me en tu país para obtener las credenciales de producción.

### Uso en el código
```typescript
// backend/src/payments/payments.service.ts
// Genera la firma HMAC y el payload para el VPOS2 modal

// frontend/src/components/payment/PayMeModal.tsx
// Renderiza el modal de pago embebido de Pay-Me
```

---

## 8. Auth0 (Configurado pero opcional)

**URL**: https://manage.auth0.com  
**Estado**: Configurado como proveedor alternativo, el sistema funciona sin él

### Variables
```env
AUTH0_DOMAIN="dev-6d0mok1v1ohx5iez.us.auth0.com"
AUTH0_AUDIENCE="https://sportnexus-api"
```

---

## 📋 Checklist de Configuración para Nuevo Despliegue

- [ ] Crear proyecto en **Neon** → obtener `DATABASE_URL` y `DIRECT_URL`
- [ ] Crear cuenta en **Resend** → obtener `RESEND_API_KEY`
- [ ] Obtener `GEMINI_API_KEY` de Google AI Studio
- [ ] Registrar app en **Fitbit Dev** → obtener `FITBIT_CLIENT_ID` y `FITBIT_CLIENT_SECRET`
- [ ] Contactar **Pay-Me** → obtener credenciales de producción
- [ ] Crear servicio en **Render** → configurar todas las variables de entorno
- [ ] Crear proyecto en **Vercel** → configurar `VITE_API_URL`
- [ ] Actualizar **Fitbit Redirect URLs** con la nueva URL de Vercel
- [ ] Ejecutar `npx prisma migrate deploy` para crear tablas (ver `docs/MIGRACIONES.md`)
- [ ] Verificar con `curl` que el backend responde correctamente
