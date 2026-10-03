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

@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  // Viejo (PayMe) - borrar al terminar
  @UseGuards(JwtAuthGuard)
  @Post('create-intent')
  async createIntent(@Body() data: { amount: number; description?: string }) {
    return this.paymentsService.createPaymeSignature(data.amount, data.description);
  }

  @UseGuards(JwtAuthGuard)
  @Post('mercadopago/membership-checkout')
  async membershipCheckout(@Body() data: { planId: string }, @Req() req: any) {
    return this.paymentsService.createMembershipCheckout(req.user.id, req.user.email, data.planId);
  }

  @UseGuards(JwtAuthGuard)
  @Post('mercadopago/order-checkout')
  async orderCheckout(
    @Body() data: { items: { productId: string; quantity: number }[] },
    @Req() req: any,
  ) {
    return this.paymentsService.createOrderCheckout(req.user.id, req.user.email, data.items);
  }

  // El usuario vuelve de Mercado Pago y el frontend confirma con el payment_id de la URL
  @UseGuards(JwtAuthGuard)
  @Post('mercadopago/confirm')
  async confirm(@Body() data: { paymentId: string }, @Req() req: any) {
    return this.paymentsService.processMercadoPagoPayment(String(data.paymentId), req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Get('status/:id')
  async status(@Param('id') id: string, @Req() req: any) {
    return this.paymentsService.getStatus(id, req.user.id);
  }

  // PÚBLICO: lo llama Mercado Pago, por eso no lleva guard
  @Post('mercadopago/webhook')
  @HttpCode(200)
  async webhook(@Body() body: any, @Query() query: any) {
    const type = body?.type ?? query?.type ?? query?.topic;
    const id = body?.data?.id ?? query?.['data.id'] ?? query?.id;
    if (type === 'payment' && id) {
      await this.paymentsService.processMercadoPagoPayment(String(id));
    }
    return { ok: true };
  }
}