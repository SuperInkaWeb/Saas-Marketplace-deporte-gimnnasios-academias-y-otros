"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GymsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const client_1 = require("@prisma/client");
let GymsService = class GymsService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(ownerId, createGymDto) {
        return this.prisma.gym.create({
            data: {
                ...createGymDto,
                ownerId,
            },
        });
    }
    async findAll() {
        return this.prisma.gym.findMany({
            where: { status: client_1.GymStatus.ACTIVE },
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
    async findNearby(lat, lng, radiusKm) {
        const gyms = await this.findAll();
        const R = 6371;
        const dLat = (lat2, lat1) => ((lat2 - lat1) * Math.PI) / 180;
        const dLon = (lon2, lon1) => ((lon2 - lon1) * Math.PI) / 180;
        return gyms.filter((gym) => {
            if (!gym.latitude || !gym.longitude)
                return false;
            const dlat = dLat(gym.latitude, lat);
            const dlon = dLon(gym.longitude, lng);
            const a = Math.sin(dlat / 2) * Math.sin(dlat / 2) +
                Math.cos((lat * Math.PI) / 180) *
                    Math.cos((gym.latitude * Math.PI) / 180) *
                    Math.sin(dlon / 2) *
                    Math.sin(dlon / 2);
            const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
            const distance = R * c;
            return distance <= radiusKm;
        });
    }
    async findOne(id) {
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
            throw new common_1.NotFoundException(`Gimnasio con ID ${id} no encontrado`);
        }
        return gym;
    }
    async update(id, currentUserId, updateGymDto, isAdmin) {
        const gym = await this.findOne(id);
        if (!isAdmin && gym.ownerId !== currentUserId) {
            throw new common_1.ForbiddenException('No tienes permiso para actualizar este gimnasio');
        }
        return this.prisma.gym.update({
            where: { id },
            data: updateGymDto,
        });
    }
    async remove(id, currentUserId, isAdmin) {
        const gym = await this.findOne(id);
        if (gym.ownerId !== currentUserId && !isAdmin) {
            throw new common_1.ForbiddenException('No tienes permiso para eliminar este gimnasio');
        }
        return this.prisma.gym.update({
            where: { id },
            data: { status: client_1.GymStatus.INACTIVE },
        });
    }
    async findMembers(gymId) {
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
    async validateOwnership(gymId, ownerId) {
        const gym = await this.prisma.gym.findUnique({
            where: { id: gymId },
            select: { ownerId: true }
        });
        if (!gym)
            throw new common_1.NotFoundException('Gimnasio no encontrado');
        if (gym.ownerId !== ownerId) {
            throw new common_1.ForbiddenException('No tienes permiso sobre este gimnasio');
        }
        return true;
    }
};
exports.GymsService = GymsService;
exports.GymsService = GymsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], GymsService);
//# sourceMappingURL=gyms.service.js.map