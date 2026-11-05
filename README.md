# 🏋️ Hercix — Plataforma SaaS & Marketplace Deportivo

> **Plataforma multi-tenant production-ready** para gestión integral de gimnasios, academias deportivas y centros fitness. Incluye SaaS de gestión + Marketplace integrado + IA de recomendaciones + OAuth2 con Fitbit.

[![Deploy Status](https://img.shields.io/badge/Backend-Render-46E3B7?logo=render)](https://sportnexus-platform.onrender.com/api)
[![Frontend](https://img.shields.io/badge/Frontend-Vercel-black?logo=vercel)](https://hercix.com)
[![DB](https://img.shields.io/badge/Database-Neon_PostgreSQL-00E5A0?logo=postgresql)](https://neon.tech)

---

## 🌐 URLs de Producción

| Servicio | URL |
|---|---|
| **Frontend (Producción)** | https://hercix.com |
| **Frontend (Vercel)** | https://sportnexus-platform.vercel.app |
| **Backend API (Render)** | https://sportnexus-platform.onrender.com/api |
| **API Docs (Swagger)** | https://sportnexus-platform.onrender.com/api/docs |

---

## 🗂️ Estructura del Repositorio

```
sports-saas-platform/
├── backend/          # NestJS API (Node.js + TypeScript)
│   ├── src/          # Código fuente (módulos)
│   ├── prisma/       # Schema y migraciones de BD
│   └── .env.example  # Variables de entorno (plantilla)
├── frontend/         # React + Vite + TailwindCSS
│   ├── src/          # Código fuente (páginas, componentes)
│   └── .env.example  # Variables de entorno (plantilla)
├── docs/             # Documentación técnica y de usuario
│   ├── DEPLOYMENT.md         # Guía de despliegue paso a paso
│   ├── TECHNICAL_MANUAL.md   # Manual técnico (arquitectura + endpoints)
│   ├── USER_MANUAL.md        # Manual de usuario por roles
│   ├── SERVICES.md           # Servicios externos y configuración
│   └── DATABASE_BACKUP.md    # Instrucciones de backup/restore BD
└── README.md         # Este archivo
```

---

## ⚡ Stack Tecnológico

| Capa | Tecnología |
|---|---|
| **Backend** | NestJS 10, Node.js 20, TypeScript 5 |
| **Frontend** | React 18, Vite 5, TailwindCSS 3, Framer Motion |
| **Base de Datos** | PostgreSQL 15 (Neon Cloud) |
| **ORM** | Prisma 6 |
| **Autenticación** | JWT (access + refresh tokens) |
| **Email** | Resend API |
| **Pagos** | Pay-Me (gateway latinoamericano) |
| **IA** | Google Gemini API |
| **Wearables** | Fitbit OAuth2 API |
| **Deploy Backend** | Render (Free tier) |
| **Deploy Frontend** | Vercel (Free tier) |
| **Base de datos** | Neon PostgreSQL (Free tier) |

---

## 🚀 Inicio Rápido — Desarrollo Local

### Pre-requisitos
- Node.js 20+
- npm 10+
- PostgreSQL 15+ (o usar Neon Cloud)

### 1. Clonar el repositorio
```bash
git clone https://github.com/SuperInkaWeb/Saas-Marketplace-deporte-gimnnasios-academias-y-otros.git hercix-platform
cd hercix-platform
```

### 2. Configurar el Backend
```bash
cd backend
cp .env.example .env
# Editar .env con tus credenciales (ver docs/SERVICES.md)

npm install
npx prisma migrate deploy # Crear tablas en BD (migraciones versionadas)
npx prisma generate       # Generar cliente Prisma
npm run start:dev         # Servidor en http://localhost:3000/api
```

### 3. Configurar el Frontend
```bash
cd ../frontend
cp .env.example .env
# Editar .env con VITE_API_URL=http://localhost:3000/api

npm install
npm run dev               # App en http://localhost:5173
```

---

## 📦 Módulos del Sistema

| Módulo | Descripción |
|---|---|
| **Auth** | Registro, login, JWT, refresh tokens |
| **Gyms** | Gestión multi-tenant de gimnasios |
| **Classes** | Programación de clases y reservas |
| **Memberships** | Planes de membresía y suscripciones |
| **Marketplace** | Tienda de productos deportivos |
| **Professionals** | Entrenadores y servicios freelance |
| **Events** | Torneos, masterclasses y eventos |
| **Analytics** | Dashboard KPIs (MRR, retención, asistencia) |
| **Marketing/CRM** | Campañas de email via Resend |
| **Wearables** | Integración OAuth2 con Fitbit API |
| **Recommendations** | IA (Gemini) para recomendaciones personalizadas |
| **Payments** | Integración Pay-Me |
| **Invoices** | Facturación automatizada |
| **Notifications** | Sistema de notificaciones en plataforma |
| **Discovery** | Búsqueda de gimnasios por ubicación (Haversine) |

---

## 👥 Roles del Sistema

| Rol | Descripción |
|---|---|
| `ADMIN` | Administrador de plataforma — acceso total |
| `GYM_OWNER` | Dueño de negocio deportivo — gestiona su(s) gimnasio(s) |
| `TRAINER` | Entrenador — crea y gestiona clases |
| `USER` | Atleta/cliente final — reserva clases, compra productos |

---

## 📚 Documentación

- [📖 Guía de Despliegue](./docs/DEPLOYMENT.md)
- [🏗️ Manual Técnico](./docs/TECHNICAL_MANUAL.md)
- [👤 Manual de Usuario](./docs/USER_MANUAL.md)
- [🔌 Servicios Externos](./docs/SERVICES.md)
- [🗄️ Base de Datos](./docs/DATABASE_BACKUP.md)

---

## 🔐 Seguridad

- Passwords hasheados con **bcrypt** (salt rounds: 10)
- JWT con expiración corta (24h access, 7d refresh)
- Variables sensibles **nunca** en el repositorio (`.env` en `.gitignore`)
- CORS configurado solo para orígenes autorizados
- Guards de roles en todos los endpoints protegidos

---

## 📄 Licencia

Proyecto propietario — © 2026 Hercix / SuperInkaWeb. Todos los derechos reservados.
