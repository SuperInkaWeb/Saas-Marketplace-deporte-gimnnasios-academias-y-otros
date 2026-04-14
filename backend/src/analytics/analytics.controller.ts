import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { GymsService } from '../gyms/gyms.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserRole } from '@prisma/client';

@Controller('analytics')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AnalyticsController {
  constructor(
    private readonly analyticsService: AnalyticsService,
    private readonly gymsService: GymsService
  ) {}

  @Get('gym/:gymId/dashboard')
  @Roles('ADMIN', 'GYM_OWNER')
  async getDashboardStats(@Param('gymId') gymId: string, @CurrentUser() user: any) {
    // Blindaje de Seguridad Real
    const isAdmin = user.role === UserRole.ADMIN;
    if (!isAdmin) {
      await this.gymsService.validateOwnership(gymId, user.id);
    }
    return this.analyticsService.getDashboardStats(gymId);
  }
}
