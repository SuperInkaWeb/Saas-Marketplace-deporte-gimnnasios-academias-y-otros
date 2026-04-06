import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Query,
} from '@nestjs/common';
import { MembershipsService } from './memberships.service';
import {
  CreateMembershipPlanDto,
  UpdateMembershipPlanDto,
  SubscribeDto,
} from './dto/membership.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
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

@ApiTags('memberships')
@Controller('memberships')
export class MembershipsController {
  constructor(private readonly membershipsService: MembershipsService) {}

  @Post('plans/:gymId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.GYM_OWNER, UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Crear un plan de membresía en un gimnasio (Dueño)' })
  createPlan(
    @Param('gymId') gymId: string,
    @CurrentUser() user: any,
    @Body() dto: CreateMembershipPlanDto,
  ) {
    return this.membershipsService.createPlan(gymId, user.id, dto);
  }

  @Get('plans')
  @ApiOperation({ summary: 'Listar planes de membresía disponibles' })
  @ApiQuery({ name: 'gymId', required: false })
  findAllPlans(@Query('gymId') gymId?: string) {
    return this.membershipsService.findAllPlans(gymId);
  }

  @Post('subscribe')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.USER, UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Suscribirse a un plan de membresía' })
  subscribe(@CurrentUser() user: any, @Body() dto: SubscribeDto) {
    return this.membershipsService.subscribe(user.id, dto);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Obtener mis membresías actuales' })
  getMyMemberships(@CurrentUser() user: any) {
    return this.membershipsService.getUserMemberships(user.id);
  }
}
