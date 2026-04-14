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
import { CreateGymDto, UpdateGymDto } from './dto/gym.dto';
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
  findAll() {
    return this.gymsService.findAll();
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

  @Get(':id')
  @ApiOperation({ summary: 'Obtener detalles de un gimnasio' })
  findOne(@Param('id') id: string) {
    return this.gymsService.findOne(id);
  }

  @Get(':id/members')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.GYM_OWNER, UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Listar miembros con membresía activa del gimnasio' })
  findMembers(@Param('id') id: string) {
    return this.gymsService.findMembers(id);
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

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.GYM_OWNER, UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Desactivar o eliminar un gimnasio (Dueño/Admin)' })
  remove(@Param('id') id: string, @CurrentUser() user: any) {
    const isAdmin = user.role === UserRole.ADMIN;
    return this.gymsService.remove(id, user.id, isAdmin);
  }
}
