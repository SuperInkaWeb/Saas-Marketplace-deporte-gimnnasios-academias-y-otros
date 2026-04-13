import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AnalyticsService {
  constructor(private readonly prisma: PrismaService) {}

  async getDashboardStats(gymId: string) {
    const activeMembers = await this.prisma.userMembership.count({
      where: { plan: { gymId }, status: 'ACTIVE' },
    });

    const activePlans = await this.prisma.userMembership.findMany({
      where: { plan: { gymId }, status: 'ACTIVE' },
      include: { plan: true },
    });
    
    const currentMRR = activePlans.reduce((sum, member) => sum + Number(member.plan.price), 0);

    const totalClasses = await this.prisma.class.count({
      where: { gymId },
    });

    const reservationsCount = await this.prisma.reservation.count({
      where: { class: { gymId } },
    });

    // Real Retention Logic
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const membersJoinedLongAgo = await this.prisma.userMembership.count({
      where: { plan: { gymId }, startedAt: { lte: thirtyDaysAgo } }
    });

    const membersJoinedLongAgoAndActive = await this.prisma.userMembership.count({
      where: { plan: { gymId }, startedAt: { lte: thirtyDaysAgo }, status: 'ACTIVE' }
    });

    let retentionRate = 100;
    if (membersJoinedLongAgo > 0) {
      retentionRate = (membersJoinedLongAgoAndActive / membersJoinedLongAgo) * 100;
    } else {
      retentionRate = activeMembers > 0 ? 100 : 0;
    }

    // Historical data for chart (Last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
    sixMonthsAgo.setDate(1);

    const recentPayments = await this.prisma.payment.findMany({
      where: {
        status: 'COMPLETED',
        paidAt: { gte: sixMonthsAgo },
        OR: [
          { membership: { plan: { gymId } } },
          { order: { gymId } }
        ]
      },
      select: { amount: true, paidAt: true }
    });

    const monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    const mrrHistoryMap = new Map<string, number>();
    const classesHistoryMap = new Map<string, number>();
    
    for(let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const name = monthNames[d.getMonth()];
      mrrHistoryMap.set(name, 0);
      classesHistoryMap.set(name, 0);
    }

    recentPayments.forEach(p => {
      const date = p.paidAt || new Date();
      const monthName = monthNames[date.getMonth()];
      if (mrrHistoryMap.has(monthName)) {
        mrrHistoryMap.set(monthName, mrrHistoryMap.get(monthName)! + Number(p.amount));
      }
    });

    // Chart shape
    const chartData = Array.from(mrrHistoryMap.entries()).map(([name, MRR], i) => ({
      name,
      MRR,
      attendees: Math.floor(reservationsCount / 6),
      newMembers: Math.floor(activeMembers / 6)
    }));

    const currentMonthData = chartData[5] || { MRR: 0 };
    const lastMonthData = chartData[4] || { MRR: 0 };
    let mrrGrowth = 0;
    if (lastMonthData.MRR > 0) {
      mrrGrowth = ((currentMonthData.MRR - lastMonthData.MRR) / lastMonthData.MRR) * 100;
    } else if (currentMonthData.MRR > 0) {
      mrrGrowth = 100;
    }

    return {
      activeMembers,
      monthlyRecurringRevenue: currentMRR,
      totalClasses,
      reservationsCount,
      retentionRate: Number(retentionRate.toFixed(1)),
      mrrGrowth: Number(mrrGrowth.toFixed(1)),
      chartData
    };
  }
}
