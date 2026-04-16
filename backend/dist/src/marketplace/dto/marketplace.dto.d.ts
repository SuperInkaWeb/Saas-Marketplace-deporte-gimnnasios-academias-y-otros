export declare class CreateProductDto {
    name: string;
    description?: string;
    price: number;
    stock?: number;
    category?: string;
    imageUrl?: string;
}
export declare class UpdateProductDto {
    name?: string;
    description?: string;
    price?: number;
    stock?: number;
    category?: string;
    imageUrl?: string;
    isActive?: boolean;
}
export declare class CreateOrderDto {
    gymId: string;
    shippingAddress?: string;
    notes?: string;
    items: OrderItemDto[];
}
export declare class OrderItemDto {
    productId: string;
    quantity: number;
}
