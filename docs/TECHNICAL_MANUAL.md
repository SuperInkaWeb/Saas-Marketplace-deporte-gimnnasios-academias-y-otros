# 🏗️ Manual Técnico — Hercix Platform

> Documento de arquitectura, módulos, endpoints y flujos clave del sistema.

---

## 1. Visión General del Sistema

**Hercix** es una plataforma SaaS multi-tenant + Marketplace para el sector deportivo. Permite a gimnasios, academias y centros fitness gestionar sus operaciones completas desde una sola aplicación.

### Modelo Multi-tenant
- **Un solo backend** sirve a múltiples gimnasios simultáneamente
- Cada gimnasio tiene sus datos aislados por `gym_id`
- Un usuario puede ser dueño de múltiples gimnasios
- La plataforma tiene un administrador global (`ADMIN`)

---

## 2. Arquitectura del Sistema

```
┌─────────────────────────────────────────────────────────────────────┐
│                         CLIENTE (Browser)                           │
│                    React 18 + Vite + TailwindCSS                    │
│            https://<TU-FRONTEND>.vercel.app                         │
└──────────────────────────┬──────────────────────────────────────────┘
                           │ HTTPS / REST API (JSON)
                           │ Authorization: Bearer <JWT>
┌──────────────────────────▼──────────────────────────────────────────┐
│                      BACKEND (Render)                               │
│                   NestJS 10 + TypeScript 5                          │
│            https://<TU-BACKEND>.onrender.com/api                    │
│                                                                     │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐  │
│  │   Auth   │ │  Gyms    │ │ Classes  │ │Marketplace│ │Wearables │  │
│  │  Module  │ │  Module  │ │  Module  │ │  Module  │ │  Module  │  │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘ └──────────┘  │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐  │
│  │Analytics │ │Marketing │ │Recommend.│ │ Payments │ │ Sponsors │  │
│  │  Module  │ │  Module  │ │  Module  │ │  Module  │ │  Module  │  │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘ └──────────┘  │
│                                                                     │
│                    Prisma ORM (TypeScript)                          │
└──────────────────────────┬──────────────────────────────────────────┘
                           │ SSL / TLS
┌──────────────────────────▼──────────────────────────────────────────┐
│                   BASE DE DATOS (Neon Cloud)                        │
│                  PostgreSQL 15 + Connection Pooling                 │
│              <HOST>.neon.tech                                       │
└─────────────────────────────────────────────────────────────────────┘

SERVICIOS EXTERNOS:
  ├── Resend API          → Emails transaccionales y marketing
  ├── Google Gemini API   → Recomendaciones IA personalizadas
  ├── Fitbit OAuth2 API   → Sincronización de wearables
  └── Pay-Me              → Procesamiento de pagos
```

---

## 3. Módulos del Backend

```
backend/src/
├── auth/               JWT login, register, refresh tokens, guards
├── gyms/               CRUD gimnasios, miembros, configuración
├── trainers/           Perfiles de entrenadores, asignación a gimnasios
├── classes/            Clases deportivas, horarios, capacidad, QR
├── memberships/        Planes y suscripciones de membresía
├── marketplace/        Productos, inventario, órdenes
├── professionals/      Entrenadores freelance, nutricionistas, etc.
├── events/             Torneos, eventos, masterclasses
├── analytics/          KPIs: MRR, retención, asistencia
├── marketing/          Campañas de email (Resend), CRM básico
├── wearables/          OAuth2 Fitbit, sync métricas salud
├── recommendations/    IA Gemini: recomendaciones personalizadas
├── payments/           Integración Pay-Me, historial pagos
├── invoices/           Facturación automatizada
├── notifications/      Notificaciones en plataforma
└── prisma/             Servicio de base de datos (Prisma Client)
```

---

## 4. Schema de Base de Datos (Modelos principales)

```
User ──────────────────── Gym (GYM_OWNER)
  │                         │
  ├── UserMembership ────── MembershipPlan
  ├── Reservation ────────── Class ──── TrainerProfile
  ├── Order ──────────────── Product
  ├── WearableConnection    │
  ├── WearableMetric        ├── MarketingCampaign
  └── CrmNote              ├── VendorApplication
                            ├── SponsorshipDeal ── Sponsor
                            └── Invoice

Event ──── SponsorshipDeal ── Sponsor
Payment ── User
RefreshToken ── User
Notification ── User
```

---

## 5. Endpoints de la API

**Base URL Producción**: `https://<TU-BACKEND>.onrender.com/api`  
**Base URL Local**: `http://localhost:3000/api`  
**Swagger Docs**: `/api/docs`

### 🔓 Auth (Público)

| Método | Endpoint | Descripción |
|---|---|---|
| `POST` | `/auth/register` | Registro de nuevo usuario |
| `POST` | `/auth/login` | Login → retorna `access_token` + `refresh_token` |
| `POST` | `/auth/refresh` | Renovar access token con refresh token |
| `GET` | `/auth/me` | 🔒 Perfil del usuario autenticado |

### 🏟️ Gyms

| Método | Endpoint | Auth | Descripción |
|---|---|---|---|
| `GET` | `/gyms` | Público | Listar todos los gimnasios |
| `GET` | `/gyms/nearby` | Público | Búsqueda por ubicación (Haversine) |
| `GET` | `/gyms/:id` | Público | Detalle de gimnasio |
| `POST` | `/gyms` | 🔒 GYM_OWNER | Crear gimnasio |
| `PATCH` | `/gyms/:id` | 🔒 GYM_OWNER | Actualizar gimnasio |
| `GET` | `/gyms/:id/members` | 🔒 GYM_OWNER | Ver miembros |

### 🏃 Clases y Reservas

