import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { TicketsService } from './tickets.service';
import { CreateTicketDto, ReplyTicketDto } from './dto/ticket.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserRole, TicketStatus } from '@prisma/client';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ParseEnumPipe } from '@nestjs/common';


@ApiTags('tickets')
@Controller('tickets')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class TicketsController {
  constructor(private readonly ticketsService: TicketsService) {}

  /** Cualquier usuario autenticado puede crear un ticket */
  @Post()
  @ApiOperation({ summary: 'Crear ticket de soporte / queja' })
  create(@CurrentUser() user: any, @Body() dto: CreateTicketDto) {
    return this.ticketsService.create(user.id, dto);
  }

  /** Solo el Admin ve todos los tickets */
  @Get()
@UseGuards(RolesGuard)
@Roles(UserRole.ADMIN)
@ApiOperation({ summary: 'Admin: listar todos los tickets' })
findAll(
  @Query('status', new ParseEnumPipe(TicketStatus, { optional: true }))
  status?: TicketStatus,
) {
  return this.ticketsService.findAll(status);
}
  
  /** Admin: estadísticas de tickets */
  @Get('stats')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Admin: estadísticas de tickets' })
  getStats() {
    return this.ticketsService.getStats();
  }

  /** Usuario ve sus propios tickets */
  @Get('mine')
  @ApiOperation({ summary: 'Ver mis tickets' })
  findMine(@CurrentUser() user: any) {
    return this.ticketsService.findMine(user.id);
  }

  /** Admin responde un ticket */
  @Patch(':id/reply')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Admin: responder un ticket' })
  reply(@Param('id') id: string, @Body() dto: ReplyTicketDto) {
    return this.ticketsService.reply(id, dto);
  }

  /** Admin cambia estado */
  @Patch(':id/status')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Admin: cambiar estado del ticket' })
  updateStatus(@Param('id') id: string, @Body('status') status: TicketStatus) {
    return this.ticketsService.updateStatus(id, status);
  }

  /** Admin elimina ticket */
  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Admin: eliminar ticket' })
  remove(@Param('id') id: string) {
    return this.ticketsService.remove(id);
  }
}
