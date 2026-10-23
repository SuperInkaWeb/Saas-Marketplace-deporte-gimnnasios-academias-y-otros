import { ExecutionContext, Injectable, Logger } from '@nestjs/common';
import { ThrottlerGuard, ThrottlerModuleOptions } from '@nestjs/throttler';
import type { ThrottlerLimitDetail } from '@nestjs/throttler';
import type { Request } from 'express';

const MINUTE = 60_000;

// Límite general por IP (AUD-14). Ajustable con THROTTLE_LIMIT sin redesplegar código.
export const THROTTLER_OPTIONS: ThrottlerModuleOptions = {
  throttlers: [
    {
      name: 'default',
      ttl: MINUTE,
      limit: Number(process.env.THROTTLE_LIMIT) || 300,
    },
  ],
  errorMessage:
    'Demasiadas solicitudes. Espera un momento e inténtalo de nuevo.',
};

// Límites estrictos por ruta (se aplican con @Throttle)
export const LIMITS = {
  login: { default: { limit: 5, ttl: MINUTE } },
  register: { default: { limit: 5, ttl: 10 * MINUTE } },
  refresh: { default: { limit: 20, ttl: MINUTE } },
  aiChat: { default: { limit: 10, ttl: MINUTE } },
};

const LOGIN_PATH = /\/auth\/login\/?$/;

@Injectable()
export class HercixThrottlerGuard extends ThrottlerGuard {
  private readonly logger = new Logger('Throttler');

  // En el login se cuenta por IP + correo: frena la fuerza bruta contra una cuenta y,
  // si detrás de un proxy todos llegaran con la misma IP, no bloquea a los demás usuarios.
  protected getTracker(req: Request): Promise<string> {
    const ip = req.ip ?? 'unknown';
    const body = req.body as { email?: unknown } | undefined;
    const email =
      typeof body?.email === 'string' ? body.email.trim().toLowerCase() : '';
    return Promise.resolve(
      LOGIN_PATH.test(req.path ?? '') && email ? `${ip}|${email}` : ip,
    );
  }

  // Se registra cada 429 con la IP vista, para verificar en Render que el proxy se resuelve bien.
  protected async throwThrottlingException(
    context: ExecutionContext,
    detail: ThrottlerLimitDetail,
  ): Promise<void> {
    const req = context.switchToHttp().getRequest<Request>();
    this.logger.warn(
      `429 ${req.method} ${req.path} ip=${req.ip} xff=${String(req.headers['x-forwarded-for'] ?? '-')} limit=${detail.limit}/${detail.ttl}ms`,
    );
    return super.throwThrottlingException(context, detail);
  }
}
