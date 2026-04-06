import {
  Injectable,
  ConflictException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import * as bcrypt from 'bcrypt';
import { UserRole } from '@prisma/client';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
  ) {}

  // ── Register ─────────────────────────────────────────────────────────────

  async register(dto: RegisterDto) {
    // Prevent duplicate emails
    const exists = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (exists) {
      throw new ConflictException('El email ya está registrado');
    }

    // Prevent direct ADMIN registration through the public endpoint
    const role: UserRole =
      dto.role === UserRole.ADMIN ? UserRole.USER : (dto.role ?? UserRole.USER);

    const passwordHash = await bcrypt.hash(dto.password, 10);

    const user = await this.prisma.user.create({
      data: {
        name: dto.name,
        email: dto.email,
        passwordHash,
        role,
        phone: dto.phone,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });

    const tokens = await this.generateTokens(user.id, user.email, user.role);

    return { user, ...tokens };
  }

  // ── Login ─────────────────────────────────────────────────────────────────

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (!user) {
      throw new UnauthorizedException('Credenciales incorrectas');
    }

    const passwordValid = await bcrypt.compare(dto.password, user.passwordHash || '');
    if (!passwordValid) {
      throw new UnauthorizedException('Credenciales incorrectas');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Cuenta desactivada');
    }

    const { passwordHash: _pw, ...safeUser } = user;

    const tokens = await this.generateTokens(user.id, user.email, user.role);

    return { user: safeUser, ...tokens };
  }

  // ── Get current user ──────────────────────────────────────────────────────

  async getMe(userId: string) {
    return this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        phone: true,
        avatarUrl: true,
        isActive: true,
        emailVerified: true,
        createdAt: true,
      },
    });
  }

  async getDashboardStats(userId: string, role: string) {
    const userRole = role.toUpperCase();
    if (userRole === 'GYM_OWNER' || userRole === 'ADMIN') {
      const gyms = await this.prisma.gym.findMany({
        where: { ownerId: userId },
        include: {
          classes: {
            include: {
              _count: {
                select: { reservations: { where: { status: 'CONFIRMED' } } },
              },
              reservations: {
                where: { status: 'CONFIRMED' },
              },
            },
          },
        },
      });

      let totalRevenue = 0;
      const uniqueMembers = new Set();
      let activeClassesCount = 0;

      gyms.forEach((gym) => {
        gym.classes.forEach((cls) => {
          activeClassesCount++;
          const confirmedCount = Number(cls._count.reservations);
          totalRevenue += confirmedCount * Number(cls.price);

          cls.reservations.forEach((res) => uniqueMembers.add(res.userId));
        });
      });

      const recentActivities: any[] = [];
      gyms.forEach(gym => {
        gym.classes.forEach(cls => {
          cls.reservations.forEach(res => {
            recentActivities.push({
              id: res.id,
              type: 'RESERVATION',
              title: `Nueva reserva: ${cls.title}`,
              description: `El atleta ha reservado en ${gym.name}`,
              date: res.bookedAt,
            });
          });
        });
      });

      // Sort and take top 5
      const sortedActivities = recentActivities
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 5);

      return {
        gyms: gyms.length,
        classes: activeClassesCount,
        members: uniqueMembers.size,
        revenue: totalRevenue,
        activities: sortedActivities,
      };
    } else {
      // For USER / TRAINEE
      const reservations = await this.prisma.reservation.findMany({
        where: { userId, status: 'CONFIRMED' },
        include: { class: { include: { gym: true } } },
        orderBy: { bookedAt: 'desc' },
        take: 5,
      });

      const activities = reservations.map(res => ({
        id: res.id,
        type: 'RESERVATION',
        title: `Clase reservada: ${res.class.title}`,
        description: `En el gimnasio ${res.class.gym.name}`,
        date: res.bookedAt,
      }));

      const gymsCount = await this.prisma.gym.count({
        where: { status: 'ACTIVE' },
      });

      return {
        reservations: reservations.length,
        gyms: gymsCount,
        points: Math.floor(reservations.length * 125),
        months: 1,
        activities,
      };
    }
  }


  // ── Auth0 — Find or Create ────────────────────────────────────────────────

  /**
   * Called by Auth0JwtStrategy after a valid Auth0 token is received.
   * Looks up user by auth0Id, then by email as fallback.
   * Creates a new user if none is found.
   */
  async findOrCreateAuth0User(params: {
    auth0Id: string;
    email: string;
    name: string;
    avatarUrl?: string;
  }) {
    const { auth0Id, email, name, avatarUrl } = params;

    // 1. Try by auth0Id (fastest path after first login)
    let user = await this.prisma.user.findUnique({
      where: { auth0Id },
      select: { id: true, name: true, email: true, role: true, isActive: true, avatarUrl: true },
    });

    if (user) return user;

    // 2. Try by email (user may have registered before Auth0)
    const existing = await this.prisma.user.findUnique({
      where: { email },
    });

    if (existing) {
      // Link the Auth0 ID to the existing account
      user = await this.prisma.user.update({
        where: { id: existing.id },
        data: { auth0Id, avatarUrl: avatarUrl ?? existing.avatarUrl },
        select: { id: true, name: true, email: true, role: true, isActive: true, avatarUrl: true },
      });
      return user;
    }

    // 3. Create brand-new user
    user = await this.prisma.user.create({
      data: {
        auth0Id,
        email,
        name,
        avatarUrl,
        role: UserRole.USER,
        emailVerified: true,
      },
      select: { id: true, name: true, email: true, role: true, isActive: true, avatarUrl: true },
    });

    return user;
  }

  // ── Token helpers ─────────────────────────────────────────────────────────

  private async generateTokens(userId: string, email: string, role: UserRole) {
    const payload = { sub: userId, email, role };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: this.config.get<string>('JWT_SECRET')!,
        expiresIn: (this.config.get<string>('JWT_EXPIRES_IN') || '15m') as any,
      }),
      this.jwtService.signAsync(payload, {
        secret: this.config.get<string>('JWT_REFRESH_SECRET')!,
        expiresIn: (this.config.get<string>('JWT_REFRESH_EXPIRES_IN') || '7d') as any,
      }),
    ]);

    // Store hashed refresh token
    const tokenHash = await bcrypt.hash(refreshToken, 10);
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await this.prisma.refreshToken.create({
      data: { userId, tokenHash, expiresAt },
    });

    return { accessToken, refreshToken };
  }
}