| Método | Endpoint | Auth | Descripción |
|---|---|---|---|
| `GET` | `/classes` | Público | Listar clases |
| `POST` | `/classes/:gymId` | 🔒 GYM_OWNER/TRAINER | Crear clase |
| `POST` | `/classes/:id/book` | 🔒 USER | Reservar clase |
| `DELETE` | `/classes/:id/book` | 🔒 USER | Cancelar reserva |
| `PATCH` | `/classes/reservations/:id/attend` | 🔒 GYM_OWNER | Marcar asistencia |

### 💳 Membresías

| Método | Endpoint | Auth | Descripción |
|---|---|---|---|
| `GET` | `/memberships/plans` | Público | Planes disponibles |
| `POST` | `/memberships/plans/:gymId` | 🔒 GYM_OWNER | Crear plan |
| `POST` | `/memberships/subscribe` | 🔒 USER | Suscribirse a plan |
| `GET` | `/memberships/me` | 🔒 USER | Mis membresías activas |

### 🛍️ Marketplace

| Método | Endpoint | Auth | Descripción |
|---|---|---|---|
| `GET` | `/marketplace/products` | Público | Listar productos |
| `POST` | `/marketplace/products/:gymId` | 🔒 GYM_OWNER | Crear producto |
| `PATCH` | `/marketplace/products/:id` | 🔒 GYM_OWNER | Actualizar stock/precio |
| `POST` | `/marketplace/orders` | 🔒 USER | Crear orden (resta stock) |
| `GET` | `/marketplace/orders/me` | 🔒 USER | Mis órdenes |

### ⌚ Wearables (Fitbit OAuth2)

| Método | Endpoint | Auth | Descripción |
|---|---|---|---|
| `GET` | `/wearables/fitbit/auth-url` | 🔒 USER | URL de autorización Fitbit |
| `POST` | `/wearables/fitbit/callback` | 🔒 USER | Exchange code → tokens |
| `POST` | `/wearables/fitbit/sync` | 🔒 USER | Sincronizar datos reales |
| `GET` | `/wearables/fitbit/status` | 🔒 USER | Estado de conexión |
| `DELETE` | `/wearables/fitbit/disconnect` | 🔒 USER | Revocar tokens |
| `GET` | `/wearables/metrics` | 🔒 USER | Historial de métricas |

### 📊 Analytics

| Método | Endpoint | Auth | Descripción |
|---|---|---|---|
| `GET` | `/analytics/gym/:gymId/dashboard` | 🔒 GYM_OWNER | KPIs: MRR, retención, asistencia |

### 📣 Marketing

| Método | Endpoint | Auth | Descripción |
|---|---|---|---|
| `POST` | `/marketing/gym/:gymId/campaigns` | 🔒 GYM_OWNER | Crear y enviar campaña email |
| `GET` | `/marketing/gym/:gymId/campaigns` | 🔒 GYM_OWNER | Historial de campañas |

### 🤖 Recomendaciones IA

| Método | Endpoint | Auth | Descripción |
|---|---|---|---|
| `GET` | `/recommendations` | 🔒 USER | Recomendaciones personalizadas (Gemini) |
| `POST` | `/recommendations/chat` | 🔒 USER | Chat con asistente deportivo IA |

### 💰 Pagos

| Método | Endpoint | Auth | Descripción |
|---|---|---|---|
| `POST` | `/payments/create-intent` | 🔒 USER | Crear intención de pago (Pay-Me) |

### 🔔 Notificaciones

| Método | Endpoint | Auth | Descripción |
|---|---|---|---|
| `GET` | `/notifications` | 🔒 USER | Listar notificaciones |
| `PATCH` | `/notifications/:id/read` | 🔒 USER | Marcar como leída |

---

## 6. Flujos Clave

### Flujo de Autenticación JWT
```
1. POST /auth/login → { access_token, refresh_token }
2. Frontend guarda tokens (localStorage o memory)
3. Cada request: Authorization: Bearer <access_token>
4. access_token expira en 24h
5. POST /auth/refresh con refresh_token → nuevo access_token
6. refresh_token expira en 7 días → requiere login nuevamente
```

### Flujo OAuth2 Fitbit
```
1. GET /wearables/fitbit/auth-url → { url: "https://fitbit.com/oauth2/..." }
2. Redirigir usuario a la URL de Fitbit
3. Usuario autoriza en Fitbit.com
4. Fitbit redirige a /dashboard/wearables/fitbit-callback?code=XXX
5. POST /wearables/fitbit/callback { code, redirect_uri }
   → intercambia code por access_token + refresh_token
   → guarda tokens en tabla wearable_connections
6. POST /wearables/fitbit/sync → llama Fitbit API con token válido
   → guarda steps, calories, heartRate en wearable_metrics
7. Auto-refresh: si token expira, usa refresh_token automáticamente
```

### Flujo de Compra en Marketplace
```
1. GET /marketplace/products → lista productos disponibles
2. POST /marketplace/orders { items: [{productId, quantity}] }
   → Verifica stock en transacción atómica
   → Resta stock de cada producto
   → Crea registro en orders + order_items
   → Retorna orden creada
```

---

## 7. Seguridad

- **Passwords**: bcrypt con salt rounds 10
- **JWT**: RS256 / HS256, expiración corta en access token
- **Guards**: `JwtAuthGuard` en todos los endpoints protegidos
- **CORS**: solo orígenes en `FRONTEND_URL`
- **Validación**: class-validator en todos los DTOs
- **SQL Injection**: imposible vía Prisma (prepared statements)

---

## 8. Variables de Entorno Requeridas

Ver `backend/.env.example` para la lista completa con descripciones.
