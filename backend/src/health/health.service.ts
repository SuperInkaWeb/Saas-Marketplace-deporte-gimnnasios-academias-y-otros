import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateHealthMetricDto } from './dto/create-health-metric.dto';
import { UpdateGoalDto, UpsertMetDto } from './dto/health.dto';
import { HealthMetricType, UserRole } from '@prisma/client';
import { AuthUser, isGlobalAdmin } from '../common/gym-access/gym-access.service';

@Injectable()
export class HealthService {
  constructor(private prisma: PrismaService) {}

  // ── Control de acceso (AUD-12) ────────────────────────────────────────────

  // Coach vinculado: entrenador de un gimnasio donde el atleta tiene membresía activa
  // (mismo criterio que getCoachAthletes).
  private async isLinkedCoach(coachUserId: string, athleteId: string) {
    const membership = await this.prisma.userMembership.findFirst({
      where: {
        userId: athleteId,
        status: 'ACTIVE',
        plan: { gym: { gymTrainers: { some: { trainer: { userId: coachUserId } } } } },
      },
      select: { id: true },
    });
    return !!membership;
  }

  // Datos de salud de un atleta: él mismo, su coach vinculado o ADMIN.
  async assertCanViewAthlete(viewer: AuthUser, athleteId: string) {
    if (viewer.id === athleteId || isGlobalAdmin(viewer)) return;
    if (await this.isLinkedCoach(viewer.id, athleteId)) return;
    throw new ForbiddenException('No tienes acceso a los datos de salud de este usuario');
  }

  // Recomendaciones: solo su coach vinculado o ADMIN.
  async assertCanCoachAthlete(viewer: AuthUser, athleteId: string) {
    if (isGlobalAdmin(viewer)) {
      const athlete = await this.prisma.user.findUnique({ where: { id: athleteId }, select: { id: true } });
      if (!athlete) throw new NotFoundException('Atleta no encontrado');
      return;
    }
    if (viewer.id !== athleteId && (await this.isLinkedCoach(viewer.id, athleteId))) return;
    throw new ForbiddenException('Solo el coach del atleta puede registrar recomendaciones');
  }

  // ── Health Metrics Logging ────────────────────────────────────────────────

  async createOrUpdate(userId: string, dto: CreateHealthMetricDto) {
    const date = new Date(dto.date);
    date.setUTCHours(0, 0, 0, 0);

    // Si es peso, también actualizamos el campo weight en la tabla User
    if (dto.type === HealthMetricType.WEIGHT) {
      await this.prisma.user.update({
        where: { id: userId },
        data: { weight: dto.value },
      });
    }

    return this.prisma.healthMetric.upsert({
      where: {
        userId_date_type: {
          userId,
          date,
          type: dto.type,
        },
      },
      update: {
        value: dto.value,
        unit: dto.unit,
      },
      create: {
        userId,
        type: dto.type,
        value: dto.value,
        unit: dto.unit,
        date,
      },
    });
  }

  async findAll(userId: string) {
    return this.prisma.healthMetric.findMany({
      where: { userId },
      orderBy: { date: 'desc' },
    });
  }

  // ── Activity MET configs (Super Admin) ────────────────────────────────────

  async findMETs() {
    return this.prisma.activityMET.findMany({
      orderBy: { name: 'asc' },
    });
  }

  async createOrUpdateMET(dto: UpsertMetDto) {
    return this.prisma.activityMET.upsert({
      where: { name: dto.name },
      update: {
        metValue: dto.metValue,
        intensity: dto.intensity,
        defaultDuration: dto.defaultDuration ?? 60,
      },
      create: {
        name: dto.name,
        metValue: dto.metValue,
        intensity: dto.intensity,
        defaultDuration: dto.defaultDuration ?? 60,
      },
    });
  }

  async deleteMET(id: string) {
    const met = await this.prisma.activityMET.findUnique({ where: { id } });
    if (!met) throw new NotFoundException('Configuración MET no encontrada');
    return this.prisma.activityMET.delete({ where: { id } });
  }

