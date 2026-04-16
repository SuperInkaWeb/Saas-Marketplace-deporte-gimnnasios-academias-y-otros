declare const AnyAuthGuard_base: import("@nestjs/passport").Type<import("@nestjs/passport").IAuthGuard>;
export declare class AnyAuthGuard extends AnyAuthGuard_base {
    handleRequest(err: any, user: any): any;
}
export {};
