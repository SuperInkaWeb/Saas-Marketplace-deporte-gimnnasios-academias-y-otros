import {
  Controller,
  Get,
  Query,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { GymsService } from './gyms.service';
import { CreateGymDto, UpdateGymDto, UpdateGymStatusDto } from './dto/gym.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserRole } from '@prisma/client';
import { OptionalJwtAuthGuard } from '../auth/guards/optional-jwt-auth.guard';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiResponse,
  ApiQuery,
} from '@nestjs/swagger';

@ApiTags('gyms')
@Controller('gyms')
export class GymsController {
  constructor(private readonly gymsService: GymsService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.GYM_OWNER, UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Crear un nuevo gimnasio (Dueño/Admin)' })
  @ApiResponse({ status: 201, description: 'Gimnasio creado exitosamente' })
  create(@CurrentUser() user: any, @Body() createGymDto: CreateGymDto) {
    return this.gymsService.create(user.id, createGymDto);
  }

  @Get()
  @ApiOperation({ summary: 'Obtener lista de gimnasios activos' })
  @ApiQuery({ name: 'ownerId', required: false })
  @ApiQuery({ name: 'trainerUserId', required: false })
  findAll(
    @Query('ownerId') ownerId?: string,
    @Query('trainerUserId') trainerUserId?: string,
  ) {
    return this.gymsService.findAll(ownerId, trainerUserId);
  }

  @Get('nearby')
  @ApiOperation({ summary: 'Obtener gimnasios cercanos por geolocalización' })
  findNearby(
    @Query('lat') lat: string,
    @Query('lng') lng: string,
    @Query('radius') radius: string = '5',
  ) {
    return this.gymsService.findNearby(Number(lat), Number(lng), Number(radius));
  }

@Get('admin/all')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@ApiBearerAuth()
@ApiOperation({ summary: 'Listar todos los gimnasios sin importar su estado (Solo Admin)' })
findAllAdmin() {
  return this.gymsService.findAllAdmin();
}

@Get('mine')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.GYM_OWNER, UserRole.ADMIN)
@ApiBearerAuth()
@ApiOperation({ summary: 'Listar mis gimnasios sin importar su estado' })
findMine(@CurrentUser() user: any) {
  return this.gymsService.findMine(user.id);
}

@Get(':id')
@UseGuards(OptionalJwtAuthGuard)
@ApiOperation({ summary: 'Obtener detalles de un gimnasio' })
findOne(@Param('id') id: string, @CurrentUser() user: any) {
  return this.gymsService.findOneForViewer(id, user);
}

  @Get(':id/members')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.GYM_OWNER, UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Listar miembros con membresía activa del gimnasio' })
  findMembers(@Param('id') id: string, @CurrentUser() user: any) {
    const isAdmin = user.role === UserRole.ADMIN;
    return this.gymsService.findMembers(id, user.id, isAdmin);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.GYM_OWNER, UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Actualizar un gimnasio (Dueño/Admin)' })
  update(
    @Param('id') id: string,
    @CurrentUser() user: any,
    @Body() updateGymDto: UpdateGymDto,
  ) {
    const isAdmin = user.role === UserRole.ADMIN;
    return this.gymsService.update(id, user.id, updateGymDto, isAdmin);
  }

@Patch(':id/status')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@ApiBearerAuth()
@ApiOperation({ summary: 'Activar o desactivar un gimnasio (Solo Admin)' })
updateStatus(@Param('id') id: string, @Body() dto: UpdateGymStatusDto) {
  return this.gymsService.updateStatus(id, dto.status);
}

  // controller
@Delete(':id')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@ApiBearerAuth()
@ApiOperation({ summary: 'Eliminar definitivamente un gimnasio (Solo Admin)' })
remove(@Param('id') id: string) {
  return this.gymsService.remove(id);
}
}
