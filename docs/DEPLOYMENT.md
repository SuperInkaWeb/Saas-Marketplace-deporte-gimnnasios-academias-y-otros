# 🚀 Guía de Despliegue — Hercix Platform

> Instrucciones paso a paso para desplegar el sistema completo en producción.

---

## 📋 Servicios de Producción Actuales

| Servicio | Plataforma | URL |
|---|---|---|
| **Backend API** | Render (Free) | https://sportnexus-platform.onrender.com |
| **Frontend** | Vercel (Free) | https://sportnexus-platform.vercel.app |
| **Base de Datos** | Neon PostgreSQL (Free) | Panel: console.neon.tech |

---

## 1️⃣ Despliegue del Backend (NestJS en Render)

### Opción A — Despliegue Automático vía GitHub (recomendado)

1. Ve a [dashboard.render.com](https://dashboard.render.com)
2. Click **"New +"** → **"Web Service"**
3. Conecta tu repositorio de GitHub: `hercix-platform`
4. Configura el servicio:
   - **Name**: `hercix-backend`
   - **Root Directory**: `backend`
   - **Runtime**: `Node`
   - **Build Command**: `npm install --include=dev && npx prisma generate && npm run build`
   - **Start Command**: `npx prisma db push && node dist/main`
   - **Plan**: Free

5. En **Environment Variables**, agrega todas las variables (ver sección 4)
6. Click **"Create Web Service"**

> Render redesplegará automáticamente cada vez que hagas `git push` a `main`.

### Opción B — Redespliegue manual

En Render Dashboard → tu servicio → click **"Manual Deploy"** → **"Deploy latest commit"**

---

## 2️⃣ Despliegue del Frontend (React en Vercel)

1. Ve a [vercel.com](https://vercel.com) y crea una cuenta / inicia sesión
2. Click **"Add New Project"** → importa el repositorio de GitHub
3. Configura:
   - **Root Directory**: `frontend`
   - **Framework Preset**: `Vite`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`

4. En **Environment Variables**, agrega:
   ```
   VITE_API_URL = https://sportnexus-platform.onrender.com/api
   ```
5. Click **"Deploy"**

> Vercel redesplegará automáticamente con cada `git push` a `main`.

---

## 3️⃣ Conexión Backend ↔ Frontend

### Configuración CORS en Backend

El backend permite peticiones desde los orígenes definidos en `FRONTEND_URL`. En producción:
```
FRONTEND_URL=https://sportnexus-platform.vercel.app
```

### Configuración API URL en Frontend

El frontend usa la variable:
```
VITE_API_URL=https://sportnexus-platform.onrender.com/api
```

Todos los llamados del frontend usan el cliente en `frontend/src/api/api-client.ts`:
```typescript
const api = axios.create({ baseURL: import.meta.env.VITE_API_URL });
```

---

## 4️⃣ Variables de Entorno Completas

### Backend (`backend/.env`)

```env
# ── Base de Datos (Neon PostgreSQL) ──────────────────────────────
DATABASE_URL="postgresql://USER:PASSWORD@HOST-pooler.neon.tech/neondb?sslmode=require&channel_binding=require"
DIRECT_URL="postgresql://USER:PASSWORD@HOST.neon.tech/neondb?sslmode=require&channel_binding=require"

# ── JWT ───────────────────────────────────────────────────────────
JWT_SECRET="clave_super_secreta_minimo_32_caracteres"
JWT_REFRESH_SECRET="clave_refresh_diferente_minimo_32_caracteres"
JWT_EXPIRES_IN="24h"
JWT_REFRESH_EXPIRES_IN="7d"

# ── App ───────────────────────────────────────────────────────────
PORT=3000
NODE_ENV=production
FRONTEND_URL="https://sportnexus-platform.vercel.app"

# ── Email (Resend) ────────────────────────────────────────────────
RESEND_API_KEY="re_..."
RESEND_FROM_EMAIL="onboarding@resend.dev"
RESEND_FROM_NAME="Hercix"

# ── IA (Google Gemini) ────────────────────────────────────────────
GEMINI_API_KEY="AIza..."

# ── Auth0 (Opcional) ─────────────────────────────────────────────
AUTH0_DOMAIN="dev-xxxxx.us.auth0.com"
AUTH0_AUDIENCE="https://hercix-api"

# ── Fitbit OAuth2 ─────────────────────────────────────────────────
FITBIT_CLIENT_ID="23VJLL"
FITBIT_CLIENT_SECRET="tu_client_secret_de_fitbit"
```

### Frontend (`frontend/.env`)

```env
VITE_API_URL="https://sportnexus-platform.onrender.com/api"
```

---

## 5️⃣ Base de Datos — Configuración Neon

### Crear proyecto nuevo en Neon
1. Ve a [console.neon.tech](https://console.neon.tech)
2. Click **"New Project"** → dale un nombre
3. Copia la **Connection String** (tiene el formato `postgresql://...`)
4. Pégala en `DATABASE_URL` del `.env`

### Ejecutar migraciones
```bash
# Aplicar schema a la BD (crea todas las tablas)
npx prisma db push

# O con migraciones versionadas:
npx prisma migrate deploy
```

---

## 6️⃣ Mantenimiento en Producción

### Actualizar código
```bash
git pull origin main
git push origin main
# Render y Vercel redesplegarán automáticamente
```

### Ver logs del backend
- Render Dashboard → tu servicio → **"Logs"**

### Monitorear la BD
- Neon Console → proyecto → **"Monitoring"**

### Despertar Neon (si está pausado)
Neon pausa los proyectos gratis tras 5 minutos de inactividad. El primer request tarda ~3 segundos (cold start). Para evitarlo, usa el plan Pro de Neon.

### Despertar Render (si está pausado)
Render Free pausea el servicio tras 15 minutos sin tráfico. El primer request tarda ~30 segundos. Para evitarlo:
- Upgrade a **Starter** plan ($7/mes)
- O usar un servicio de ping como [cron-job.org](https://cron-job.org) para hacer requests cada 10 minutos

---

## 7️⃣ Fitbit OAuth2 — Configuración

1. Registra tu app en [dev.fitbit.com/apps/new](https://dev.fitbit.com/apps/new)
2. **OAuth 2.0 Application Type**: Server
3. **Redirect URLs** (una por línea):
   ```
   http://localhost:5173/dashboard/wearables/fitbit-callback
   https://sportnexus-platform.vercel.app/dashboard/wearables/fitbit-callback
   ```
4. Copia **Client ID** y **Client Secret** al `.env` del backend

---

## ✅ Verificación del Despliegue

```bash
# Test del backend (debe retornar JSON)
curl https://sportnexus-platform.onrender.com/api

# Test de autenticación
curl -X POST https://sportnexus-platform.onrender.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@hercix.com","password":"<TU_PASSWORD>"}'
```
