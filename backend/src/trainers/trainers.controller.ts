import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { TrainersService } from './trainers.service';
import { AssignTrainerDto, UpdateTrainerProfileDto } from './dto/trainer.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { OptionalJwtAuthGuard } from '../auth/guards/optional-jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserRole } from '@prisma/client';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiResponse,
} from '@nestjs/swagger';

@ApiTags('trainers')
@Controller('trainers')
export class TrainersController {
  constructor(private readonly trainersService: TrainersService) {}

  @Post('profile')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.TRAINER, UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Crear o actualizar mi perfil de entrenador' })
  upsertProfile(
    @CurrentUser() user: any,
    @Body() updateTrainerProfileDto: UpdateTrainerProfileDto,
  ) {
    return this.trainersService.upsertProfile(user.id, updateTrainerProfileDto);
  }

  @Post(':gymId/assign')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.GYM_OWNER, UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Asignar un entrenador a un gimnasio (Dueño)' })
  assignToGym(
    @Param('gymId') gymId: string,
    @CurrentUser() user: any,
    @Body() assignTrainerDto: AssignTrainerDto,
  ) {
    return this.trainersService.assignToGym(
      gymId,
      user.id,
      assignTrainerDto.trainerId,
      assignTrainerDto.canCreateClasses ?? false,
    );
  }

  @Get()
  @ApiOperation({ summary: 'Listar todos los perfiles de entrenadores' })
  findAll() {
    return this.trainersService.findAll();
  }

  @Get('gym/:gymId')
  @UseGuards(OptionalJwtAuthGuard)
  @ApiOperation({
    summary: 'Listar entrenadores de un gimnasio específico',
    description: 'Público. El email del entrenador solo se incluye para el dueño del gimnasio o un ADMIN.',
  })
  getGymTrainers(@Param('gymId') gymId: string, @CurrentUser() user: any) {
    return this.trainersService.getGymTrainers(gymId, user);
  }

  @Delete(':gymId/trainer/:trainerId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.GYM_OWNER, UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Desvincular un entrenador de un gimnasio' })
  unassignTrainer(
    @Param('gymId') gymId: string,
    @Param('trainerId') trainerId: string,
    @CurrentUser() user: any,
  ) {
    return this.trainersService.unassignTrainer(gymId, user.id, trainerId);
  }

  @Post(':gymId/request')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.TRAINER, UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Solicitar vinculación a un gimnasio (Entrenador)' })
  requestLink(@Param('gymId') gymId: string, @CurrentUser() user: any) {
    return this.trainersService.requestLinkToGym(gymId, user.id);
  }

  @Get('owner/requests')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.GYM_OWNER, UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Obtener postulaciones pendientes para mis gimnasios' })
  getOwnerRequests(@CurrentUser() user: any) {
    return this.trainersService.getPendingRequestsForOwner(user.id);
  }

  @Get('my-requests')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.TRAINER, UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Obtener mis postulaciones enviadas' })
  getMyRequests(@CurrentUser() user: any) {
    return this.trainersService.getPendingRequestsForTrainer(user.id);
  }

  @Post('owner/requests/:requestId/respond')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.GYM_OWNER, UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Responder (Aceptar/Rechazar) a una postulación de entrenador' })
  respondRequest(
    @Param('requestId') requestId: string,
    @Body('approve') approve: boolean,
    @CurrentUser() user: any,
  ) {
    return this.trainersService.respondToRequest(requestId, user.id, approve);
  }
}
