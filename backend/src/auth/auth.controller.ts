import {
  Controller,
  Post,
  Get,
  Patch,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { AnyAuthGuard } from './guards/any-auth.guard';
import { CurrentUser } from './decorators/current-user.decorator';
import { Roles } from './decorators/roles.decorator';
import { RolesGuard } from './guards/roles.guard';
import { UserRole } from '@prisma/client';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @ApiOperation({ summary: 'Register a new user' })
  @Post('register')
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @ApiOperation({ summary: 'Login and receive JWT tokens' })
  @Post('login')
  @HttpCode(HttpStatus.OK)
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @ApiOperation({ summary: 'Refresh JWT tokens' })
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  refresh(@Body() dto: { userId: string; refreshToken: string }) {
    if (!dto.userId || !dto.refreshToken) {
      throw new Error('Missing userId or refreshToken');
    }
    return this.authService.refreshTokens(dto.userId, dto.refreshToken);
  }

  @ApiOperation({ summary: 'Get current user profile (JWT or Auth0)' })
  @ApiBearerAuth()
  @Get('me')
  @UseGuards(AnyAuthGuard)
  getMe(@CurrentUser() user: { id: string }) {
    return this.authService.getMe(user.id);
  }

  @ApiOperation({ summary: 'Update current user profile (JWT or Auth0)' })
  @ApiBearerAuth()
  @UseGuards(AnyAuthGuard)
  @Patch('profile')
  updateProfile(
    @CurrentUser() user: { id: string },
    @Body() dto: { name: string; phone?: string; dni?: string },
  ) {
    return this.authService.updateProfile(user.id, dto);
  }

  @ApiOperation({ summary: 'Switch active user profile role' })
  @ApiBearerAuth()
  @UseGuards(AnyAuthGuard)
  @Post('switch-role')
  switchRole(
    @CurrentUser() user: { id: string },
    @Body() dto: { role: UserRole },
  ) {
    return this.authService.switchRole(user.id, dto.role);
  }

  @ApiOperation({ summary: 'Get dashboard statistics' })
  @ApiBearerAuth()
  @Get('stats')
  @UseGuards(AnyAuthGuard)
  getDashboardStats(@CurrentUser() user: any) {
    return this.authService.getDashboardStats(user.id, user.role);
  }

  @ApiOperation({ summary: 'Invite a new gym owner or coach' })
  @ApiBearerAuth()
  @Post('invite')
  @UseGuards(AnyAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.GYM_OWNER)
  invite(
    @CurrentUser() user: { id: string; role: UserRole },
    @Body() dto: { email: string; role: UserRole; gymId?: string },
  ) {
    return this.authService.inviteUser(user, dto.email, dto.role, dto.gymId);
  }

  @ApiOperation({ summary: 'Secret seed for 70 athletes' })
  @Get('seed-70-athletes-secret')
  async seed70AthletesSecret(@Query('key') key: string) {
    if (key !== 'Hercix2026') {
      return { success: false, message: 'Invalid secret key' };
    }
    const { execSync } = require('child_process');
    try {
      const stdout = execSync('node seed-70-athletes-auth0.js', { 
        encoding: 'utf8', 
        timeout: 50000 
      });
      return { success: true, message: 'Sembrado completado', stdout };
    } catch (err: any) {
      return { 
        success: false, 
        message: 'Error al ejecutar el script de sembrado',
        error: err.message,
        stdout: err.stdout?.toString(),
        stderr: err.stderr?.toString()
      };
    }
  }

  @ApiOperation({ summary: 'Secret seed for Mario DB' })
  @Get('seed-mario-db-secret')
  async seedMarioDbSecret(@Query('key') key: string) {
    if (key !== 'Hercix2026') {
      return { success: false, message: 'Invalid secret key' };
    }
    const { exec } = require('child_process');
    // Launch seed in background, do not await it
    exec('node seed-mario.js', (err: any, stdout: string, stderr: string) => {
      if (err) {
        console.error('Seed background error:', err);
      } else {
        console.log('Seed background stdout:', stdout);
      }
    });
    return { 
      success: true, 
      message: 'Sembrado de base de datos iniciado en segundo plano. Monitorea el progreso en /api/auth/seed-status' 
    };
  }

  @ApiOperation({ summary: 'Check status of secret seed' })
  @Get('seed-status')
  async seedStatus() {
    const fs = require('fs');
    try {
      if (fs.existsSync('seed-progress.json')) {
        const data = fs.readFileSync('seed-progress.json', 'utf8');
        return JSON.parse(data);
      }
      return { status: 'No iniciado o en espera', percent: 0 };
    } catch (err: any) {
      return { status: 'Error al leer el estado', error: err.message };
    }
  }

  @ApiOperation({ summary: 'Secret purge for Mario DB' })
  @Get('purge-production-data-secure')
  async purgeProductionDataSecure(@Query('key') key: string) {
    if (key !== 'Hercix2026') {
      return { success: false, message: 'Invalid secret key' };
    }
    const { exec } = require('child_process');
    exec('node cleanup-demo-data.js', (err: any, stdout: string, stderr: string) => {
      if (err) {
        console.error('Purge background error:', err);
      } else {
        console.log('Purge background stdout:', stdout);
      }
    });
    return { 
      success: true, 
      message: 'Limpieza de base de datos iniciada en segundo plano.' 
    };
  }
}


