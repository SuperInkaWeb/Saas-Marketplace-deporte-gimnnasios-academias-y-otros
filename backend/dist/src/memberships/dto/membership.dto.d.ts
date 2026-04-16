export declare class CreateMembershipPlanDto {
    name: string;
    description?: string;
    price: number;
    durationDays: number;
    maxClasses?: number;
    includesMarketplace?: boolean;
}
export declare class UpdateMembershipPlanDto {
    name?: string;
    description?: string;
    price?: number;
    durationDays?: number;
    maxClasses?: number;
    includesMarketplace?: boolean;
    isActive?: boolean;
}
export declare class SubscribeDto {
    planId: string;
}
