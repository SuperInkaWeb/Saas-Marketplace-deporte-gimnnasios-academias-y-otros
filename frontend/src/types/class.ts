// Lo que la API devuelve de una clase y sus reservas (GET /classes).
// Base: backend/prisma/schema.prisma y backend/src/classes/classes.service.ts.

import type { GymStatus } from './gym';

export interface Reservation {
  id: string;
  userId: string;
  status: string; // CONFIRMED | CANCELLED | ATTENDED | NO_SHOW
  user?: {
    name?: string | null;
    dni?: string | null;
    role?: string;
  };
}

export interface ClassItem {
  id: string;
  gymId: string;
  trainerId?: string | null;
  title: string;
  description?: string | null;
  classType: 'IN_PERSON' | 'ONLINE' | 'HYBRID';
  capacity: number;
  durationMin: number;
  price: number | string; // Decimal: llega como texto
  scheduledAt: string;
  location?: string | null;
  // No existe en el backend: el buscador de ClassesPage lo revisa, pero siempre llega vacío.
  discipline?: string | null;
  gym: {
    name: string;
    city?: string | null;
    ownerId: string;
    status: GymStatus;
  };
  trainer?: { user?: { name: string; avatarUrl?: string | null } } | null;
  reservations?: Reservation[];
  // Cantidad de reservas confirmadas (el backend siempre la envía en el listado).
  _count: { reservations: number };
}
