import {
  Controller,
  Post,
  Get,
  Delete,
  Body,
  Query,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';
import { WearablesService } from './wearables.service';
import { GoogleHealthService } from './google-health.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { FitbitCallbackDto, SyncWearableDto } from './dto/wearables.dto';
import type { AuthenticatedRequest } from '../auth/types/authenticated-request';

@Controller('wearables')
@UseGuards(JwtAuthGuard)
export class WearablesController {
  constructor(
    private readonly wearablesService: WearablesService,
    private readonly googleHealthService: GoogleHealthService,
  ) {}

  // ── Manual sync (BLE / webhook) ────────────────────────────────────────────
  @Post('sync')
  async syncData(
    @Request() req: AuthenticatedRequest,
    @Body() data: SyncWearableDto,
  ) {
    return this.wearablesService.syncData(req.user.id, data);
  }

  // ── Get stored metrics ─────────────────────────────────────────────────────
  @Get('metrics')
  async getMetrics(@Request() req: AuthenticatedRequest) {
    return this.wearablesService.getMetrics(req.user.id);
  }

  // ── Get all wearable connections ───────────────────────────────────────────
  @Get('connections')
  async getConnections(@Request() req: AuthenticatedRequest) {
    return this.googleHealthService.getConnectionStatus(req.user.id);
  }

  // ── FITBIT OAUTH2 FLOW ─────────────────────────────────────────────────────

  /**
   * Step 1: Get the Google Health authorization URL
   */
  @Get('fitbit/auth-url')
  getFitbitAuthUrl(
    @Request() req: AuthenticatedRequest,
    @Query('redirect_uri') redirectUri?: string,
  ) {
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const callbackUri =
      redirectUri || `${frontendUrl}/dashboard/wearables/fitbit-callback`;

    const url = this.googleHealthService.getAuthorizationUrl(callbackUri);
    return { url, callbackUri };
  }

  /**
   * Step 2: Exchange code for tokens (called by frontend)
   */
  @Post('fitbit/callback')
  async fitbitCallback(
    @Request() req: AuthenticatedRequest,
    @Body() body: FitbitCallbackDto,
  ) {
    const tokens = await this.googleHealthService.exchangeCodeForTokens(
      req.user.id,
      body.code,
      body.redirect_uri,
    );

    return {
      success: true,
      message: '¡Google Health conectado exitosamente! Sincronizando datos...',
      expiresIn: tokens.expiresIn,
    };
  }

  /**
   * Step 3: Force sync Google Health data now
   */
  @Post('fitbit/sync')
  async syncFitbitData(@Request() req: AuthenticatedRequest) {
    const data = await this.googleHealthService.syncGoogleHealthData(
      req.user.id,
    );

    // Save the real data to the database!
    await this.wearablesService.syncData(req.user.id, data);

    return {
      success: true,
      message: 'Datos de Google Health sincronizados desde la API oficial',
      data,
    };
  }

  /**
   * Step 4: Get connection status
   */
  @Get('fitbit/status')
  async getFitbitStatus(@Request() req: AuthenticatedRequest) {
    return this.googleHealthService.getConnectionStatus(req.user.id);
  }

  /**
   * Step 5: Disconnect
   */
  @Delete('fitbit/disconnect')
  @HttpCode(HttpStatus.OK)
  async disconnectFitbit(@Request() req: AuthenticatedRequest) {
    await this.googleHealthService.disconnect(req.user.id);
    return { success: true, message: 'Desconectado correctamente' };
  }
}
