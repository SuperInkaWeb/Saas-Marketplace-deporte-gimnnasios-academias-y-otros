import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request } from '@nestjs/common';
import { ProfessionalsService } from './professionals.service';
import { CreateProfessionalDto, UpdateProfessionalDto } from './dto/professional.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';

@ApiTags('Professionals (Marketplace Services)')
@Controller('professionals')
export class ProfessionalsController {
  constructor(private readonly professionalsService: ProfessionalsService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.TRAINER, UserRole.GYM_OWNER, UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List a new professional service' })
  create(@Request() req, @Body() createDto: CreateProfessionalDto) {
    return this.professionalsService.create(req.user.id, createDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all active professional services' })
  findAll() {
    return this.professionalsService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a professional service by id' })
  findOne(@Param('id') id: string) {
    return this.professionalsService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a professional service' })
  update(@Param('id') id: string, @Request() req, @Body() updateDto: UpdateProfessionalDto) {
    const isAdmin = req.user.role === UserRole.ADMIN;
    return this.professionalsService.update(id, req.user.id, updateDto, isAdmin);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Soft delete a professional service' })
  remove(@Param('id') id: string) {
    return this.professionalsService.remove(id);
  }
}
