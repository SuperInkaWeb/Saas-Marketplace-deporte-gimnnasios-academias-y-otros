import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Patch,
  UseGuards,
  Query,
} from '@nestjs/common';
import { ClassesService } from './classes.service';
import { CreateClassDto, UpdateClassDto } from './dto/class.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AnyAuthGuard } from '../auth/guards/any-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserRole } from '@prisma/client';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';

@ApiTags('classes')
@Controller('classes')
export class ClassesController {
  constructor(private readonly classesService: ClassesService) {}

  @Post(':gymId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.GYM_OWNER, UserRole.TRAINER, UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Crear una nueva clase en un gimnasio' })
  create(
    @Param('gymId') gymId: string,
    @CurrentUser() user: any,
    @Body() createClassDto: CreateClassDto,
  ) {
    return this.classesService.create(gymId, user.id, createClassDto);
  }

  @Get()
  @UseGuards(AnyAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Listar clases. Si myReservations=true, solo las del usuario.' })
  @ApiQuery({ name: 'gymId', required: false })
  @ApiQuery({ name: 'myReservations', required: false })
  findAll(
    @Query('gymId') gymId?: string,
    @Query('myReservations') myReservations?: string,
    @CurrentUser() user?: any,
  ) {
    const userId = myReservations === 'true' && user ? user.id : undefined;
    const ownerId = user?.role === 'GYM_OWNER' ? user.id : undefined;
    const trainerUserId = user?.role === 'TRAINER' ? user.id : undefined;
    return this.classesService.findAll(gymId, userId, ownerId, trainerUserId);
  }


  @Get(':id')
  @ApiOperation({ summary: 'Obtener detalles de una clase' })
  findOne(@Param('id') id: string) {
    return this.classesService.findOne(id);
  }

  @Post(':id/book')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.USER, UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Reservar un cupo en una clase' })
  book(@Param('id') id: string, @CurrentUser() user: any) {
    return this.classesService.book(user.id, id);
  }

  @Delete(':id/book')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.USER, UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Cancelar una reserva' })
  cancelBooking(@Param('id') id: string, @CurrentUser() user: any) {
    return this.classesService.cancelBooking(user.id, id);
  }

  @Patch('reservations/:id/attend')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.GYM_OWNER, UserRole.TRAINER, UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Marcar asistencia mediante escaneo de ticket QR' })
  markAttendance(@Param('id') reservationId: string, @CurrentUser() user: any) {
    return this.classesService.markAttendance(reservationId, user.id);
  }

  @Patch('reservations/:id/unattend')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.GYM_OWNER, UserRole.TRAINER, UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Desmarcar asistencia' })
  unmarkAttendance(@Param('id') reservationId: string, @CurrentUser() user: any) {
    return this.classesService.unmarkAttendance(reservationId, user.id);
  }

  @Delete('reservations/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.GYM_OWNER, UserRole.TRAINER, UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Eliminar una reserva de la lista' })
  removeReservation(@Param('id') reservationId: string, @CurrentUser() user: any) {
    return this.classesService.removeReservation(reservationId, user.id);
  }
  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.GYM_OWNER, UserRole.TRAINER, UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Actualizar una clase' })
  update(@Param('id') id: string, @CurrentUser() user: any, @Body() updateClassDto: UpdateClassDto) {
    return this.classesService.update(id, user.id, updateClassDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.GYM_OWNER, UserRole.TRAINER, UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Eliminar una clase' })
  remove(@Param('id') id: string, @CurrentUser() user: any) {
    return this.classesService.remove(id, user.id);
  }
}
