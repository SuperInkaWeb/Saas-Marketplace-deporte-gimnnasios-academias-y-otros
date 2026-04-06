import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateGymDto, UpdateGymDto } from './dto/gym.dto';
import { GymStatus } from '@prisma/client';

@Injectable()
export class GymsService {
  constructor(private prisma: PrismaService) {}

  async create(ownerId: string, createGymDto: CreateGymDto) {
    return this.prisma.gym.create({
      data: {
        ...createGymDto,
        ownerId,
      },
    });
  }

  async findAll() {
    return this.prisma.gym.findMany({
      where: { status: GymStatus.ACTIVE },
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true,
          },
        },
      },
    });
  }

  async findOne(id: string) {
    const gym = await this.prisma.gym.findUnique({
      where: { id },
      include: {
        gymTrainers: {
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
        },
        membershipPlans: true,
      },
    });

    if (!gym) {
      throw new NotFoundException(`Gimnasio con ID ${id} no encontrado`);
    }

    return gym;
  }

  async update(
    id: string,
    currentUserId: string,
    updateGymDto: UpdateGymDto,
    isAdmin: boolean,
  ) {
    const gym = await this.findOne(id);

    if (!isAdmin && gym.ownerId !== currentUserId) {
      throw new ForbiddenException(
        'No tienes permiso para actualizar este gimnasio',
      );
    }

    return this.prisma.gym.update({
      where: { id },
      data: updateGymDto,
    });
  }

  async remove(id: string) {
    // Soft delete by changing status
    return this.prisma.gym.update({
      where: { id },
      data: { status: GymStatus.INACTIVE },
    });
  }
}
