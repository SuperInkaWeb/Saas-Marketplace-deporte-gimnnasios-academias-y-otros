import { Controller, Get, Param, UseGuards, Request } from '@nestjs/common';
import { InvoicesService } from './invoices.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { GymsService } from '../gyms/gyms.service';
import { UserRole } from '@prisma/client';

@Controller('invoices')
@UseGuards(JwtAuthGuard, RolesGuard)
export class InvoicesController {
  constructor(
    private readonly invoicesService: InvoicesService,
    private readonly gymsService: GymsService,
  ) {}

  @Get()
  @Roles('ADMIN')
  async getAllInvoices() {
    return this.invoicesService.getAllInvoices();
  }

  @Get('user')
  async getUserInvoices(@Request() req) {
    return this.invoicesService.getUserInvoices(req.user.id);
  }

  @Get('gym/:gymId')
  @Roles('ADMIN', 'GYM_OWNER')
  async getGymInvoices(@Param('gymId') gymId: string, @Request() req) {
    if (req.user.role !== UserRole.ADMIN) {
      await this.gymsService.validateOwnership(gymId, req.user.id);
    }
    return this.invoicesService.getGymInvoices(gymId);
  }

  @Get(':id')
  async getInvoiceDetails(@Param('id') id: string, @Request() req) {
    return this.invoicesService.getInvoiceById(
      id,
      req.user.id,
      req.user.role,
    );
  }
}
