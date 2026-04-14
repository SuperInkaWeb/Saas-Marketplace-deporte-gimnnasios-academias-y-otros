import { Controller, Post, Get, Body, Param, UseGuards, Request } from '@nestjs/common';
import { WearablesService } from './wearables.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('wearables')
@UseGuards(JwtAuthGuard)
export class WearablesController {
  constructor(private readonly wearablesService: WearablesService) {}

  @Post('sync')
  async syncData(@Request() req, @Body() data: any) {
    const userId = req.user.id;
    return this.wearablesService.syncData(userId, data);
  }

  @Get('metrics')
  async getMetrics(@Request() req) {
    const userId = req.user.id;
    return this.wearablesService.getMetrics(userId);
  }

  // Integración Real con FITBIT API
  @Get('fitbit/auth')
  async fitbitAuth(@Request() req) {
    // Redirige al API real de Fitbit para OAuth2
    const client_id = process.env.FITBIT_CLIENT_ID || 'fitbit_demo_id';
    const redirect_uri = encodeURIComponent('http://localhost:5173/dashboard/wearables');
    const scope = 'activity heartrate sleep profile';
    return { 
      url: `https://www.fitbit.com/oauth2/authorize?response_type=token&client_id=${client_id}&redirect_uri=${redirect_uri}&scope=${scope}&expires_in=604800`
    };
  }
}
