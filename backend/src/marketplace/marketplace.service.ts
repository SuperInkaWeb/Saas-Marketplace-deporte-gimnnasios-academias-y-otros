import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateProductDto,
  CreateOrderDto,
  UpdateProductDto,
} from './dto/marketplace.dto';
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

    // AUD-16: si el producto ya figura en pedidos, se desactiva (sale de la tienda)
    // en vez de borrarse, para conservar el historial de esos pedidos.
    const enPedidos = await this.prisma.orderItem.count({
      where: { productId },
    });
    if (enPedidos > 0) {
      return this.prisma.product.update({
        where: { id: productId },
        data: { isActive: false },
      });
    }

    return this.prisma.product.delete({
      where: { id: productId },
    });
  }

  async updateProduct(id: string, ownerId: string, dto: UpdateProductDto) {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: { gym: true },
    });
    if (!product) throw new NotFoundException('Producto no encontrado');
    if (product.gym.ownerId !== ownerId) {
      throw new ForbiddenException('No tienes permisos para editar este producto');
    }

    // AUD-16: solo los campos del DTO (sin gymId); precio y stock ya vienen validados (>= 0).
    const { name, description, price, stock, category, imageUrl, isActive } =
      dto;
    return this.prisma.product.update({
      where: { id },
      data: { name, description, price, stock, category, imageUrl, isActive },
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
        // AUD-16: el pedido queda en el gimnasio dueño de los productos, no en el que diga el body.
        if (product.gymId !== dto.gymId) {
          throw new BadRequestException(
            `"${product.name}" no pertenece a este gimnasio`,
          );
        }
        if (!product.isActive) {
          throw new BadRequestException(
            `Producto no disponible: ${product.name}`,
          );
        }
        if (Number(product.price) > 0) {
          throw new BadRequestException(
            `"${product.name}" requiere pago con Mercado Pago`,
          );
        }

        // AUD-16: descuento atómico; si no alcanza el stock no se toca nada (igual que en pagos).
        const descontado = await tx.product.updateMany({
          where: { id: product.id, stock: { gte: item.quantity } },
          data: { stock: { decrement: item.quantity } },
        });
        if (descontado.count === 0) {
          throw new ConflictException(`Stock insuficiente: ${product.name}`);
        }

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