  // ── User Goals ────────────────────────────────────────────────────────────

  async findGoal(userId: string) {
    let goal = await this.prisma.userGoal.findUnique({ where: { userId } });
    if (!goal) {
      goal = await this.prisma.userGoal.create({
        data: {
          userId,
          targetCalories: 600,
          targetSteps: 10000,
          targetWater: 8,
          targetWeight: 70,
        },
      });
    }
    return goal;
  }

  async createOrUpdateGoal(userId: string, dto: UpdateGoalDto) {
    // AUD-12 (H-39): campos explícitos; el userId sale siempre del token
    const data = {
      targetCalories: dto.targetCalories,
      targetSteps: dto.targetSteps,
      targetWater: dto.targetWater,
      targetWeight: dto.targetWeight,
    };
    return this.prisma.userGoal.upsert({
      where: { userId },
      update: data,
      create: { userId, ...data },
    });
  }

  // ── Coach Recommendations ─────────────────────────────────────────────────

  async createRecommendation(coachId: string, athleteId: string, observation: string) {
    return this.prisma.coachRecommendation.create({
      data: {
        coachId,
        athleteId,
        observation,
      },
    });
  }

  async findRecommendations(athleteId: string) {
    return this.prisma.coachRecommendation.findMany({
      where: { athleteId },
      orderBy: { createdAt: 'desc' },
      include: {
        coach: { select: { name: true } },
      },
    });
  }

  // ── Coach View: Athletes from Coach's Gym(s) ─────────────────────────────

  async getCoachAthletes(coachId: string) {
    // 1. Encontrar el TrainerProfile del coach
    const trainerProfile = await this.prisma.trainerProfile.findUnique({
      where: { userId: coachId },
      include: {
        gymTrainers: { select: { gymId: true } },
      },
    });

    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    let athletes: any[];

    if (trainerProfile && trainerProfile.gymTrainers.length > 0) {
      // 2a. Coach asignado a gym(s): buscar atletas con membresía activa en esos gyms
      const gymIds = trainerProfile.gymTrainers.map((g) => g.gymId);

      const memberships = await this.prisma.userMembership.findMany({
        where: {
          status: 'ACTIVE',
          plan: { gymId: { in: gymIds } },
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
              weight: true,
              avatarUrl: true,
              healthMetrics: {
                orderBy: { date: 'desc' },
                take: 60,
              },
              coachRecommendations: {
                orderBy: { createdAt: 'desc' },
                take: 1,
                include: { coach: { select: { name: true } } },
              },
            },
          },
        },
      });

