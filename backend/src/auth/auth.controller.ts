import {
  Controller,
  Post,
  Get,
  Patch,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
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
    @Body() dto: { name: string; phone?: string; dni?: string; role?: any },
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
}


