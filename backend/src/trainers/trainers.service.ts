import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateTrainerProfileDto } from './dto/trainer.dto';
import { AuthUser, isGlobalAdmin } from '../common/gym-access/gym-access.service';
import { withPublicName } from '../common/utils/normalize-name';
import * as fs from 'fs';
import * as path from 'path';

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

  private readonly filepath = path.join(process.cwd(), 'pending-requests.json');

  private readPendingRequests(): any[] {
    try {
      if (!fs.existsSync(this.filepath)) {
        fs.writeFileSync(this.filepath, JSON.stringify([]));
        return [];
      }
      const data = fs.readFileSync(this.filepath, 'utf-8');
      return JSON.parse(data || '[]');
    } catch (err) {
      console.error('Error reading pending requests file:', err);
      return [];
    }
  }

  private writePendingRequests(requests: any[]) {
    try {
      fs.writeFileSync(this.filepath, JSON.stringify(requests, null, 2), 'utf-8');
    } catch (err) {
      console.error('Error writing pending requests file:', err);
    }
  }

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

  async unassignTrainer(gymId: string, currentOwnerId: string, trainerId: string) {
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
      include: { user: true },
    });
    if (!trainerProfile) {
      throw new NotFoundException('El usuario no tiene un perfil de entrenador activo');
    }

    // 2. Verificar gimnasio
    const gym = await this.prisma.gym.findUnique({
      where: { id: gymId },
    });
    if (!gym) {
      throw new NotFoundException('Gimnasio no encontrado');
    }

    // 3. Verificar si ya existe vinculación real en DB
    const existingLink = await this.prisma.gymTrainer.findUnique({
      where: {
        gymId_trainerId: {
          gymId,
          trainerId: trainerProfile.id,
        },
      },
    });
    if (existingLink) {
      throw new BadRequestException('Ya estás vinculado a esta sede');
    }

    // 4. Verificar si ya existe postulación pendiente en JSON
    const requests = this.readPendingRequests();
    const existingRequest = requests.find(
      (r) => r.gymId === gymId && r.trainerUserId === trainerUserId,
    );
    if (existingRequest) {
      throw new BadRequestException('Ya tienes una postulación pendiente para esta sede');
    }

    // 5. Agregar solicitud
    const newRequest = {
      id: Math.random().toString(36).substring(2, 9) + '-' + Date.now().toString(36),
      gymId,
      gymName: gym.name,
      trainerUserId,
      trainerName: trainerProfile.user.name,
      trainerEmail: trainerProfile.user.email,
      createdAt: new Date().toISOString(),
    };
    requests.push(newRequest);
    this.writePendingRequests(requests);

    return newRequest;
  }

  async getPendingRequestsForOwner(ownerUserId: string) {
    // Buscar los gimnasios propiedad de este dueño
    const ownerGyms = await this.prisma.gym.findMany({
      where: { ownerId: ownerUserId },
      select: { id: true },
    });
    const gymIds = ownerGyms.map((g) => g.id);

    const requests = this.readPendingRequests();
    return requests.filter((r) => gymIds.includes(r.gymId));
  }

  async getPendingRequestsForTrainer(trainerUserId: string) {
    const requests = this.readPendingRequests();
    return requests.filter((r) => r.trainerUserId === trainerUserId);
  }

  async respondToRequest(requestId: string, ownerUserId: string, approve: boolean) {
    const requests = this.readPendingRequests();
    const reqIndex = requests.findIndex((r) => r.id === requestId);
    if (reqIndex === -1) {
      throw new NotFoundException('Solicitud no encontrada');
    }

    const request = requests[reqIndex];

    // Verificar propiedad del gimnasio
    const gym = await this.prisma.gym.findUnique({
      where: { id: request.gymId },
    });
    if (!gym || gym.ownerId !== ownerUserId) {
      throw new ForbiddenException('No tienes permiso para gestionar solicitudes de este gimnasio');
    }

    if (approve) {
      // Si se aprueba, crear vinculación real en base de datos
      await this.assignToGym(request.gymId, ownerUserId, request.trainerUserId, true);
    }

    // Eliminar solicitud de la lista
    requests.splice(reqIndex, 1);
    this.writePendingRequests(requests);

    return { success: true, message: approve ? 'Solicitud aprobada y entrenador vinculado' : 'Solicitud rechazada' };
  }
}