      // Deduplicar por userId
      const seen = new Set<string>();
      athletes = memberships
        .map((m) => m.user)
        .filter((u) => {
          if (seen.has(u.id)) return false;
          seen.add(u.id);
          return true;
        });
    } else {
      // 2b. Coach sin gym asignado aún: retornar vacío por límites de seguridad/privacidad
      athletes = [];
    }

    const todayStr = today.toISOString().split('T')[0];

    return athletes.map((ath) => {
      const metrics = ath.healthMetrics || [];

      const todayMetrics = metrics.filter((m: any) => {
        const d = m.date instanceof Date ? m.date.toISOString() : String(m.date);
        return d.startsWith(todayStr);
      });

      const todaySteps = todayMetrics.find((m: any) => m.type === HealthMetricType.STEPS)?.value || 0;
      const todayCalories = todayMetrics.find((m: any) => m.type === HealthMetricType.CALORIES_BURNED)?.value || 0;
      const todayWater = todayMetrics.find((m: any) => m.type === HealthMetricType.WATER)?.value || 0;
      const trainedToday = todayMetrics.length > 0;

      const allCalories = metrics.filter((m: any) => m.type === HealthMetricType.CALORIES_BURNED);
      const allSteps = metrics.filter((m: any) => m.type === HealthMetricType.STEPS);

      const totalCaloriesBurned = allCalories.reduce((sum: number, c: any) => sum + c.value, 0);
      const averageSteps = allSteps.length > 0
        ? Math.round(allSteps.reduce((sum: number, s: any) => sum + s.value, 0) / allSteps.length)
        : 0;

      const lastWeight = metrics.find((m: any) => m.type === HealthMetricType.WEIGHT)?.value || ath.weight || 70;

      return {
        id: ath.id,
        name: ath.name,
        email: ath.email,
        phone: ath.phone,
        weight: lastWeight,
        avatarUrl: ath.avatarUrl,
        totalCaloriesBurned,
        averageSteps,
        lastObservation: ath.coachRecommendations?.[0]?.observation || 'Sin observaciones registradas',
        // Nuevos campos de actividad de hoy
        trainedToday,
        todaySteps,
        todayCalories: parseFloat(todayCalories.toFixed(1)),
        todayWater,
        lastActivityDate: metrics[0]?.date || null,
      };
    });
  }

  // ── Gym Owner View: Academy Performance ───────────────────────────────────

  async getOwnerStats(ownerId: string) {
    // 1. Obtener los gimnasios del dueño
    const gyms = await this.prisma.gym.findMany({
      where: { ownerId },
      select: { id: true },
    });
    const gymIds = gyms.map(g => g.id);

    // 2. Obtener total de reservaciones completadas en sus gimnasios
    const classes = await this.prisma.class.findMany({
      where: { gymId: { in: gymIds } },
      select: { id: true, title: true, durationMin: true },
    });
    const classIds = classes.map(c => c.id);

    const reservations = await this.prisma.reservation.findMany({
      where: { classId: { in: classIds }, status: 'CONFIRMED' },
      select: { userId: true, class: { select: { title: true, durationMin: true } } },
    });

    // 3. Calcular calorías quemadas totales en sus clases
    let totalGymCalories = 0;
    const athleteIds = Array.from(new Set(reservations.map(r => r.userId)));

    // Obtener pesos de atletas
    const athletes = await this.prisma.user.findMany({
      where: { id: { in: athleteIds } },
      select: { id: true, weight: true },
    });

    const metConfigs = await this.findMETs();

    for (const res of reservations) {
      const athlete = athletes.find(a => a.id === res.userId);
      const weight = athlete?.weight || 70;
      const classTitle = res.class.title;
      const durationMin = res.class.durationMin;

      const matchedMET = metConfigs.find(m => classTitle.toLowerCase().includes(m.name.toLowerCase()));
      const met = matchedMET ? matchedMET.metValue : 6.0;

      totalGymCalories += met * weight * (durationMin / 60);
    }

    return {
      gymCount: gymIds.length,
      activeAthletes: athleteIds.length,
      totalCaloriesBurnedInClasses: Math.round(totalGymCalories),
      averageClassDuration: classes.length > 0 ? Math.round(classes.reduce((sum, c) => sum + c.durationMin, 0) / classes.length) : 0,
    };
  }

  // ── Auto MET Calculation ──────────────────────────────────────────────────

  async calculateCaloriesFromClass(userId: string, classTitle: string, durationMin: number) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) return null;
    const weight = user.weight || 70;

    // Buscar MET en base de datos
    const metConfigs = await this.findMETs();
    const matchedMET = metConfigs.find(m => classTitle.toLowerCase().includes(m.name.toLowerCase()));
    const met = matchedMET ? matchedMET.metValue : 6.0; // Default 6.0 si no coincide nada

    const calories = met * weight * (durationMin / 60);
    const date = new Date();
    date.setUTCHours(0, 0, 0, 0);

    const existing = await this.prisma.healthMetric.findUnique({
      where: { userId_date_type: { userId, date, type: HealthMetricType.CALORIES_BURNED } }
    });

    const newValue = (existing?.value || 0) + calories;

    return this.prisma.healthMetric.upsert({
      where: { userId_date_type: { userId, date, type: HealthMetricType.CALORIES_BURNED } },
      update: { value: newValue },
      create: { 
        userId, 
        type: HealthMetricType.CALORIES_BURNED, 
        value: newValue, 
        unit: 'kcal', 
        date 
      }
    });
  }
}
