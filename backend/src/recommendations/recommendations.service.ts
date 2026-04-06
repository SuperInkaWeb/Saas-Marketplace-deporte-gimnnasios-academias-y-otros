import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface Recommendation {
  type: 'CLASS' | 'GYM' | 'EVENT' | 'PROFESSIONAL';
  id: string;
  title: string;
  subtitle: string;
  reason: string;
  score: number;
  data: any;
}

@Injectable()
export class RecommendationsService {
  constructor(private prisma: PrismaService) {}

  async getPersonalizedRecommendations(userId: string): Promise<{
    recommendations: Recommendation[];
    insights: string[];
    userProfile: any;
  }> {
    // Gather user data in parallel
    const [reservations, orders, userMemberships, user, allClasses, allGyms, allEvents] =
      await Promise.all([
        this.prisma.reservation.findMany({
          where: { userId },
          include: { class: { include: { gym: true } } },
          orderBy: { bookedAt: 'desc' },
          take: 20,
        }),
        this.prisma.order.findMany({
          where: { userId },
          include: { orderItems: { include: { product: true } } },
          take: 10,
        }),
        this.prisma.userMembership.findMany({
          where: { userId, status: 'ACTIVE' },
          include: { plan: { include: { gym: true } } },
        }),
        this.prisma.user.findUnique({
          where: { id: userId },
          select: { id: true, name: true, createdAt: true },
        }),
        this.prisma.class.findMany({
          where: { isActive: true, scheduledAt: { gte: new Date() } },
          include: {
            gym: { select: { id: true, name: true, city: true, latitude: true, longitude: true } },
            trainer: { include: { user: { select: { name: true } } } },
            _count: { select: { reservations: true } },
          },
          orderBy: { scheduledAt: 'asc' },
          take: 50,
        }),
        this.prisma.gym.findMany({
          where: { status: 'ACTIVE' },
          include: {
            _count: { select: { classes: true, gymTrainers: true } },
          },
          take: 20,
        }),
        this.prisma.event.findMany({
          where: { isActive: true, date: { gte: new Date() } },
          include: { organizer: { select: { name: true } } },
          orderBy: { date: 'asc' },
          take: 10,
        }),
      ]);

    // ── Build User Profile ─────────────────────────────────────────────────
    const bookedClassIds = new Set(reservations.map((r) => r.classId));
    const gymVisits: Record<string, number> = {};
    const cityVisits: Record<string, number> = {};
    const pricePaid: number[] = [];
    const timeSlots: number[] = [];
    const titleWords: Record<string, number> = {};

    for (const res of reservations) {
      const cls = res.class;
      gymVisits[cls.gymId] = (gymVisits[cls.gymId] || 0) + 1;
      if (cls.gym?.city) cityVisits[cls.gym.city] = (cityVisits[cls.gym.city] || 0) + 1;
      pricePaid.push(Number(cls.price));
      timeSlots.push(new Date(cls.scheduledAt).getHours());
      cls.title
        .toLowerCase()
        .split(/\s+/)
        .forEach((w) => {
          if (w.length > 3) titleWords[w] = (titleWords[w] || 0) + 1;
        });
    }

    const avgPrice = pricePaid.length
      ? pricePaid.reduce((a, b) => a + b, 0) / pricePaid.length
      : 25;
    const avgHour = timeSlots.length
      ? Math.round(timeSlots.reduce((a, b) => a + b, 0) / timeSlots.length)
      : 9;
    const preferredCity = Object.entries(cityVisits).sort((a, b) => b[1] - a[1])[0]?.[0];
    const preferredGymId = Object.entries(gymVisits).sort((a, b) => b[1] - a[1])[0]?.[0];
    const topKeywords = Object.entries(titleWords)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([w]) => w);
    const isNewUser = reservations.length === 0;

    const userProfile = {
      totalReservations: reservations.length,
      avgPrice: Math.round(avgPrice),
      preferredHour: avgHour,
      preferredCity,
      preferredGymId,
      topKeywords,
      isNewUser,
      hasActiveMembership: userMemberships.length > 0,
    };

    // ── Insights (natural language) ────────────────────────────────────────
    const insights: string[] = [];

