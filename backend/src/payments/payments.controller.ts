import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Query,
  Req,
  UseGuards,
  HttpCode,
  Logger,
} from '@nestjs/common';
import { MPNotFoundError } from 'mercadopago';
import { PaymentsService } from './payments.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { MercadoPagoSignatureGuard } from './guards/mercadopago-signature.guard';
import {
  MembershipCheckoutDto,
  OrderCheckoutDto,
  ClassCheckoutDto,
  ServiceCheckoutDto,
  ConfirmPaymentDto,
} from './dto/payments.dto';
import type { AuthenticatedRequest } from '../auth/types/authenticated-request';

// Campos que leemos de la notificación de Mercado Pago (body y query).
// Es un tipo y no una clase a propósito: así el ValidationPipe no la valida (ver webhook()).
interface MpWebhookBody {
  type?: string;
  data?: { id?: string | number };
}
type MpWebhookQuery = Record<string, string | undefined>;

@Controller('payments')
export class PaymentsController {
  private readonly logger = new Logger(PaymentsController.name);

  constructor(private readonly paymentsService: PaymentsService) {}

  @UseGuards(JwtAuthGuard)
  @Post('mercadopago/membership-checkout')
  async membershipCheckout(
    @Body() dto: MembershipCheckoutDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.paymentsService.createMembershipCheckout(
      req.user.id,
      req.user.email,
      dto.planId,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Post('mercadopago/order-checkout')
  async orderCheckout(
    @Body() dto: OrderCheckoutDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.paymentsService.createOrderCheckout(
      req.user.id,
      req.user.email,
      dto.items,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Post('mercadopago/class-checkout')
  async classCheckout(
    @Body() dto: ClassCheckoutDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.paymentsService.createClassCheckout(
      req.user.id,
      req.user.email,
      dto.classId,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Post('mercadopago/service-checkout')
  async serviceCheckout(
    @Body() dto: ServiceCheckoutDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.paymentsService.createServiceCheckout(
      req.user.id,
      req.user.email,
      dto.serviceId,
      dto.notes,
    );
  }

  // El usuario vuelve de Mercado Pago y el frontend confirma con el payment_id de la URL
  @UseGuards(JwtAuthGuard)
  @Post('mercadopago/confirm')
  async confirm(
    @Body() dto: ConfirmPaymentDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.paymentsService.processMercadoPagoPayment(
      dto.paymentId,
      req.user.id,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Get('status/:id')
  async status(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    return this.paymentsService.getStatus(id, req.user.id);
  }

  // PÚBLICO: lo llama Mercado Pago. Se protege con la firma, no con JWT.
  // Sin DTO a propósito: MP puede añadir campos y el ValidationPipe global
  // con forbidNonWhitelisted los rechazaría, provocando reintentos.
  @UseGuards(MercadoPagoSignatureGuard)
  @Post('mercadopago/webhook')
  @HttpCode(200)
  async webhook(
    @Body() body: MpWebhookBody | undefined,
    @Query() query: MpWebhookQuery | undefined,
  ) {
    const type = body?.type ?? query?.type ?? query?.topic;
    const id = String(body?.data?.id ?? query?.['data.id'] ?? query?.id ?? '');
    if (type === 'payment' && /^\d{1,20}$/.test(id)) {
      try {
        await this.paymentsService.processMercadoPagoPayment(id);
      } catch (err) {
        // Un pago que no existe en Mercado Pago (p. ej. "Simular notificación" del panel)
        // no se va a poder procesar nunca: se responde 200 para que MP no reintente.
        // Cualquier otro error sigue devolviendo 500 y MP reintenta la notificación.
        if (
          err instanceof MPNotFoundError ||
          (err as { status?: number })?.status === 404
        ) {
          this.logger.warn(
            `Webhook de Mercado Pago ignorado: el pago ${id} no existe`,
          );
          return { ok: true, ignored: true };
        }
        throw err;
      }
    }
    return { ok: true };
  }
}
