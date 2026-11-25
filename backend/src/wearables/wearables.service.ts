import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SyncWearableDto } from './dto/wearables.dto';

@Injectable()
export class WearablesService {
  constructor(private readonly prisma: PrismaService) {}

  async syncData(userId: string, data: SyncWearableDto) {
    // Using upsert to handle daily tracking per device
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return this.prisma.wearableMetric.upsert({
      where: {
        userId_date: {
          userId,
          date: today,
        },
      },
      update: {
        steps: data.steps,
        heartRateAvg: data.heartRateAvg,
        calories: data.calories,
        deviceType: data.deviceType,
      },
      create: {
        userId,
        date: today,
        steps: data.steps || 0,
        heartRateAvg: data.heartRateAvg,
        calories: data.calories || 0,
        deviceType: data.deviceType || 'UNKNOWN',
      },
    });
  }

  async getMetrics(userId: string) {
    return this.prisma.wearableMetric.findMany({
      where: { userId },
      orderBy: { date: 'desc' },
      take: 7, // last 7 days
    });
  }
}
