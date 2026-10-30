import { Controller, Get, Post, Body, Delete, Param, UseGuards, Request, Patch } from '@nestjs/common';
import { HealthService } from './health.service';
import { CreateHealthMetricDto } from './dto/create-health-metric.dto';
import { UpdateGoalDto, UpsertMetDto, CreateRecommendationDto } from './dto/health.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('health')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('health')
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  // ── Health Metrics ────────────────────────────────────────────────────────

  @Post('metrics')
  @ApiOperation({ summary: 'Registrar o actualizar una métrica de salud' })
  async create(@Request() req, @Body() dto: CreateHealthMetricDto) {
    return this.healthService.createOrUpdate(req.user.id, dto);
  }

  @Get('metrics')
  @ApiOperation({ summary: 'Obtener todas las métricas del usuario actual' })
  async findAll(@Request() req) {
    return this.healthService.findAll(req.user.id);
  }

  @Get('metrics/:userId')
  @ApiOperation({ summary: 'Obtener todas las métricas de un usuario específico' })
  async findUserMetrics(@Request() req, @Param('userId') userId: string) {
    await this.healthService.assertCanViewAthlete(req.user, userId);
    return this.healthService.findAll(userId);
  }

  // ── User Goals ────────────────────────────────────────────────────────────

  @Get('goals')
  @ApiOperation({ summary: 'Obtener las metas de salud del usuario' })
  async findGoal(@Request() req) {
    return this.healthService.findGoal(req.user.id);
  }

  @Get('goals/:userId')
  @ApiOperation({ summary: 'Obtener las metas de salud de un usuario específico' })
  async findUserGoal(@Request() req, @Param('userId') userId: string) {
    await this.healthService.assertCanViewAthlete(req.user, userId);
    return this.healthService.findGoal(userId);
  }

  @Post('goals')
  @ApiOperation({ summary: 'Crear o actualizar metas de salud' })
  async updateGoal(
    @Request() req,
    @Body() dto: UpdateGoalDto,
  ) {
    return this.healthService.createOrUpdateGoal(req.user.id, dto);
  }

  // ── Super Admin: MET configurations ───────────────────────────────────────

  @Get('admin/met')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Obtener lista maestra de valores MET' })
  async getMETs() {
    return this.healthService.findMETs();
  }

  @Post('admin/met')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Crear o actualizar valor MET de actividad' })
  async upsertMET(@Body() dto: UpsertMetDto) {
    return this.healthService.createOrUpdateMET(dto);
  }

  @Delete('admin/met/:id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Eliminar configuración MET de actividad' })
  async deleteMET(@Param('id') id: string) {
    return this.healthService.deleteMET(id);
  }

  // ── Coach Recommendations ─────────────────────────────────────────────────

  @Post('recommendations')
  @ApiOperation({ summary: 'Registrar recomendación/observación de coach para un atleta' })
  async addRecommendation(@Request() req, @Body() dto: CreateRecommendationDto) {
    await this.healthService.assertCanCoachAthlete(req.user, dto.athleteId);
    return this.healthService.createRecommendation(req.user.id, dto.athleteId, dto.observation);
  }

  @Get('recommendations/:athleteId')
  @ApiOperation({ summary: 'Obtener recomendaciones de coach de un atleta' })
  async getRecommendations(@Request() req, @Param('athleteId') athleteId: string) {
    await this.healthService.assertCanViewAthlete(req.user, athleteId);
    return this.healthService.findRecommendations(athleteId);
  }

  // ── Coach & Owner Stats ───────────────────────────────────────────────────

  @Get('coach/athletes')
  @ApiOperation({ summary: 'Obtener listado y rendimiento de atletas del coach' })
  async getCoachAthletes(@Request() req) {
    return this.healthService.getCoachAthletes(req.user.id);
  }

  @Get('owner/stats')
  @ApiOperation({ summary: 'Obtener analíticas del gimnasio para dueños' })
  async getOwnerStats(@Request() req) {
    return this.healthService.getOwnerStats(req.user.id);
  }
}
