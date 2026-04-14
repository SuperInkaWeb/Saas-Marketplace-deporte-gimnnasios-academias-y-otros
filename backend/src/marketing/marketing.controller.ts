import { Controller, Post, Get, Body, Param, UseGuards } from '@nestjs/common';
import { MarketingService } from './marketing.service';
import { GymsService } from '../gyms/gyms.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserRole } from '@prisma/client';

@Controller('marketing')
@UseGuards(JwtAuthGuard, RolesGuard)
export class MarketingController {
  constructor(
    private readonly marketingService: MarketingService,
    private readonly gymsService: GymsService
  ) {}

  @Post('gym/:gymId/campaigns')
  @Roles('ADMIN', 'GYM_OWNER')
  async createCampaign(@Param('gymId') gymId: string, @Body() data: any, @CurrentUser() user: any) {
    if (user.role !== UserRole.ADMIN) {
      await this.gymsService.validateOwnership(gymId, user.id);
    }
    return this.marketingService.createCampaign(gymId, data);
  }

  @Get('gym/:gymId/campaigns')
  @Roles('ADMIN', 'GYM_OWNER')
  async getCampaigns(@Param('gymId') gymId: string, @CurrentUser() user: any) {
    if (user.role !== UserRole.ADMIN) {
      await this.gymsService.validateOwnership(gymId, user.id);
    }
    return this.marketingService.getCampaigns(gymId);
  }
}
