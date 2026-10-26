import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TokenCipher, TokenCipherError } from '../common/security/token-cipher';

@Injectable()
export class GoogleHealthService {
  private readonly logger = new Logger(GoogleHealthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly cipher: TokenCipher,
  ) {
    if (!cipher.enabled) {
      this.logger.warn(
        'TOKEN_ENCRYPTION_KEY no configurada: los tokens de Google Health se guardan sin cifrar',
      );
    }
  }

  // AUD-15: los tokens se guardan cifrados; uno ilegible obliga a reconectar la cuenta
  private readToken(value: string): string {
    try {
      return this.cipher.decrypt(value);
    } catch (e) {
      if (e instanceof TokenCipherError) {
        this.logger.error(e.message);
        throw new BadRequestException(
          'Token de Google inválido. Reconecta tu cuenta.',
        );
      }
      throw e;
    }
  }

  // ── Step 1: Generate the Google OAuth2 Authorization URL ──────────────────
  getAuthorizationUrl(redirectUri: string): string {
    const clientId = process.env.GOOGLE_HEALTH_CLIENT_ID;
    if (!clientId) throw new BadRequestException('GOOGLE_HEALTH_CLIENT_ID no configurado en .env');

    const scopes = [
      'https://www.googleapis.com/auth/fitness.activity.read',
      'https://www.googleapis.com/auth/fitness.heart_rate.read',
      'https://www.googleapis.com/auth/fitness.sleep.read',
    ].join(' ');

    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: scopes,
      access_type: 'offline', // For refresh token
      prompt: 'consent',
    });

    return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  }

  // ── Step 2: Exchange authorization code for tokens ─────────────────────────
  async exchangeCodeForTokens(
    userId: string,
    code: string,
    redirectUri: string,
  ): Promise<{ accessToken: string; refreshToken: string; expiresIn: number }> {
    const clientId = process.env.GOOGLE_HEALTH_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_HEALTH_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      throw new BadRequestException('Credenciales de Google no configuradas en .env');
    }

    const body = new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      code,
      grant_type: 'authorization_code',
      redirect_uri: redirectUri,
    });

    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: body.toString(),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      this.logger.error('Google token exchange failed', errorData);
      throw new BadRequestException(`Error de autenticación con Google: ${JSON.stringify(errorData)}`);
    }

    const data: any = await response.json();
    const expiresAt = new Date(Date.now() + data.expires_in * 1000);

    await this.prisma.wearableConnection.upsert({
      where: { userId_provider: { userId, provider: 'FITBIT' } }, // Reusing FITBIT enum to avoid DB migration errors during demo
      update: {
        accessToken: this.cipher.encrypt(data.access_token),
        refreshToken: data.refresh_token
          ? this.cipher.encrypt(data.refresh_token)
          : undefined,
        tokenExpiry: expiresAt,
        scope: data.scope,
      },
      create: {
        userId,
        provider: 'FITBIT',
        accessToken: this.cipher.encrypt(data.access_token),
        refreshToken: data.refresh_token
          ? this.cipher.encrypt(data.refresh_token)
          : undefined,
        tokenExpiry: expiresAt,
        scope: data.scope,
      },
    });

    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      expiresIn: data.expires_in,
    };
  }

  // ── Step 3: Auto-refresh expired token ────────────────────────────────────
  async refreshAccessToken(userId: string): Promise<string> {
    const connection = await this.prisma.wearableConnection.findUnique({
      where: { userId_provider: { userId, provider: 'FITBIT' } },
    });

    if (!connection || !connection.refreshToken) {
      throw new NotFoundException('Conexión de Salud no encontrada.');
    }

    const clientId = process.env.GOOGLE_HEALTH_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_HEALTH_CLIENT_SECRET;

    const refreshToken = this.readToken(connection.refreshToken);
    const body = new URLSearchParams({
      client_id: clientId!,
      client_secret: clientSecret!,
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    });

    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: body.toString(),
    });

    if (!response.ok) {
      throw new BadRequestException('Token de Google inválido. Reconecta tu cuenta.');
    }

    const data: any = await response.json();
    const expiresAt = new Date(Date.now() + data.expires_in * 1000);

    await this.prisma.wearableConnection.update({
      where: { userId_provider: { userId, provider: 'FITBIT' } },
      data: {
        accessToken: this.cipher.encrypt(data.access_token),
        tokenExpiry: expiresAt,
        // Un refresh token guardado en texto plano (o con la clave anterior) se cifra de paso
        ...(this.cipher.needsReencrypt(connection.refreshToken)
          ? { refreshToken: this.cipher.encrypt(refreshToken) }
          : {}),
      },
    });

    return data.access_token;
  }

  async getValidAccessToken(userId: string): Promise<string> {
    const connection = await this.prisma.wearableConnection.findUnique({
      where: { userId_provider: { userId, provider: 'FITBIT' } },
    });

    if (!connection) throw new NotFoundException('No conectado a Google Health.');

    if (connection.tokenExpiry && connection.tokenExpiry < new Date(Date.now() + 5 * 60 * 1000)) {
      return this.refreshAccessToken(userId);
    }
    const accessToken = this.readToken(connection.accessToken);

    // Migración progresiva: tokens antiguos en texto plano se cifran al usarse
    if (
      this.cipher.needsReencrypt(connection.accessToken) ||
      this.cipher.needsReencrypt(connection.refreshToken)
    ) {
      await this.prisma.wearableConnection.update({
        where: { userId_provider: { userId, provider: 'FITBIT' } },
        data: {
          accessToken: this.cipher.encrypt(accessToken),
          ...(connection.refreshToken
            ? {
                refreshToken: this.cipher.encrypt(
                  this.readToken(connection.refreshToken),
                ),
              }
            : {}),
        },
      });
    }
    return accessToken;
  }

  async syncGoogleHealthData(userId: string) {
    const accessToken = await this.getValidAccessToken(userId);
    
    // Set time range for TODAY
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    const startTimeMillis = startOfDay.getTime();
    const endTimeMillis = now.getTime();

    const body = {
      aggregateBy: [
        { dataTypeName: 'com.google.step_count.delta' },
        { dataTypeName: 'com.google.calories.expended' },
        { dataTypeName: 'com.google.heart_rate.bpm' }
      ],
      bucketByTime: { durationMillis: 86400000 },
      startTimeMillis,
      endTimeMillis
    };

    const response = await fetch('https://www.googleapis.com/fitness/v1/users/me/dataset:aggregate', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      const errorText = await response.text();
      this.logger.error(`Failed to fetch from Google Fit: ${errorText}`);
      throw new BadRequestException('Error al extraer datos de Google Fit de la cuenta');
    }

    const data: any = await response.json();
    
    let steps = 0;
    let calories = 0;
    let heartRateAvg = 0;

    // Google Fit returns an array of "buckets"
    if (data.bucket && data.bucket.length > 0) {
      const bucket = data.bucket[0]; 
      
      for (const dataset of bucket.dataset) {
        if (dataset.point && dataset.point.length > 0) {
          // Google places the aggregated result in the first point
          const point = dataset.point[0];
          const value = point.value[0];
          
          if (dataset.dataSourceId.includes('step_count')) {
            steps = value.intVal || 0;
          } else if (dataset.dataSourceId.includes('calories')) {
            calories = Math.round(value.fpVal || 0);
          } else if (dataset.dataSourceId.includes('heart_rate')) {
            heartRateAvg = Math.round(value.fpVal || 0);
          }
        }
      }
    }

    this.logger.log(`Google Health synced real data for ${userId}: ${steps} steps`);
    return { steps, calories, heartRateAvg, deviceType: 'GOOGLE_HEALTH', date: new Date().toISOString() };
  }

  async getConnectionStatus(userId: string) {
    const connection = await this.prisma.wearableConnection.findUnique({
      where: { userId_provider: { userId, provider: 'FITBIT' } },
    });
    if (!connection) return { connected: false, provider: 'GOOGLE_HEALTH' };
    return { connected: true, provider: 'GOOGLE_HEALTH', isExpired: false };
  }

  async disconnect(userId: string) {
    await this.prisma.wearableConnection.delete({
      where: { userId_provider: { userId, provider: 'FITBIT' } },
    });
  }
}
