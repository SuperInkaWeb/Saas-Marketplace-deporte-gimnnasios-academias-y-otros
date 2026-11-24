import {
  Injectable,
  ConflictException,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserAdminDto } from './dto/user.dto';
import { Prisma, UserRole } from '@prisma/client';
import {
  GRANTABLE_ROLES,
  GrantableRole,
  ROLE_REQUEST_APPROVED,
  ROLE_REQUEST_REVOKED,
  computeEligibleRoles,
  isGrantableRole,
  latestRoleDecisions,
} from '../common/roles/role-eligibility';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    const users = await this.prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        phone: true,
        dni: true,
        avatarUrl: true,
        isActive: true,
        lastLoginAt: true,
        createdAt: true,
      },
    });
    return users;
  }

  async findOneProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        phone: true,
        dni: true,
        avatarUrl: true,
        isActive: true,
        emailVerified: true,
        lastLoginAt: true,
        createdAt: true,
        weight: true,
      },
    });
    if (!user) throw new NotFoundException('Usuario no encontrado.');

    // Datos específicos según el rol
    let roleData: any = {};

    if (user.role === 'GYM_OWNER') {
      const gyms = await this.prisma.gym.findMany({
        where: { ownerId: userId },
        select: {
          id: true,
          name: true,
          city: true,
          district: true,
          status: true,
          createdAt: true,
          _count: { select: { classes: true, orders: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: 10,
      });
      const totalGyms = await this.prisma.gym.count({
        where: { ownerId: userId },
      });
      const totalOrders = await this.prisma.order.count({
        where: { gym: { ownerId: userId } },
      });
      roleData = { gyms, stats: { totalGyms, totalOrders } };
    }

    if (user.role === 'TRAINER') {
      const profile = await this.prisma.trainerProfile.findUnique({
        where: { userId },
        select: {
          bio: true,
          specialties: true,
          certifications: true,
          experienceYears: true,
          hourlyRate: true,
          rating: true,
        },
      });
      const services = await this.prisma.professionalService.findMany({
        where: { providerId: userId },
        select: {
          id: true,
          title: true,
          serviceType: true,
          price: true,
          isActive: true,
        },
        take: 10,
      });
      const totalServices = await this.prisma.professionalService.count({
        where: { providerId: userId },
      });
      const bookings = await this.prisma.professionalBooking.count({
        where: { service: { providerId: userId } },
      });
      roleData = { profile, services, stats: { totalServices, bookings } };
    }

    if (user.role === 'USER') {
      const reservations = await this.prisma.reservation.findMany({
        where: { userId },
        select: {
          id: true,
          status: true,
          bookedAt: true,
          class: {
            select: {
              title: true,
              gym: { select: { name: true, district: true } },
            },
          },
        },
        orderBy: { bookedAt: 'desc' },
        take: 5,
      });
      const memberships = await this.prisma.userMembership.findMany({
        where: { userId },
        select: {
          status: true,
          startedAt: true,
          expiresAt: true,
          plan: { select: { name: true, gym: { select: { name: true } } } },
        },
        take: 3,
      });
      const orders = await this.prisma.order.count({ where: { userId } });
      const totalReservations = await this.prisma.reservation.count({
        where: { userId },
      });
      roleData = {
        reservations,
        memberships,
        stats: { orders, totalReservations },
      };
    }

    if (user.role === 'ADMIN') {
      const usersCreated = await this.prisma.user.count();
      const gymsTotal = await this.prisma.gym.count();
      roleData = { stats: { usersCreated, gymsTotal } };
    }

    return { ...user, roleData };
  }

  async create(createDto: CreateUserAdminDto) {
    // ── Límite: máximo 4 administradores en la plataforma ──
    if (createDto.role === UserRole.ADMIN) {
      const adminCount = await this.prisma.user.count({
        where: { role: UserRole.ADMIN },
      });
      if (adminCount >= 4) {
        throw new ConflictException(
          'El límite de administradores (4) ha sido alcanzado. No se pueden crear más cuentas de tipo Administrador.',
        );
      }
    }

    const existingUser = await this.prisma.user.findUnique({
      where: { email: createDto.email },
    });

    if (existingUser) {
      throw new ConflictException(
        'El correo ya está registrado en el sistema.',
      );
    }

    const passwordHash = await bcrypt.hash(createDto.password, 10);

    const newUser = await this.prisma.user.create({
      data: {
        name: createDto.name,
        email: createDto.email,
        passwordHash,
        role: createDto.role,
        phone: createDto.phone,
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });

    return newUser;
  }

  async remove(id: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    if (user.role === 'ADMIN') {
      throw new ConflictException(
        'No se puede eliminar a otro administrador desde este panel.',
      );
    }

    await this.prisma.user.delete({ where: { id } });
    return { success: true, message: 'Usuario eliminado correctamente' };
  }

  async update(
    id: string,
    updateDto: {
      name: string;
      email: string;
      phone?: string;
      dni?: string;
      role: UserRole;
      isActive: boolean;
    },
    currentUserId?: string,
  ) {
    const user = await this.prisma.user.findUnique({ where: { id } });

    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    const isSelf = !!currentUserId && id === currentUserId;

    // AUD-18: un administrador no modifica a otro administrador (ni rol, ni estado,
    // ni correo). Igual que ya ocurría con "eliminar".
    if (user.role === UserRole.ADMIN && !isSelf) {
      throw new ForbiddenException(
        'No puedes modificar a otro administrador. Los cambios de administradores los gestiona el responsable de la plataforma.',
      );
    }

    // AUD-18: tampoco puede quitarse a sí mismo el rol (evita quedarse sin administradores).
    if (isSelf && updateDto.role !== user.role) {
      throw new BadRequestException('No puedes cambiar tu propio rol');
    }

    if (updateDto.isActive === false && isSelf) {
      throw new BadRequestException('No puedes desactivar tu propia cuenta');
    }

    if (updateDto.role === UserRole.ADMIN && user.role !== UserRole.ADMIN) {
      const adminCount = await this.prisma.user.count({
        where: { role: UserRole.ADMIN },
      });
      if (adminCount >= 4) {
        throw new ConflictException(
          'El límite de administradores (4) ha sido alcanzado.',
        );
      }
    }

    if (updateDto.email.toLowerCase() !== user.email.toLowerCase()) {
      const emailExists = await this.prisma.user.findUnique({
        where: { email: updateDto.email.toLowerCase() },
      });
      if (emailExists) {
        throw new ConflictException(
          'El correo ya está registrado por otro usuario.',
        );
      }
    }

    if (updateDto.role === UserRole.TRAINER && user.role !== UserRole.TRAINER) {
      const existingProfile = await this.prisma.trainerProfile.findUnique({
        where: { userId: id },
      });
      if (!existingProfile) {
        await this.prisma.trainerProfile.create({
          data: {
            userId: id,
            bio: 'Perfil de entrenador Hercix',
            experienceYears: 0,
          },
        });
      }
    }

    // AUD-18: cuando el admin cambia el rol, el usuario queda SOLO con el rol
    // elegido. Los demás roles a los que podía cambiar (por solicitudes
    // aprobadas, gimnasios o perfil de entrenador) se revocan de forma explícita;
    // si no, el usuario los recuperaba desde "Vista Activa" (/auth/switch-role).
    const roleChanged = updateDto.role !== user.role;
    let rolesToRevoke: GrantableRole[] = [];
    let regrant = false;
    if (roleChanged && updateDto.role !== UserRole.ADMIN) {
      const eligible = await computeEligibleRoles(this.prisma, user);
      rolesToRevoke = GRANTABLE_ROLES.filter(
        (r) => r !== updateDto.role && eligible.includes(r),
      );
    }
    if (roleChanged && isGrantableRole(updateDto.role)) {
      const latest = await latestRoleDecisions(this.prisma, id);
      regrant = latest[updateDto.role] === ROLE_REQUEST_REVOKED;
    }

    const updatedUser = await this.prisma.$transaction(async (tx) => {
      for (const role of rolesToRevoke) {
        await this.revokeRole(tx, id, role);
      }
      if (regrant) {
        // Deja una decisión APPROVED más reciente que la revocación anterior.
        await tx.roleRequest.create({
          data: {
            userId: id,
            requestedRole: updateDto.role,
            status: ROLE_REQUEST_APPROVED,
            reason: 'Asignado por un administrador',
            adminNote: 'Rol asignado desde la gestión de usuarios',
          },
        });
      }
      return tx.user.update({
        where: { id },
        data: {
          name: updateDto.name,
          email: updateDto.email.toLowerCase(),
          phone: updateDto.phone || null,
          dni: updateDto.dni || null,
          role: updateDto.role,
          isActive: updateDto.isActive,
        },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          phone: true,
          dni: true,
          isActive: true,
          createdAt: true,
        },
      });
    });

    return updatedUser;
  }

  /** AUD-18: deja constancia de que el rol fue revocado (status REVOKED). */
  private async revokeRole(
    tx: Prisma.TransactionClient,
    userId: string,
    role: GrantableRole,
  ) {
    const adminNote = 'Rol revocado por un administrador';
    const { count } = await tx.roleRequest.updateMany({
      where: { userId, requestedRole: role, status: ROLE_REQUEST_APPROVED },
      data: { status: ROLE_REQUEST_REVOKED, adminNote },
    });
    if (count === 0) {
      // El rol venía de tener gimnasios o perfil de entrenador, sin solicitud:
      // se crea el registro de la revocación.
      await tx.roleRequest.create({
        data: {
          userId,
          requestedRole: role,
          status: ROLE_REQUEST_REVOKED,
          reason: 'Revocación de rol',
          adminNote,
        },
      });
    }
  }

  // ── Actualizar última sesión ────────────────────────────────────────────
  async updateLastLogin(userId: string) {
    await this.prisma.user.update({
      where: { id: userId },
      data: { lastLoginAt: new Date() },
    });
  }

  // ── Solicitudes de Rol ─────────────────────────────────────────────────

  async createRoleRequest(
    userId: string,
    requestedRole: UserRole,
    reason?: string,
  ) {
    if (requestedRole === UserRole.ADMIN) {
      throw new BadRequestException(
        'No se puede solicitar el rol de Administrador.',
      );
    }
    if (requestedRole === UserRole.USER) {
      throw new BadRequestException('Ya tienes el rol de Atleta por defecto.');
    }

    // AUD-20: no se solicita un rol que ya se tiene ni se duplican solicitudes pendientes.
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });
    if (!user) throw new NotFoundException('Usuario no encontrado.');
    // AUD-18: si otro admin aprobara la solicitud de un ADMIN, este perdería su rol.
    if (user.role === UserRole.ADMIN) {
      throw new BadRequestException('Los administradores no solicitan roles.');
    }
    if (user.role === requestedRole) {
      throw new BadRequestException('Ya tienes ese rol.');
    }
    const pending = await this.prisma.roleRequest.findFirst({
      where: { userId, status: 'PENDING' },
      select: { id: true },
    });
    if (pending) {
      throw new ConflictException(
        'Ya tienes una solicitud de rol pendiente de revisión.',
      );
    }

    return this.prisma.roleRequest.create({
      data: {
        userId,
        requestedRole,
        reason: reason || 'Solicitado desde el dashboard',
        status: 'PENDING',
      },
    });
  }

  async getAllRoleRequests() {
    return this.prisma.roleRequest.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            avatarUrl: true,
          },
        },
      },
    });
  }

  async approveRoleRequest(requestId: string, adminNote?: string) {
    const request = await this.prisma.roleRequest.findUnique({
      where: { id: requestId },
      include: { user: true },
    });
    if (!request) throw new NotFoundException('Solicitud no encontrada.');
    if (request.status !== 'PENDING')
      throw new BadRequestException('Esta solicitud ya fue procesada.');

    // Si es ADMIN, verificar el límite de 4
    if (request.requestedRole === UserRole.ADMIN) {
      const adminCount = await this.prisma.user.count({
        where: { role: UserRole.ADMIN },
      });
      if (adminCount >= 4) {
        throw new ConflictException(
          'El límite de 4 administradores ha sido alcanzado.',
        );
      }
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: request.userId },
        data: { role: request.requestedRole },
      });
      await tx.roleRequest.update({
        where: { id: requestId },
        data: { status: 'APPROVED', adminNote },
      });

      if (request.requestedRole === UserRole.TRAINER) {
        const existingProfile = await tx.trainerProfile.findUnique({
          where: { userId: request.userId },
        });
        if (!existingProfile) {
          await tx.trainerProfile.create({
            data: {
              userId: request.userId,
              bio: 'Perfil de entrenador Hercix',
              experienceYears: 0,
            },
          });
        }
      }
    });

    return {
      success: true,
      message: `Solicitud aprobada. Rol ${request.requestedRole} asignado.`,
    };
  }

  async rejectRoleRequest(requestId: string, adminNote?: string) {
    const request = await this.prisma.roleRequest.findUnique({
      where: { id: requestId },
    });
    if (!request) throw new NotFoundException('Solicitud no encontrada.');
    if (request.status !== 'PENDING')
      throw new BadRequestException('Esta solicitud ya fue procesada.');

    await this.prisma.roleRequest.update({
      where: { id: requestId },
      data: { status: 'REJECTED', adminNote },
    });

    return { success: true, message: 'Solicitud rechazada.' };
  }

  async getMyRoleRequest(userId: string) {
    return this.prisma.roleRequest.findFirst({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }
}
