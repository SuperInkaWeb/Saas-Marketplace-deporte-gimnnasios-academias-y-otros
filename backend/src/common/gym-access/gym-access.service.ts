import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

export interface AuthUser {
  id: string;
  role: UserRole | string;
}

export type GymAccessScope = 'GLOBAL' | 'OWNER' | 'TRAINER';

/** Único lugar donde se define quién es administrador global de Hercix. */
export const isGlobalAdmin = (user?: { role?: string } | null) =>
  user?.role === UserRole.ADMIN;

interface AccessOptions {
  /**
   * 'none'              → solo ADMIN global y dueño
   * 'linked'            → además, entrenadores vinculados al gimnasio
   * 'canCreateClasses'  → además, entrenadores vinculados con ese permiso
   */
  trainerAccess?: 'none' | 'linked' | 'canCreateClasses';
}

@Injectable()
export class GymAccessService {
  constructor(private readonly prisma: PrismaService) {}

  async assertCanManageGym(user: AuthUser, gymId: string, opts: AccessOptions = {}) {
    const gym = await this.prisma.gym.findUnique({
      where: { id: gymId },
      include: {
        gymTrainers: {
          select: {
            trainerId: true,
            canCreateClasses: true,
            trainer: { select: { userId: true } },
          },
        },
      },
    });
    if (!gym) throw new NotFoundException('Gimnasio no encontrado');

    // ADMIN global → acceso a cualquier gimnasio
    if (isGlobalAdmin(user)) return { gym, scope: 'GLOBAL' as GymAccessScope };

    // Dueño → solo sus gimnasios
    if (gym.ownerId === user.id) return { gym, scope: 'OWNER' as GymAccessScope };

    // Entrenador → según vínculo y permiso en ESTE gimnasio
    const mode = opts.trainerAccess ?? 'none';
    if (mode !== 'none') {
      const link = gym.gymTrainers.find(
        (gt) =>
          gt.trainer.userId === user.id &&
          (mode === 'linked' || gt.canCreateClasses),
      );
      if (link) return { gym, scope: 'TRAINER' as GymAccessScope };
    }

    throw new ForbiddenException('No tienes permiso sobre este gimnasio');
  }
}