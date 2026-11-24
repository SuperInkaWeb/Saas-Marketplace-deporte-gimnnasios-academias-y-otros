import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { Prisma, UserRole } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateTrainerProfileDto } from './dto/trainer.dto';
import {
  AuthUser,
  isGlobalAdmin,
} from '../common/gym-access/gym-access.service';
import { withPublicName } from '../common/utils/normalize-name';
import { assertGymStatusActive } from '../common/gym-access/gym-status';

/** AUD-26: estados de una postulación entrenador → gimnasio (tabla gym_trainer_requests). */
export const LINK_REQUEST_STATUS = {
  PENDING: 'PENDING',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
} as const;

const LINK_REQUEST_INCLUDE = {
  gym: { select: { id: true, name: true } },
  trainer: {
    select: { userId: true, user: { select: { name: true, email: true } } },
  },
} satisfies Prisma.GymTrainerRequestInclude;

type LinkRequestRow = Prisma.GymTrainerRequestGetPayload<{
  include: typeof LINK_REQUEST_INCLUDE;
}>;

/** Misma forma que devolvía el archivo JSON, para no cambiar el frontend. */
function toLinkRequestView(r: LinkRequestRow) {
  return {
    id: r.id,
    gymId: r.gymId,
    gymName: r.gym.name,
    trainerUserId: r.trainer.userId,
    trainerName: r.trainer.user.name,
    trainerEmail: r.trainer.user.email,
    status: r.status,
    createdAt: r.createdAt.toISOString(),
  };
}

// AUD-27: lo que cualquiera (sin login) puede ver de un entrenador. Sin email.
const TRAINER_USER_PUBLIC_SELECT = {
  id: true,
  name: true,
  avatarUrl: true,
} as const;
// Lo que ve el dueño del gimnasio (o un ADMIN) de su propio staff.
const TRAINER_USER_STAFF_SELECT = {
  ...TRAINER_USER_PUBLIC_SELECT,
  email: true,
} as const;
const TRAINER_LABEL = 'Entrenador';

@Injectable()
export class TrainersService {
  constructor(private prisma: PrismaService) {}

