"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RecommendationsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let RecommendationsService = class RecommendationsService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getPersonalizedRecommendations(userId) {
        const [reservations, orders, userMemberships, user, allClasses, allGyms, allEvents] = await Promise.all([
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
        const bookedClassIds = new Set(reservations.map((r) => r.classId));
        const gymVisits = {};
        const cityVisits = {};
        const pricePaid = [];
        const timeSlots = [];
        const titleWords = {};
        for (const res of reservations) {
            const cls = res.class;
            gymVisits[cls.gymId] = (gymVisits[cls.gymId] || 0) + 1;
            if (cls.gym?.city)
                cityVisits[cls.gym.city] = (cityVisits[cls.gym.city] || 0) + 1;
            pricePaid.push(Number(cls.price));
            timeSlots.push(new Date(cls.scheduledAt).getHours());
            cls.title
                .toLowerCase()
                .split(/\s+/)
                .forEach((w) => {
                if (w.length > 3)
                    titleWords[w] = (titleWords[w] || 0) + 1;
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
        const insights = [];
        if (isNewUser) {
            insights.push('🚀 ¡Bienvenido! Te mostramos las clases más populares para empezar.');
        }
        else {
            const timeLabel = avgHour < 12 ? 'mañanas' : avgHour < 17 ? 'tardes' : 'noches';
            insights.push(`⏰ Prefieres entrenar en las ${timeLabel} (alrededor de las ${avgHour}:00 hs).`);
            if (topKeywords.length > 0)
                insights.push(`💪 Tus disciplinas favoritas: ${topKeywords.slice(0, 3).join(', ')}.`);
            if (avgPrice > 0)
                insights.push(`💰 Tu rango de precio habitual es ~$${Math.round(avgPrice)} por clase.`);
            if (preferredCity)
                insights.push(`📍 Normalmente reservas en ${preferredCity}.`);
        }
        if (userMemberships.length > 0) {
            insights.push(`✅ Tienes una membresía activa en ${userMemberships[0].plan.gym?.name}.`);
        }
        const recommendations = [];
        for (const cls of allClasses) {
            if (bookedClassIds.has(cls.id))
                continue;
            let score = 50;
            const reasons = [];
            if (preferredCity && cls.gym?.city?.toLowerCase() === preferredCity.toLowerCase()) {
                score += 25;
                reasons.push(`en ${cls.gym.city}`);
            }
            if (preferredGymId && cls.gymId === preferredGymId) {
                score += 20;
                reasons.push('en tu gimnasio favorito');
            }
            const clsWords = cls.title.toLowerCase().split(/\s+/);
            const keywordMatches = topKeywords.filter((k) => clsWords.some((w) => w.includes(k)));
            if (keywordMatches.length > 0) {
                score += keywordMatches.length * 15;
                reasons.push(`disciplina que te gusta`);
            }
            const price = Number(cls.price);
            if (avgPrice > 0 && Math.abs(price - avgPrice) <= avgPrice * 0.5) {
                score += 10;
            }
            const clsHour = new Date(cls.scheduledAt).getHours();
            if (Math.abs(clsHour - avgHour) <= 2) {
                score += 10;
                reasons.push('en tu horario preferido');
            }
            const reservationCount = cls._count?.reservations ?? 0;
            score += Math.min(reservationCount * 3, 20);
            if (reservationCount > 3)
                reasons.push('muy popular');
            if (isNewUser && reservationCount > 0)
                score += 15;
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
        const sorted = recommendations.sort((a, b) => b.score - a.score).slice(0, 8);
        return { recommendations: sorted, insights, userProfile };
    }
};
exports.RecommendationsService = RecommendationsService;
exports.RecommendationsService = RecommendationsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], RecommendationsService);
//# sourceMappingURL=recommendations.service.js.map