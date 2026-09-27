import { PrismaService } from '../prisma/prisma.service';
import { CreateProductDto, CreateOrderDto } from './dto/marketplace.dto';
export declare class MarketplaceService {
    private prisma;
    constructor(prisma: PrismaService);
    createProduct(gymId: string, ownerId: string, dto: CreateProductDto): Promise<{
        name: string;
        description: string | null;
        price: import("@prisma/client/runtime/library").Decimal;
        stock: number;
        category: string | null;
        imageUrl: string | null;
        isActive: boolean;
        gymId: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
    }>;
    findAllProducts(gymId?: string): Promise<({
        gym: {
            name: string;
            id: string;
            ownerId: string;
        };
    } & {
        name: string;
        description: string | null;
        price: import("@prisma/client/runtime/library").Decimal;
        stock: number;
        category: string | null;
        imageUrl: string | null;
        isActive: boolean;
        gymId: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
    })[]>;
    deleteProduct(productId: string, ownerId: string): Promise<{
        name: string;
        description: string | null;
        price: import("@prisma/client/runtime/library").Decimal;
        stock: number;
        category: string | null;
        imageUrl: string | null;
        isActive: boolean;
        gymId: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
    }>;
    updateProduct(id: string, ownerId: string, dto: any): Promise<{
        name: string;
        description: string | null;
        price: import("@prisma/client/runtime/library").Decimal;
        stock: number;
        category: string | null;
        imageUrl: string | null;
        isActive: boolean;
        gymId: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
    }>;
    createOrder(userId: string, dto: CreateOrderDto): Promise<{
        orderItems: ({
            product: {
                name: string;
                description: string | null;
                price: import("@prisma/client/runtime/library").Decimal;
                stock: number;
                category: string | null;
                imageUrl: string | null;
                isActive: boolean;
                gymId: string;
                id: string;
                createdAt: Date;
                updatedAt: Date;
            };
        } & {
            productId: string;
            quantity: number;
            id: string;
            unitPrice: import("@prisma/client/runtime/library").Decimal;
            orderId: string;
        })[];
    } & {
        gymId: string;
        shippingAddress: string | null;
        notes: string | null;
        id: string;
        status: import("@prisma/client").$Enums.OrderStatus;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
        totalAmount: import("@prisma/client/runtime/library").Decimal;
    }>;
    getMyOrders(userId: string): Promise<({
        gym: {
            name: string;
        };
        orderItems: ({
            product: {
                name: string;
                description: string | null;
                price: import("@prisma/client/runtime/library").Decimal;
                stock: number;
                category: string | null;
                imageUrl: string | null;
                isActive: boolean;
                gymId: string;
                id: string;
                createdAt: Date;
                updatedAt: Date;
            };
        } & {
            productId: string;
            quantity: number;
            id: string;
            unitPrice: import("@prisma/client/runtime/library").Decimal;
            orderId: string;
        })[];
    } & {
        gymId: string;
        shippingAddress: string | null;
        notes: string | null;
        id: string;
        status: import("@prisma/client").$Enums.OrderStatus;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
        totalAmount: import("@prisma/client/runtime/library").Decimal;
    })[]>;
}
