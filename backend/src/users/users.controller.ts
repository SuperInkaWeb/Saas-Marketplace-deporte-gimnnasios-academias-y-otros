import { Controller, Get, Post, Body, Param, Delete, Patch, UseGuards, Req } from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserAdminDto, UpdateUserAdminDto } from './dto/user.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AnyAuthGuard } from '../auth/guards/any-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserRole } from '@prisma/client';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('users')
@ApiBearerAuth()
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // ── Admin: List all users ─────────────────────────────────────────────
  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Obtener todos los usuarios (Solo Admin)' })
  findAll() {
    return this.usersService.findAll();
  }

  // ── Admin: Get user personalized profile ──────────────────────────────
  @Get(':id/profile')
  @UseGuards(AnyAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Ver perfil detallado y personalizado de un usuario (Solo Admin)' })
  findOneProfile(@Param('id') id: string) {
    return this.usersService.findOneProfile(id);
  }

  // ── Admin: Create user manually ───────────────────────────────────────
  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Crear un nuevo usuario manualmente (Solo Admin)' })
  create(@Body() createDto: CreateUserAdminDto) {
    return this.usersService.create(createDto);
  }

  // ── Admin: Delete user ────────────────────────────────────────────────
  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Eliminar un usuario del sistema (Solo Admin)' })
  remove(@Param('id') id: string) {
    return this.usersService.remove(id);
  }

  // ── Admin: Update user ────────────────────────────────────────────────
  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Actualizar un usuario del sistema (Solo Admin)' })
 update(@Param('id') id: string, @Body() dto: UpdateUserAdminDto, @CurrentUser() current: any) {
  return this.usersService.update(id, dto, current.id);
  }

  // ── Role Requests: Any logged user ────────────────────────────────────

  @Post('role-requests')
  @UseGuards(AnyAuthGuard)
  @ApiOperation({ summary: 'Solicitar cambio de rol (Entrenador o Dueño)' })
  createRoleRequest(
    @CurrentUser() user: { id: string },
    @Body() dto: { requestedRole: UserRole; reason?: string },
  ) {
    return this.usersService.createRoleRequest(user.id, dto.requestedRole, dto.reason);
  }

  @Get('role-requests/mine')
  @UseGuards(AnyAuthGuard)
  @ApiOperation({ summary: 'Ver mi solicitud de rol activa' })
  getMyRoleRequest(@CurrentUser() user: { id: string }) {
    return this.usersService.getMyRoleRequest(user.id);
  }

  // ── Admin: Manage role requests ───────────────────────────────────────

  @Get('role-requests')
  @UseGuards(AnyAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Ver todas las solicitudes de rol (Solo Admin)' })
  getAllRoleRequests() {
    return this.usersService.getAllRoleRequests();
  }

  @Patch('role-requests/:id/approve')
  @UseGuards(AnyAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Aprobar solicitud de rol (Solo Admin)' })
  approveRoleRequest(
    @Param('id') id: string,
    @Body() dto: { adminNote?: string },
  ) {
    return this.usersService.approveRoleRequest(id, dto.adminNote);
  }

  @Patch('role-requests/:id/reject')
  @UseGuards(AnyAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Rechazar solicitud de rol (Solo Admin)' })
  rejectRoleRequest(
    @Param('id') id: string,
    @Body() dto: { adminNote?: string },
  ) {
    return this.usersService.rejectRoleRequest(id, dto.adminNote);
  }
}
