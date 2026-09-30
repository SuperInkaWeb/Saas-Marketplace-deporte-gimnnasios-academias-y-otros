import { MarketplaceService } from './marketplace.service';
import { CreateProductDto, CreateOrderDto } from './dto/marketplace.dto';
export declare class MarketplaceController {
    private readonly marketplaceService;
    constructor(marketplaceService: MarketplaceService);
    createProduct(gymId: string, user: any, dto: CreateProductDto): Promise<{
        id: string;
        name: string;
        description: string | null;
        price: import("@prisma/client/runtime/library").Decimal;
        stock: number;
        category: string | null;
        imageUrl: string | null;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        gymId: string;
    }>;
    findAllProducts(gymId?: string): Promise<({
        gym: {
            id: string;
            name: string;
            ownerId: string;
        };
    } & {
        id: string;
        name: string;
        description: string | null;
        price: import("@prisma/client/runtime/library").Decimal;
        stock: number;
        category: string | null;
        imageUrl: string | null;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        gymId: string;
    })[]>;
    deleteProduct(id: string, user: any): Promise<{
        id: string;
        name: string;
        description: string | null;
        price: import("@prisma/client/runtime/library").Decimal;
        stock: number;
        category: string | null;
        imageUrl: string | null;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        gymId: string;
    }>;
    updateProduct(id: string, user: any, dto: any): Promise<{
        id: string;
        name: string;
        description: string | null;
        price: import("@prisma/client/runtime/library").Decimal;
        stock: number;
        category: string | null;
        imageUrl: string | null;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        gymId: string;
    }>;
    createOrder(user: any, dto: CreateOrderDto): Promise<{
        orderItems: ({
            product: {
                id: string;
                name: string;
                description: string | null;
                price: import("@prisma/client/runtime/library").Decimal;
                stock: number;
                category: string | null;
                imageUrl: string | null;
                isActive: boolean;
                createdAt: Date;
                updatedAt: Date;
                gymId: string;
            };
        } & {
            id: string;
            quantity: number;
            unitPrice: import("@prisma/client/runtime/library").Decimal;
            productId: string;
            orderId: string;
        })[];
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        gymId: string;
        status: import("@prisma/client").$Enums.OrderStatus;
        userId: string;
        totalAmount: import("@prisma/client/runtime/library").Decimal;
        shippingAddress: string | null;
        notes: string | null;
    }>;
    getMyOrders(user: any): Promise<({
        orderItems: ({
            product: {
                id: string;
                name: string;
                description: string | null;
                price: import("@prisma/client/runtime/library").Decimal;
                stock: number;
                category: string | null;
                imageUrl: string | null;
                isActive: boolean;
                createdAt: Date;
                updatedAt: Date;
                gymId: string;
            };
        } & {
            id: string;
            quantity: number;
            unitPrice: import("@prisma/client/runtime/library").Decimal;
            productId: string;
            orderId: string;
        })[];
        gym: {
            name: string;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        gymId: string;
        status: import("@prisma/client").$Enums.OrderStatus;
        userId: string;
        totalAmount: import("@prisma/client/runtime/library").Decimal;
        shippingAddress: string | null;
        notes: string | null;
    })[]>;
}
