import {
  CanActivate,
  ExecutionContext,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { createHmac, timingSafeEqual } from 'crypto';

/**
 * Valida la cabecera x-signature de los webhooks de Mercado Pago.
 * Manifiesto firmado: "id:<data.id>;request-id:<x-request-id>;ts:<ts>;"
 * con HMAC-SHA256 y el secreto del webhook (MP_WEBHOOK_SECRET).
 * Verifica el formato contra la documentación vigente de Mercado Pago:
 * no lo he comprobado contra su documentación actual.
 *
 * Sin MP_WEBHOOK_SECRET: en producción rechaza; en local deja pasar con aviso
 * (el servicio igual consulta a Mercado Pago el estado real).
 */
@Injectable()
export class MercadoPagoSignatureGuard implements CanActivate {
  private readonly logger = new Logger(MercadoPagoSignatureGuard.name);

  canActivate(context: ExecutionContext): boolean {
    const secret = process.env.MP_WEBHOOK_SECRET;
    if (!secret) {
      if (process.env.NODE_ENV === 'production') {
        this.logger.error('MP_WEBHOOK_SECRET no está configurada');
        throw new UnauthorizedException();
      }
      this.logger.warn('MP_WEBHOOK_SECRET no configurada: firma sin validar (solo local)');
      return true;
    }

    const req = context.switchToHttp().getRequest();
    const signature = req.headers['x-signature'];
    const requestId = req.headers['x-request-id'];
    if (typeof signature !== 'string' || typeof requestId !== 'string') {
      throw new UnauthorizedException();
    }

    const parts: Record<string, string> = {};
    for (const piece of signature.split(',')) {
      const i = piece.indexOf('=');
      if (i > 0) parts[piece.slice(0, i).trim()] = piece.slice(i + 1).trim();
    }
    const { ts, v1 } = parts;
    if (!ts || !v1) throw new UnauthorizedException();

    const dataId = String(req.query?.['data.id'] ?? '').toLowerCase();
    const manifest =
      (dataId ? `id:${dataId};` : '') + `request-id:${requestId};ts:${ts};`;

    const expected = createHmac('sha256', secret).update(manifest).digest('hex');
    const a = Buffer.from(expected);
    const b = Buffer.from(v1);
    if (a.length !== b.length || !timingSafeEqual(a, b)) {
      throw new UnauthorizedException();
    }
    return true;
  }
}