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
exports.ProfessionalsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let ProfessionalsService = class ProfessionalsService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(providerId, createDto) {
        return this.prisma.professionalService.create({
            data: {
                ...createDto,
                providerId,
            },
        });
    }
    async findAll() {
        return this.prisma.professionalService.findMany({
            where: { isActive: true },
            include: {
                provider: {
                    select: { id: true, name: true, email: true, avatarUrl: true },
                },
            },
            orderBy: { createdAt: 'desc' },
        });
    }
    async findOne(id) {
        const service = await this.prisma.professionalService.findUnique({
            where: { id },
            include: {
                provider: {
                    select: { id: true, name: true, avatarUrl: true },
                },
            },
        });
        if (!service)
            throw new common_1.NotFoundException('Servicio no encontrado');
        return service;
    }
    async update(id, currentUserId, updateDto, isAdmin) {
        const service = await this.findOne(id);
        if (!isAdmin && service.providerId !== currentUserId) {
            throw new common_1.ForbiddenException('No tienes permiso para actualizar este servicio');
        }
        return this.prisma.professionalService.update({
            where: { id },
            data: updateDto,
        });
    }
    async remove(id, currentUserId, isAdmin) {
        const service = await this.findOne(id);
        if (!isAdmin && service.providerId !== currentUserId) {
            throw new common_1.ForbiddenException('No tienes permiso para eliminar este servicio');
        }
        return this.prisma.professionalService.update({
            where: { id },
            data: { isActive: false },
        });
    }
    async bookService(userId, serviceId, notes) {
        const service = await this.findOne(serviceId);
        return this.prisma.professionalBooking.create({
            data: {
                userId,
                serviceId,
                notes,
                status: 'CONFIRMED',
            },
            include: {
                service: true,
            },
        });
    }
    async getMyBookings(userId) {
        return this.prisma.professionalBooking.findMany({
            where: { userId },
            include: {
                service: {
                    include: { provider: true }
                }
            },
            orderBy: { bookedAt: 'desc' },
        });
    }
};
exports.ProfessionalsService = ProfessionalsService;
exports.ProfessionalsService = ProfessionalsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ProfessionalsService);
//# sourceMappingURL=professionals.service.js.map