  async upsertProfile(userId: string, dto: UpdateTrainerProfileDto) {
    // First, verify the user or just upsert (assuming they have TRAINER role)
    // The role is checked in the controller guard
    return this.prisma.trainerProfile.upsert({
      where: { userId },
      update: dto,
      create: {
        userId,
        ...dto,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });
  }

  async findAll() {
    const trainers = await this.prisma.trainerProfile.findMany({
      include: {
        user: { select: TRAINER_USER_PUBLIC_SELECT },
      },
    });
    // AUD-27: cuentas antiguas con el email guardado como nombre.
    return trainers.map((t) => ({
      ...t,
      user: withPublicName(t.user, TRAINER_LABEL)!,
    }));
  }

  async assignToGym(
    gymId: string,
    currentOwnerId: string,
    trainerUserId: string,
    canCreateClasses: boolean,
  ) {
    // 1. Verify gym ownership
    const gym = await this.prisma.gym.findUnique({
      where: { id: gymId },
    });

    if (!gym) throw new NotFoundException('Gimnasio no encontrado');
    if (gym.ownerId !== currentOwnerId) {
      throw new ForbiddenException('No eres el dueño de este gimnasio');
    }

    // 2. Find trainer profile
    const trainerProfile = await this.prisma.trainerProfile.findUnique({
      where: { userId: trainerUserId },
    });

    if (!trainerProfile) {
      throw new NotFoundException(
        'El usuario no tiene un perfil de entrenador activo',
      );
    }

    // 3. Create or update assignment
    return this.prisma.gymTrainer.upsert({
      where: {
        gymId_trainerId: {
          gymId,
          trainerId: trainerProfile.id,
        },
      },
      update: { canCreateClasses },
      create: {
        gymId,
        trainerId: trainerProfile.id,
        canCreateClasses,
      },
    });
  }

  /**
   * Entrenadores vinculados a un gimnasio. Es público, pero el email solo se
   * incluye si quien consulta es el dueño de ese gimnasio o un ADMIN (AUD-27).
   */
  async getGymTrainers(gymId: string, viewer?: AuthUser | null) {
    const canSeeContact = await this.canSeeStaffContact(gymId, viewer);
    const links = await this.prisma.gymTrainer.findMany({
      where: { gymId },
      include: {
        trainer: {
          include: {
            user: {
              select: canSeeContact
                ? TRAINER_USER_STAFF_SELECT
                : TRAINER_USER_PUBLIC_SELECT,
            },
          },
        },
      },
    });
    // El dueño/ADMIN ve los datos tal cual; el público, sin nombres que sean emails (AUD-27).
    if (canSeeContact) return links;
    return links.map((link) => ({
      ...link,
      trainer: {
        ...link.trainer,
        user: withPublicName(link.trainer.user, TRAINER_LABEL)!,
      },
    })) as typeof links;
  }

  private async canSeeStaffContact(gymId: string, viewer?: AuthUser | null) {
    if (!viewer) return false;
    if (isGlobalAdmin(viewer)) return true;
    const gym = await this.prisma.gym.findUnique({
      where: { id: gymId },
      select: { ownerId: true },
    });
    return !!gym && gym.ownerId === viewer.id;
  }

  async unassignTrainer(
    gymId: string,
    currentOwnerId: string,
    trainerId: string,
  ) {
    const gym = await this.prisma.gym.findUnique({
      where: { id: gymId },
    });

    if (!gym) throw new NotFoundException('Gimnasio no encontrado');
    if (gym.ownerId !== currentOwnerId) {
      throw new ForbiddenException('No eres el dueño de este gimnasio');
    }

    return this.prisma.gymTrainer.delete({
      where: {
        gymId_trainerId: {
          gymId,
          trainerId,
        },
      },
    });
  }

  async requestLinkToGym(gymId: string, trainerUserId: string) {
    // 1. Verificar perfil de entrenador
    const trainerProfile = await this.prisma.trainerProfile.findUnique({
      where: { userId: trainerUserId },
      select: { id: true },
    });
    if (!trainerProfile) {
      throw new NotFoundException(
        'El usuario no tiene un perfil de entrenador activo',
      );
    }

    // 2. Verificar gimnasio (debe existir y estar activo)
    const gym = await this.prisma.gym.findUnique({
      where: { id: gymId },
      select: { id: true, status: true },
    });
    if (!gym) {
      throw new NotFoundException('Gimnasio no encontrado');
    }
    assertGymStatusActive(gym);

    // 3. Verificar si ya existe vinculación real
    const existingLink = await this.prisma.gymTrainer.findUnique({
      where: { gymId_trainerId: { gymId, trainerId: trainerProfile.id } },
      select: { id: true },
    });
    if (existingLink) {
      throw new BadRequestException('Ya estás vinculado a esta sede');
    }

    // 4. Una fila por gimnasio-entrenador: si ya fue respondida, vuelve a PENDING
    const previous = await this.prisma.gymTrainerRequest.findUnique({
      where: { gymId_trainerId: { gymId, trainerId: trainerProfile.id } },
      select: { id: true, status: true },
    });
    if (previous?.status === LINK_REQUEST_STATUS.PENDING) {
      throw new BadRequestException(
        'Ya tienes una postulación pendiente para esta sede',
      );
    }

    try {
      const saved = previous
        ? await this.prisma.gymTrainerRequest.update({
            where: { id: previous.id },
            data: {
              status: LINK_REQUEST_STATUS.PENDING,
              respondedById: null,
              respondedAt: null,
              createdAt: new Date(),
            },
            include: LINK_REQUEST_INCLUDE,
          })
        : await this.prisma.gymTrainerRequest.create({
            data: { gymId, trainerId: trainerProfile.id },
            include: LINK_REQUEST_INCLUDE,
          });
      return toLinkRequestView(saved);
    } catch (err) {
      // Dos postulaciones simultáneas: la restricción única deja pasar solo una
      if (
        err instanceof Prisma.PrismaClientKnownRequestError &&
        err.code === 'P2002'
      ) {
        throw new BadRequestException(
          'Ya tienes una postulación pendiente para esta sede',
        );
      }
      throw err;
    }
  }

  async getPendingRequestsForOwner(ownerUserId: string) {
    const requests = await this.prisma.gymTrainerRequest.findMany({
      where: {
        status: LINK_REQUEST_STATUS.PENDING,
        gym: { ownerId: ownerUserId },
      },
      include: LINK_REQUEST_INCLUDE,
      orderBy: { createdAt: 'asc' },
    });
    return requests.map(toLinkRequestView);
  }

  async getPendingRequestsForTrainer(trainerUserId: string) {
    const requests = await this.prisma.gymTrainerRequest.findMany({
      where: {
        status: LINK_REQUEST_STATUS.PENDING,
        trainer: { userId: trainerUserId },
      },
      include: LINK_REQUEST_INCLUDE,
      orderBy: { createdAt: 'asc' },
    });
    return requests.map(toLinkRequestView);
  }

  async respondToRequest(
    requestId: string,
    responder: { id: string; role?: string },
    approve: boolean,
  ) {
    const request = await this.prisma.gymTrainerRequest.findUnique({
      where: { id: requestId },
      include: { gym: { select: { ownerId: true } } },
    });
    if (!request || request.status !== LINK_REQUEST_STATUS.PENDING) {
      throw new NotFoundException('Solicitud no encontrada');
    }

    // Verificar propiedad del gimnasio (el ADMIN puede gestionar cualquiera)
    if (
      responder.role !== UserRole.ADMIN &&
      request.gym.ownerId !== responder.id
    ) {
      throw new ForbiddenException(
        'No tienes permiso para gestionar solicitudes de este gimnasio',
      );
    }

    const status = approve
      ? LINK_REQUEST_STATUS.APPROVED
      : LINK_REQUEST_STATUS.REJECTED;
    await this.prisma.$transaction(async (tx) => {
      // Solo se responde si sigue PENDING (evita doble respuesta simultánea)
      const updated = await tx.gymTrainerRequest.updateMany({
        where: { id: request.id, status: LINK_REQUEST_STATUS.PENDING },
        data: { status, respondedById: responder.id, respondedAt: new Date() },
      });
      if (updated.count === 0) {
        throw new NotFoundException('Solicitud no encontrada');
      }
      if (approve) {
        // Si se aprueba, crear la vinculación real
        await tx.gymTrainer.upsert({
          where: {
            gymId_trainerId: {
              gymId: request.gymId,
              trainerId: request.trainerId,
            },
          },
          update: { canCreateClasses: true },
          create: {
            gymId: request.gymId,
            trainerId: request.trainerId,
            canCreateClasses: true,
          },
        });
      }
    });

    return {
      success: true,
      message: approve
        ? 'Solicitud aprobada y entrenador vinculado'
        : 'Solicitud rechazada',
    };
  }
}
