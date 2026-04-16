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
exports.MarketplaceService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const client_1 = require("@prisma/client");
let MarketplaceService = class MarketplaceService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async createProduct(gymId, ownerId, dto) {
        const gym = await this.prisma.gym.findUnique({ where: { id: gymId } });
        if (!gym)
            throw new common_1.NotFoundException('Gimnasio no encontrado');
        if (gym.ownerId !== ownerId) {
            throw new common_1.ForbiddenException('No eres el dueño de este gimnasio');
        }
        return this.prisma.product.create({
            data: {
                ...dto,
                gymId,
            },
        });
    }
    async findAllProducts(gymId) {
        return this.prisma.product.findMany({
            where: {
                ...(gymId ? { gymId } : {}),
                isActive: true,
            },
            include: {
                gym: { select: { id: true, name: true, ownerId: true } },
            },
        });
    }
    async deleteProduct(productId, ownerId) {
        const product = await this.prisma.product.findUnique({
            where: { id: productId },
            include: { gym: true },
        });
        if (!product)
            throw new common_1.NotFoundException('Producto no encontrado');
        if (product.gym.ownerId !== ownerId) {
            throw new common_1.ForbiddenException('No tienes permisos para eliminar este producto');
        }
        return this.prisma.product.delete({
            where: { id: productId },
        });
    }
    async updateProduct(id, ownerId, dto) {
        const product = await this.prisma.product.findUnique({
            where: { id },
            include: { gym: true },
        });
        if (!product)
            throw new common_1.NotFoundException('Producto no encontrado');
        if (product.gym.ownerId !== ownerId) {
            throw new common_1.ForbiddenException('No tienes permisos para editar este producto');
        }
        return this.prisma.product.update({
            where: { id },
            data: dto,
        });
    }
    async createOrder(userId, dto) {
        return this.prisma.$transaction(async (tx) => {
            let totalAmount = 0;
            const orderItems = [];
            for (const item of dto.items) {
                const product = await tx.product.findUnique({
                    where: { id: item.productId },
                });
                if (!product)
                    throw new common_1.NotFoundException(`Producto ${item.productId} no encontrado`);
                if (product.stock < item.quantity) {
                    throw new common_1.BadRequestException(`Stock insuficiente para ${product.name}`);
                }
                await tx.product.update({
                    where: { id: product.id },
                    data: { stock: { decrement: item.quantity } },
                });
                totalAmount += Number(product.price) * item.quantity;
                orderItems.push({
                    productId: product.id,
                    quantity: item.quantity,
                    unitPrice: product.price,
                });
            }
            return tx.order.create({
                data: {
                    userId,
                    gymId: dto.gymId,
                    status: client_1.OrderStatus.PENDING,
                    totalAmount,
                    shippingAddress: dto.shippingAddress,
                    notes: dto.notes,
                    orderItems: {
                        create: orderItems,
                    },
                },
                include: {
                    orderItems: {
                        include: { product: true },
                    },
                },
            });
        });
    }
    async getMyOrders(userId) {
        return this.prisma.order.findMany({
            where: { userId },
            include: {
                orderItems: { include: { product: true } },
                gym: { select: { name: true } },
            },
            orderBy: { createdAt: 'desc' },
        });
    }
};
exports.MarketplaceService = MarketplaceService;
exports.MarketplaceService = MarketplaceService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], MarketplaceService);
//# sourceMappingURL=marketplace.service.js.map