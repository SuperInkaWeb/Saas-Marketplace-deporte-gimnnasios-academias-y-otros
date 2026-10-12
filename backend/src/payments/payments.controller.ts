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
} from '@nestjs/common';
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

@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @UseGuards(JwtAuthGuard)
  @Post('mercadopago/membership-checkout')
  async membershipCheckout(@Body() dto: MembershipCheckoutDto, @Req() req: any) {
    return this.paymentsService.createMembershipCheckout(req.user.id, req.user.email, dto.planId);
  }

  @UseGuards(JwtAuthGuard)
  @Post('mercadopago/order-checkout')
  async orderCheckout(@Body() dto: OrderCheckoutDto, @Req() req: any) {
    return this.paymentsService.createOrderCheckout(req.user.id, req.user.email, dto.items);
  }

  @UseGuards(JwtAuthGuard)
  @Post('mercadopago/class-checkout')
  async classCheckout(@Body() dto: ClassCheckoutDto, @Req() req: any) {
    return this.paymentsService.createClassCheckout(req.user.id, req.user.email, dto.classId);
  }

  @UseGuards(JwtAuthGuard)
  @Post('mercadopago/service-checkout')
  async serviceCheckout(@Body() dto: ServiceCheckoutDto, @Req() req: any) {
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
  async confirm(@Body() dto: ConfirmPaymentDto, @Req() req: any) {
    return this.paymentsService.processMercadoPagoPayment(dto.paymentId, req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Get('status/:id')
  async status(@Param('id') id: string, @Req() req: any) {
    return this.paymentsService.getStatus(id, req.user.id);
  }

  // PÚBLICO: lo llama Mercado Pago. Se protege con la firma, no con JWT.
  // Sin DTO a propósito: MP puede añadir campos y el ValidationPipe global
  // con forbidNonWhitelisted los rechazaría, provocando reintentos.
  @UseGuards(MercadoPagoSignatureGuard)
  @Post('mercadopago/webhook')
  @HttpCode(200)
  async webhook(@Body() body: any, @Query() query: any) {
    const type = body?.type ?? query?.type ?? query?.topic;
    const id = String(body?.data?.id ?? query?.['data.id'] ?? query?.id ?? '');
    if (type === 'payment' && /^\d{1,20}$/.test(id)) {
      await this.paymentsService.processMercadoPagoPayment(id);
    }
    return { ok: true };
  }
}