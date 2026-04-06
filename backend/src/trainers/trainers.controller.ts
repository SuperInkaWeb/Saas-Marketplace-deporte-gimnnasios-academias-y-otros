import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { TrainersService } from './trainers.service';
import { AssignTrainerDto, UpdateTrainerProfileDto } from './dto/trainer.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
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
  @ApiOperation({ summary: 'Listar entrenadores de un gimnasio específico' })
  getGymTrainers(@Param('gymId') gymId: string) {
    return this.trainersService.getGymTrainers(gymId);
  }
}
