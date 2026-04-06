import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateTrainerProfileDto } from './dto/trainer.dto';

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
    return this.prisma.trainerProfile.findMany({
      include: {
        user: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
          },
        },
      },
    });
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

  async getGymTrainers(gymId: string) {
    return this.prisma.gymTrainer.findMany({
      where: { gymId },
      include: {
        trainer: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                avatarUrl: true,
              },
            },
          },
        },
      },
    });
  }
}
