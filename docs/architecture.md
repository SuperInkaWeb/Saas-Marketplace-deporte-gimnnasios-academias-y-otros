# Sports SaaS Platform — Architecture

## System Overview

Multi-tenant SaaS + Marketplace for the sports industry.

## Tech Stack

| Layer | Technology |
|---|---|
| Backend API | NestJS (Node.js + TypeScript) |
| Frontend | React + Vite + TailwindCSS |
| Database | PostgreSQL 15+ |
| ORM | Prisma |
| Auth | JWT (access + refresh tokens) |
| File Storage | (future) AWS S3 / Cloudinary |
| Email | (future) SendGrid / Resend |

## Architecture Diagram

```
┌──────────────────────┐        HTTPS / REST API        ┌──────────────────────────┐
│    React Frontend    │ ◄─────────────────────────────► │   NestJS Backend (API)   │
│  (Vite + React)      │         JSON responses          │  Port 3000               │
└──────────────────────┘                                 └────────────┬─────────────┘
                                                                      │
                                                              Prisma ORM (TypeScript)
                                                                      │
                                                         ┌────────────▼─────────────┐
                                                         │   PostgreSQL Database     │
                                                         │   Port 5432              │
                                                         └──────────────────────────┘
```

## Request Flow

1. User opens React app in browser
2. React calls `POST /auth/login` → receives JWT token
3. JWT stored in memory (or httpOnly cookie)
4. All subsequent requests carry `Authorization: Bearer <token>`
5. NestJS Guard validates JWT → extracts user + role
6. Route handler executes business logic via Service
7. Service queries/mutates DB via Prisma
8. Response returned to React

## Module Breakdown

```
src/
├── auth/          JWT strategy, login, register, guards
├── users/         User CRUD, profile management
├── gyms/          Gym registration, settings, dashboard
├── trainers/      Trainer profiles, certifications
├── classes/       Class scheduling, capacity management
├── reservations/  Booking logic, cancellations
├── memberships/   Plans, subscriptions, expiry logic
├── payments/      Payment records, history
├── marketplace/   Products, categories, inventory
└── orders/        Cart, order creation, order history
```

## Multi-tenancy Model

- **Shared schema, tenant-isolated data**: all gyms share one database
- Every table that belongs to a gym includes `gym_id` (FK)
- Backend always scopes queries to the authenticated gym owner's gym
- Platform Admin can see all gyms

## Environments

| Env | Backend URL | Frontend URL |
|---|---|---|
| Development | http://localhost:3000 | http://localhost:5173 |
| Production | TBD (Render / Railway) | TBD (Vercel) |
