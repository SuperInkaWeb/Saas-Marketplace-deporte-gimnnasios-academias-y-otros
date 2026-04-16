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
exports.ClassesService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const client_1 = require("@prisma/client");
const notifications_service_1 = require("../notifications/notifications.service");
let ClassesService = class ClassesService {
    prisma;
    notificationsService;
    constructor(prisma, notificationsService) {
        this.prisma = prisma;
        this.notificationsService = notificationsService;
    }
    async create(gymId, currentUserId, dto) {
        const gym = await this.prisma.gym.findUnique({
            where: { id: gymId },
            include: { gymTrainers: true },
        });
        if (!gym)
            throw new common_1.NotFoundException('Gimnasio no encontrado');
        const isAdmin = false;
        const isOwner = gym.ownerId === currentUserId;
        const isTrainer = gym.gymTrainers.some((gt) => gt.trainerId === dto.trainerId && gt.canCreateClasses);
        if (!isOwner && !isTrainer) {
            throw new common_1.ForbiddenException('No tienes permiso para crear clases en este gimnasio');
        }
        return this.prisma.class.create({
            data: {
                ...dto,
                gymId,
                scheduledAt: new Date(dto.scheduledAt),
            },
        });
    }
    async findAll(gymId) {
        return this.prisma.class.findMany({
            where: {
                ...(gymId ? { gymId } : {}),
                isActive: true,
            },
            include: {
                gym: { select: { name: true, city: true, ownerId: true } },
                trainer: {
                    include: {
                        user: { select: { name: true, avatarUrl: true } },
                    },
                },
                reservations: {
                    where: { status: { in: [client_1.ReservationStatus.CONFIRMED, client_1.ReservationStatus.ATTENDED] } },
                    select: { id: true, userId: true, status: true, user: { select: { name: true } } }
                },
                _count: {
                    select: { reservations: { where: { status: client_1.ReservationStatus.CONFIRMED } } },
                },
            },
            orderBy: { scheduledAt: 'asc' },
        });
    }
    async findOne(id) {
        const classItem = await this.prisma.class.findUnique({
            where: { id },
            include: {
                gym: true,
                trainer: {
                    include: {
                        user: { select: { name: true, avatarUrl: true } },
                    },
                },
                reservations: {
                    where: { status: client_1.ReservationStatus.CONFIRMED },
                    include: {
                        user: { select: { name: true, avatarUrl: true } },
                    },
                },
            },
        });
        if (!classItem)
            throw new common_1.NotFoundException('Clase no encontrada');
        return classItem;
    }
    async book(userId, classId) {
        const classItem = await this.prisma.class.findUnique({
            where: { id: classId },
            include: {
                _count: {
                    select: {
                        reservations: { where: { status: client_1.ReservationStatus.CONFIRMED } },
                    },
                },
            },
        });
        if (!classItem)
            throw new common_1.NotFoundException('Clase no encontrada');
        if (!classItem.isActive)
            throw new common_1.BadRequestException('Esta clase no está activa');
        if (classItem._count.reservations >= classItem.capacity) {
            throw new common_1.BadRequestException('La clase está llena');
        }
        const existing = await this.prisma.reservation.findUnique({
            where: {
                classId_userId: { classId, userId },
            },
        });
        if (existing && existing.status === client_1.ReservationStatus.CONFIRMED) {
            throw new common_1.BadRequestException('Ya tienes una reserva para esta clase');
        }
        const reservation = await this.prisma.reservation.upsert({
            where: {
                classId_userId: { classId, userId },
            },
            update: { status: client_1.ReservationStatus.CONFIRMED, bookedAt: new Date() },
            create: {
                classId,
                userId,
                status: client_1.ReservationStatus.CONFIRMED,
            },
            include: {
                user: { select: { name: true } },
                class: { include: { gym: true } }
            }
        });
        if (reservation.class.gym?.ownerId) {
            await this.notificationsService.create(reservation.class.gym.ownerId, {
                title: 'Nueva Reserva de Clase',
                description: `${reservation.user.name} ha reservado la clase: ${reservation.class.title}`,
                type: 'RESERVATION'
            });
        }
        return reservation;
    }
    async cancelBooking(userId, classId) {
        const reservation = await this.prisma.reservation.findUnique({
            where: {
                classId_userId: { classId, userId },
            },
        });
        if (!reservation)
            throw new common_1.NotFoundException('Reserva no encontrada');
        return this.prisma.reservation.update({
            where: { id: reservation.id },
            data: {
                status: client_1.ReservationStatus.CANCELLED,
                cancelledAt: new Date(),
            },
        });
    }
    async markAttendance(reservationId, currentUserId) {
        const reservation = await this.prisma.reservation.findUnique({
            where: { id: reservationId },
        });
        if (!reservation)
            throw new common_1.NotFoundException('Ticket / Reserva no encontrada');
        return this.prisma.reservation.update({
            where: { id: reservationId },
            data: { status: client_1.ReservationStatus.ATTENDED },
        });
    }
    async update(id, currentUserId, dto) {
        const classItem = await this.findOne(id);
        if (classItem.gym.ownerId !== currentUserId) {
            throw new common_1.ForbiddenException('No tienes permiso para actualizar esta clase');
        }
        return this.prisma.class.update({
            where: { id },
            data: {
                ...dto,
                ...(dto.scheduledAt && { scheduledAt: new Date(dto.scheduledAt) })
            }
        });
    }
    async remove(id, currentUserId) {
        const classItem = await this.findOne(id);
        if (classItem.gym.ownerId !== currentUserId) {
            throw new common_1.ForbiddenException('No tienes permiso para eliminar esta clase');
        }
        return this.prisma.class.delete({
            where: { id }
        });
    }
};
exports.ClassesService = ClassesService;
exports.ClassesService = ClassesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        notifications_service_1.NotificationsService])
], ClassesService);
//# sourceMappingURL=classes.service.js.map