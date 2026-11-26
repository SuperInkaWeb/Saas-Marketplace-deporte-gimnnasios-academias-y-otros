// Servicio que ofrece un profesional (GET /professionals).
// Base: modelo ProfessionalService de backend/prisma/schema.prisma.

export interface ProfessionalService {
  id: string;
  providerId: string;
  title: string;
  description?: string | null;
  price: number | string; // Decimal: llega como texto
  serviceType: string; // PERSONAL_TRAINING | NUTRITION_PLAN | PHYSIOTHERAPY | CONSULTATION
  durationMin: number;
  provider?: { name: string; avatarUrl?: string | null };
}
