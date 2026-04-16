import { MarketplaceService } from './marketplace.service';
import { CreateProductDto, CreateOrderDto } from './dto/marketplace.dto';
export declare class MarketplaceController {
    private readonly marketplaceService;
    constructor(marketplaceService: MarketplaceService);
    createProduct(gymId: string, user: any, dto: CreateProductDto): Promise<{
        id: string;
        name: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        description: string | null;
        price: import("@prisma/client/runtime/library").Decimal;
        gymId: string;
        stock: number;
        category: string | null;
        imageUrl: string | null;
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
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        description: string | null;
        price: import("@prisma/client/runtime/library").Decimal;
        gymId: string;
        stock: number;
        category: string | null;
        imageUrl: string | null;
    })[]>;
    deleteProduct(id: string, user: any): Promise<{
        id: string;
        name: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        description: string | null;
        price: import("@prisma/client/runtime/library").Decimal;
        gymId: string;
        stock: number;
        category: string | null;
        imageUrl: string | null;
    }>;
    updateProduct(id: string, user: any, dto: any): Promise<{
        id: string;
        name: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        description: string | null;
        price: import("@prisma/client/runtime/library").Decimal;
        gymId: string;
        stock: number;
        category: string | null;
        imageUrl: string | null;
    }>;
    createOrder(user: any, dto: CreateOrderDto): Promise<{
        orderItems: ({
            product: {
                id: string;
                name: string;
                isActive: boolean;
                createdAt: Date;
                updatedAt: Date;
                description: string | null;
                price: import("@prisma/client/runtime/library").Decimal;
                gymId: string;
                stock: number;
                category: string | null;
                imageUrl: string | null;
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
        status: import("@prisma/client").$Enums.OrderStatus;
        gymId: string;
        totalAmount: import("@prisma/client/runtime/library").Decimal;
        shippingAddress: string | null;
        notes: string | null;
        userId: string;
    }>;
    getMyOrders(user: any): Promise<({
        gym: {
            name: string;
        };
        orderItems: ({
            product: {
                id: string;
                name: string;
                isActive: boolean;
                createdAt: Date;
                updatedAt: Date;
                description: string | null;
                price: import("@prisma/client/runtime/library").Decimal;
                gymId: string;
                stock: number;
                category: string | null;
                imageUrl: string | null;
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
        status: import("@prisma/client").$Enums.OrderStatus;
        gymId: string;
        totalAmount: import("@prisma/client/runtime/library").Decimal;
        shippingAddress: string | null;
        notes: string | null;
        userId: string;
    })[]>;
}
