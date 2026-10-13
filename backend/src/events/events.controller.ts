import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
  Query,
} from '@nestjs/common';
import { EventsService } from './events.service';
import { CreateEventDto, UpdateEventDto } from './dto/event.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';

@ApiTags('Events (Tournaments & Masterclasses)')
@Controller('events')
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.GYM_OWNER, UserRole.TRAINER, UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new event' })
  create(@Request() req, @Body() createDto: CreateEventDto) {
    return this.eventsService.create(req.user.id, createDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get active events that have not started yet (public)' })
  findAll() {
    return this.eventsService.findAll();
  }

  // IMPORTANTE: debe ir ANTES de @Get(':id'), si no 'manage' se interpretaría como un id
  @Get('manage')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.GYM_OWNER, UserRole.TRAINER, UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiQuery({ name: 'includePast', required: false })
  @ApiOperation({ summary: 'Events the user can manage (ADMIN: all; others: own)' })
  findManageable(@Request() req, @Query('includePast') includePast?: string) {
    return this.eventsService.findManageable(req.user, includePast === 'true');
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get an event by id' })
  findOne(@Param('id') id: string) {
    return this.eventsService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.GYM_OWNER, UserRole.TRAINER, UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update an event (ADMIN: any; others: own)' })
  update(@Param('id') id: string, @Request() req, @Body() updateDto: UpdateEventDto) {
    return this.eventsService.update(id, req.user, updateDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.GYM_OWNER, UserRole.TRAINER, UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Soft delete an event (ADMIN: any; others: own)' })
  remove(@Param('id') id: string, @Request() req) {
    return this.eventsService.remove(id, req.user);
  }
}