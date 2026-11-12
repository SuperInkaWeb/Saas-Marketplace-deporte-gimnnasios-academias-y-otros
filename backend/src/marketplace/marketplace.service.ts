import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProductDto, CreateOrderDto } from './dto/marketplace.dto';
import { OrderStatus } from '@prisma/client';
import { assertGymStatusActive, visibleGymWhere } from '../common/gym-access/gym-status';

@Injectable()
export class MarketplaceService {
  constructor(private prisma: PrismaService) {}

  async createProduct(gymId: string, ownerId: string, dto: CreateProductDto) {
    const gym = await this.prisma.gym.findUnique({ where: { id: gymId } });
    if (!gym) throw new NotFoundException('Gimnasio no encontrado');
    if (gym.ownerId !== ownerId) {
      throw new ForbiddenException('No eres el dueño de este gimnasio');
    }

    return this.prisma.product.create({
      data: {
        ...dto,
        gymId,
      },
    });
  }

  async findAllProducts(gymId?: string, viewer?: { id: string; role?: string } | null) {
    // AUD-17: productos de gimnasios inactivos solo para su dueño y el ADMIN.
    const gymFilter = visibleGymWhere(viewer);
    return this.prisma.product.findMany({
      where: {
        ...(gymId ? { gymId } : {}),
        ...(gymFilter ? { gym: gymFilter } : {}),
        isActive: true,
      },
      include: {
        gym: { select: { id: true, name: true, ownerId: true, status: true } },
      },
    });
  }

  async deleteProduct(productId: string, ownerId: string) {
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
      include: { gym: true },
    });

    if (!product) throw new NotFoundException('Producto no encontrado');
    if (product.gym.ownerId !== ownerId) {
      throw new ForbiddenException('No tienes permisos para eliminar este producto');
    }

    return this.prisma.product.delete({
      where: { id: productId },
    });
  }

  async updateProduct(id: string, ownerId: string, dto: any) {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: { gym: true },
    });
    if (!product) throw new NotFoundException('Producto no encontrado');
    if (product.gym.ownerId !== ownerId) {
      throw new ForbiddenException('No tienes permisos para editar este producto');
    }

    return this.prisma.product.update({
      where: { id },
      data: dto,
    });
  }

  async createOrder(userId: string, dto: CreateOrderDto) {
    return this.prisma.$transaction(async (tx) => {
      let totalAmount = 0;
      const orderItems: any[] = [];


      for (const item of dto.items) {
        const product = await tx.product.findUnique({
          where: { id: item.productId },
          include: { gym: { select: { status: true } } },
        });

        if (!product) throw new NotFoundException(`Producto ${item.productId} no encontrado`);
        assertGymStatusActive(product.gym);
        if (Number(product.price) > 0) {
          throw new BadRequestException(
            `"${product.name}" requiere pago con Mercado Pago`,
          );
        }
        

        // Update stock
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

      // 2. Create order
      return tx.order.create({
        data: {
          userId,
          gymId: dto.gymId,
          status: OrderStatus.PENDING,
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

  async getMyOrders(userId: string) {
    return this.prisma.order.findMany({
      where: { userId },
      include: {
        orderItems: { include: { product: true } },
        gym: { select: { name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}
