import { MarketplaceService } from './marketplace.service';
import { CreateProductDto, CreateOrderDto } from './dto/marketplace.dto';
export declare class MarketplaceController {
    private readonly marketplaceService;
    constructor(marketplaceService: MarketplaceService);
    createProduct(gymId: string, user: any, dto: CreateProductDto): Promise<{
        id: string;
        createdAt: Date;
        name: string;
        isActive: boolean;
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
        createdAt: Date;
        name: string;
        isActive: boolean;
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
        createdAt: Date;
        name: string;
        isActive: boolean;
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
        createdAt: Date;
        name: string;
        isActive: boolean;
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
                createdAt: Date;
                name: string;
                isActive: boolean;
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
        userId: string;
        createdAt: Date;
        updatedAt: Date;
        status: import("@prisma/client").$Enums.OrderStatus;
        gymId: string;
        notes: string | null;
        totalAmount: import("@prisma/client/runtime/library").Decimal;
        shippingAddress: string | null;
    }>;
    getMyOrders(user: any): Promise<({
        gym: {
            name: string;
        };
        orderItems: ({
            product: {
                id: string;
                createdAt: Date;
                name: string;
                isActive: boolean;
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
        userId: string;
        createdAt: Date;
        updatedAt: Date;
        status: import("@prisma/client").$Enums.OrderStatus;
        gymId: string;
        notes: string | null;
        totalAmount: import("@prisma/client/runtime/library").Decimal;
        shippingAddress: string | null;
    })[]>;
}
