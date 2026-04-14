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

  async findNearby(lat: number, lng: number, radiusKm: number) {
    const gyms = await this.findAll();
    
    // Haversine formula
    const R = 6371; // Radius of the earth in km
    const dLat = (lat2, lat1) => ((lat2 - lat1) * Math.PI) / 180;
    const dLon = (lon2, lon1) => ((lon2 - lon1) * Math.PI) / 180;
    
    return gyms.filter((gym) => {
      if (!gym.latitude || !gym.longitude) return false;
      const dlat = dLat(gym.latitude, lat);
      const dlon = dLon(gym.longitude, lng);
      const a =
        Math.sin(dlat / 2) * Math.sin(dlat / 2) +
        Math.cos((lat * Math.PI) / 180) *
          Math.cos((gym.latitude * Math.PI) / 180) *
          Math.sin(dlon / 2) *
          Math.sin(dlon / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      const distance = R * c; // Distance in km
      
      return distance <= radiusKm;
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

  async remove(id: string, currentUserId: string, isAdmin: boolean) {
    const gym = await this.findOne(id);
    if (gym.ownerId !== currentUserId && !isAdmin) {
      throw new ForbiddenException('No tienes permiso para eliminar este gimnasio');
    }
    return this.prisma.gym.update({
      where: { id },
      data: { status: GymStatus.INACTIVE },
    });
  }

  async findMembers(gymId: string) {
    return this.prisma.user.findMany({
      where: {
        userMemberships: {
          some: {
            plan: { gymId },
            status: 'ACTIVE'
          }
        }
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        avatarUrl: true
      }
    });
  }

  async validateOwnership(gymId: string, ownerId: string) {
    const gym = await this.prisma.gym.findUnique({
      where: { id: gymId },
      select: { ownerId: true }
    });
    
    if (!gym) throw new NotFoundException('Gimnasio no encontrado');
    if (gym.ownerId !== ownerId) {
      throw new ForbiddenException('No tienes permiso sobre este gimnasio');
    }
    return true;
  }
}