    if (isNewUser) {
      insights.push('🚀 ¡Bienvenido! Te mostramos las clases más populares para empezar.');
    } else {
      const timeLabel = avgHour < 12 ? 'mañanas' : avgHour < 17 ? 'tardes' : 'noches';
      insights.push(`⏰ Prefieres entrenar en las ${timeLabel} (alrededor de las ${avgHour}:00 hs).`);
      if (topKeywords.length > 0)
        insights.push(`💪 Tus disciplinas favoritas: ${topKeywords.slice(0, 3).join(', ')}.`);
      if (avgPrice > 0)
        insights.push(`💰 Tu rango de precio habitual es ~$${Math.round(avgPrice)} por clase.`);
      if (preferredCity) insights.push(`📍 Normalmente reservas en ${preferredCity}.`);
    }

    if (userMemberships.length > 0) {
      insights.push(`✅ Tienes una membresía activa en ${userMemberships[0].plan.gym?.name}.`);
    }

    // ── Score Classes ──────────────────────────────────────────────────────
    const recommendations: Recommendation[] = [];

    for (const cls of allClasses) {
      if (bookedClassIds.has(cls.id)) continue; // skip already booked

      let score = 50; // base score
      const reasons: string[] = [];

      // City match
      if (preferredCity && cls.gym?.city?.toLowerCase() === preferredCity.toLowerCase()) {
        score += 25;
        reasons.push(`en ${cls.gym.city}`);
      }

      // Gym preference
      if (preferredGymId && cls.gymId === preferredGymId) {
        score += 20;
        reasons.push('en tu gimnasio favorito');
      }

      // Keyword match in title
      const clsWords = cls.title.toLowerCase().split(/\s+/);
      const keywordMatches = topKeywords.filter((k) => clsWords.some((w) => w.includes(k)));
      if (keywordMatches.length > 0) {
        score += keywordMatches.length * 15;
        reasons.push(`disciplina que te gusta`);
      }

      // Price match
      const price = Number(cls.price);
      if (avgPrice > 0 && Math.abs(price - avgPrice) <= avgPrice * 0.5) {
        score += 10;
      }

      // Time match (within 2 hours)
      const clsHour = new Date(cls.scheduledAt).getHours();
      if (Math.abs(clsHour - avgHour) <= 2) {
        score += 10;
        reasons.push('en tu horario preferido');
      }

      // Popularity boost
      const reservationCount = cls._count?.reservations ?? 0;
      score += Math.min(reservationCount * 3, 20);
      if (reservationCount > 3) reasons.push('muy popular');

      // New user: boost all popular classes
      if (isNewUser && reservationCount > 0) score += 15;

      if (score >= 50) {
        recommendations.push({
          type: 'CLASS',
          id: cls.id,
          title: cls.title,
          subtitle: `${cls.gym?.name} · $${price}`,
          reason: reasons.length > 0 ? `Recomendado porque es ${reasons.join(', ')}` : 'Popular en tu zona',
          score,
          data: cls,
        });
      }
    }

    // ── Score Events ───────────────────────────────────────────────────────
    for (const event of allEvents) {
      recommendations.push({
        type: 'EVENT',
        id: event.id,
        title: event.title,
        subtitle: `${event.eventType} · ${new Date(event.date).toLocaleDateString('es-CO', { day: 'numeric', month: 'short' })}`,
        reason: 'Evento próximo en tu comunidad',
        score: 60,
        data: event,
      });
    }

    // ── Score Gyms (for new users or those with no preferred gym) ──────────
    if (isNewUser || !preferredGymId) {
      for (const gym of allGyms.slice(0, 3)) {
        recommendations.push({
          type: 'GYM',
          id: gym.id,
          title: gym.name,
          subtitle: `${gym.city || 'Disponible'} · ${gym._count.classes} clases`,
          reason: 'Gimnasio con alta oferta de clases',
          score: 55 + gym._count.classes * 2,
          data: gym,
        });
      }
    }

    // ── Sort and return top 8 ──────────────────────────────────────────────
    const sorted = recommendations.sort((a, b) => b.score - a.score).slice(0, 8);

    return { recommendations: sorted, insights, userProfile };
  }
}
