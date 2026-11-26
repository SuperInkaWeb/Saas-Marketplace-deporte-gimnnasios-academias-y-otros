// Lo que la API devuelve de un gimnasio y de lo que vende (planes y productos).
// Base: backend/prisma/schema.prisma. Los campos opcionales (?) son los que no
// todos los endpoints incluyen o que pueden venir vacíos (null).

export type GymStatus = 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';

export interface Gym {
  id: string;
  ownerId: string;
  name: string;
  description?: string | null;
  address?: string | null;
  city?: string | null;
  district?: string | null;
  province?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  phone?: string | null;
  website?: string | null;
  logoUrl?: string | null;
  openTime?: string | null;
  closeTime?: string | null;
  openDays?: string | null;
  status: GymStatus;
  // No existen en la base de datos; las pantallas los revisan por si llegan.
  bannerUrl?: string | null;
  imageUrl?: string | null;
  // Solo en el listado de gimnasios: entrenadores vinculados.
  gymTrainers?: { trainer?: { userId: string } }[];
}

// Ojo: los montos (Decimal en la BD) llegan de la API como texto, por ejemplo "49.90".
// Por eso price es number | string y las pantallas lo pasan por Number().

export interface MembershipPlan {
  id: string;
  gymId: string;
  name: string;
  description?: string | null;
  price: number | string;
  durationDays: number;
  maxClasses?: number | null;
  includesMarketplace: boolean;
}

export interface Product {
  id: string;
  gymId: string;
  name: string;
  description?: string | null;
  price: number | string;
  stock: number;
  category?: string | null;
  imageUrl?: string | null;
}

// Producto dentro del carrito, con la cantidad elegida.
export interface CartItem extends Product {
  qty: number;
}
