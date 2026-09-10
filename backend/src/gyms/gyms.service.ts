import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateGymDto, UpdateGymDto } from './dto/gym.dto';
import { GymStatus } from '@prisma/client';

@Injectable()
export class GymsService {
  private readonly logger = new Logger(GymsService.name);
  constructor(private prisma: PrismaService) {}

  private async geocodeAddress(
    address: string,
    city?: string,
    district?: string,
    province?: string,
    seedName?: string,
  ): Promise<{ latitude: number; longitude: number; precise: boolean }> {
    try {
      const queryParts = [address, district, province, city].filter(Boolean);
      const query = queryParts.join(', ');

      const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1`;
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'HercixPlatform/1.0 (contact@hercix.com)',
        },
      });
      const data = await response.json();
      if (Array.isArray(data) && data.length > 0) {
        return {
          latitude: parseFloat(data[0].lat),
          longitude: parseFloat(data[0].lon),
          precise: true,
        };
      }
    } catch (error) {
      console.error('Error during Nominatim geocoding:', error);
    }

    return {
      ...this.getDistrictCoordsFallback(district || city || '', seedName || address),
      precise: false,
    };
  }

  /**
   * Aproximaci\u00f3n de \u00faltima instancia cuando Nominatim no encuentra la direcci\u00f3n exacta.
   * Aplica un offset determinista por negocio (mismo criterio que el mapa del frontend)
   * para que varios negocios del mismo distrito NO queden apilados en el mismo punto.
   */
  private getDistrictCoordsFallback(name: string, seedName?: string): { latitude: number; longitude: number } {
    const normalized = name.toLowerCase()
      .normalize("NFD").replace(/[\u0300-\u036f]/g, "");

    let base = { latitude: -12.085, longitude: -77.03 };
    if (normalized.includes('olivos')) base = { latitude: -11.9614, longitude: -77.0708 };
    else if (normalized.includes('isidro')) base = { latitude: -12.085, longitude: -77.03 };
    else if (normalized.includes('miraflores')) base = { latitude: -12.1225, longitude: -77.0292 };
    else if (normalized.includes('chorrillos')) base = { latitude: -12.1811, longitude: -77.0142 };
    else if (normalized.includes('callao')) base = { latitude: -12.0566, longitude: -77.1181 };
    else if (normalized.includes('surco')) base = { latitude: -12.1383, longitude: -76.9917 };
    else if (normalized.includes('molina')) base = { latitude: -12.0883, longitude: -76.9383 };
    else if (normalized.includes('borja')) base = { latitude: -12.0889, longitude: -77.0017 };
    else if (normalized.includes('miguel')) base = { latitude: -12.0764, longitude: -77.0944 };
    else if (normalized.includes('ate')) base = { latitude: -12.0267, longitude: -76.9167 };
    else if (normalized.includes('barranco')) base = { latitude: -12.1492, longitude: -77.0222 };
    else if (normalized.includes('lince')) base = { latitude: -12.0833, longitude: -77.0333 };
    else if (normalized.includes('maria')) base = { latitude: -12.075, longitude: -77.05 };
    else if (normalized.includes('magdalena')) base = { latitude: -12.0911, longitude: -77.0708 };
    else if (normalized.includes('surquillo')) base = { latitude: -12.1167, longitude: -77.0167 };
    else if (normalized.includes('libre')) base = { latitude: -12.0789, longitude: -77.0628 };
    else if (normalized.includes('brena')) base = { latitude: -12.0583, longitude: -77.0433 };
    else if (normalized.includes('lima')) base = { latitude: -12.0464, longitude: -77.0428 };
    else if (normalized.includes('lurigancho')) base = { latitude: -11.9833, longitude: -77.0167 };
    else if (normalized.includes('comas')) base = { latitude: -11.9333, longitude: -77.05 };
    else if (normalized.includes('carabayllo')) base = { latitude: -11.85, longitude: -77.0333 };
    else if (normalized.includes('independencia')) base = { latitude: -11.9833, longitude: -77.05 };
    else if (normalized.includes('rimac')) base = { latitude: -12.0292, longitude: -77.0278 };

    if (seedName) {
      const seed = seedName.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
      const latOffset = ((seed % 100) - 50) * 0.0001;
      const lngOffset = (((seed + 7) % 100) - 50) * 0.0001;
      return {
        latitude: base.latitude + latOffset,
        longitude: base.longitude + lngOffset,
      };
    }

    return base;
  }

  async create(ownerId: string, createGymDto: CreateGymDto) {
    let latitude: number | null = null;
    let longitude: number | null = null;
    let locationPrecise = true;

    if (createGymDto.latitude !== undefined && createGymDto.longitude !== undefined) {
      // El dueño fijó el pin manualmente en el mapa: es la fuente más confiable.
      latitude = createGymDto.latitude;
      longitude = createGymDto.longitude;
    } else if (createGymDto.address) {
      const coords = await this.geocodeAddress(
        createGymDto.address,
        createGymDto.city,
        createGymDto.district,
        createGymDto.province,
        createGymDto.name,
      );
      latitude = coords.latitude;
      longitude = coords.longitude;
      locationPrecise = coords.precise;
    }

    const gym = await this.prisma.gym.create({
      data: {
        ...createGymDto,
        ownerId,
        latitude,
        longitude,
      },
    });

    // Campo informativo, no persistido: indica al frontend si debe pedir confirmación manual del pin.
    return { ...gym, locationPrecise };
  }

  async findAll(ownerId?: string, trainerUserId?: string) {
    try {
      const where: any = { status: GymStatus.ACTIVE };
      if (ownerId) where.ownerId = ownerId;
      if (trainerUserId) {
        where.gymTrainers = {
          some: {
            trainer: {
              userId: trainerUserId,
            },
          },
        };
      }

      return await this.prisma.gym.findMany({
        where,
        include: {
          owner: {
            select: {
              id: true,
              name: true,
              email: true,
              avatarUrl: true,
            },
          },
          gymTrainers: {
            select: {
              trainerId: true,
              trainer: {
                select: {
                  userId: true,
                },
              },
            },
          },
        },
      });
    } catch (err: any) {
      this.logger.error(`Error in findAll gyms: ${err.message}`, err.stack);
      throw err;
    }
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

    const updatedData: any = { ...updateGymDto };
    let locationPrecise = true;

    if (updateGymDto.latitude !== undefined && updateGymDto.longitude !== undefined) {
      // El dueño fijó/ajustó el pin manualmente: es la fuente más confiable.
      updatedData.latitude = updateGymDto.latitude;
      updatedData.longitude = updateGymDto.longitude;
    } else {
      const hasAddressChanged =
        (updateGymDto.address && updateGymDto.address !== gym.address) ||
        (updateGymDto.district && updateGymDto.district !== gym.district) ||
        (updateGymDto.city && updateGymDto.city !== gym.city);

      if (hasAddressChanged) {
        const coords = await this.geocodeAddress(
          updateGymDto.address || gym.address || '',
          updateGymDto.city || gym.city || undefined,
          updateGymDto.district || gym.district || undefined,
          updateGymDto.province || gym.province || undefined,
          updateGymDto.name || gym.name,
        );
        updatedData.latitude = coords.latitude;
        updatedData.longitude = coords.longitude;
        locationPrecise = coords.precise;
      }
    }

    const updated = await this.prisma.gym.update({
      where: { id },
      data: updatedData,
    });

    return { ...updated, locationPrecise };
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
        OR: [
          {
            userMemberships: {
              some: {
                plan: { gymId },
                status: 'ACTIVE'
              }
            }
          },
          {
            reservations: {
              some: {
                class: { gymId },
                status: { in: ['CONFIRMED', 'ATTENDED'] }
              }
            }
          }
        ]
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
