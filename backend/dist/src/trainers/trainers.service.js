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
exports.TrainersService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let TrainersService = class TrainersService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async upsertProfile(userId, dto) {
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
    async assignToGym(gymId, currentOwnerId, trainerUserId, canCreateClasses) {
        const gym = await this.prisma.gym.findUnique({
            where: { id: gymId },
        });
        if (!gym)
            throw new common_1.NotFoundException('Gimnasio no encontrado');
        if (gym.ownerId !== currentOwnerId) {
            throw new common_1.ForbiddenException('No eres el dueño de este gimnasio');
        }
        const trainerProfile = await this.prisma.trainerProfile.findUnique({
            where: { userId: trainerUserId },
        });
        if (!trainerProfile) {
            throw new common_1.NotFoundException('El usuario no tiene un perfil de entrenador activo');
        }
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
    async getGymTrainers(gymId) {
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
};
exports.TrainersService = TrainersService;
exports.TrainersService = TrainersService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], TrainersService);
//# sourceMappingURL=trainers.service.js.map