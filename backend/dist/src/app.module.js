"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const app_controller_1 = require("./app.controller");
const prisma_module_1 = require("./prisma/prisma.module");
const auth_module_1 = require("./auth/auth.module");
const gyms_module_1 = require("./gyms/gyms.module");
const trainers_module_1 = require("./trainers/trainers.module");
const classes_module_1 = require("./classes/classes.module");
const memberships_module_1 = require("./memberships/memberships.module");
const marketplace_module_1 = require("./marketplace/marketplace.module");
const professionals_module_1 = require("./professionals/professionals.module");
const events_module_1 = require("./events/events.module");
const recommendations_module_1 = require("./recommendations/recommendations.module");
const analytics_module_1 = require("./analytics/analytics.module");
const marketing_module_1 = require("./marketing/marketing.module");
const wearables_module_1 = require("./wearables/wearables.module");
const invoices_module_1 = require("./invoices/invoices.module");
const payments_module_1 = require("./payments/payments.module");
const notifications_module_1 = require("./notifications/notifications.module");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({
                isGlobal: true,
                envFilePath: '.env',
            }),
            prisma_module_1.PrismaModule,
            auth_module_1.AuthModule,
            gyms_module_1.GymsModule,
            trainers_module_1.TrainersModule,
            classes_module_1.ClassesModule,
            memberships_module_1.MembershipsModule,
            marketplace_module_1.MarketplaceModule,
            professionals_module_1.ProfessionalsModule,
            events_module_1.EventsModule,
            recommendations_module_1.RecommendationsModule,
            analytics_module_1.AnalyticsModule,
            marketing_module_1.MarketingModule,
            wearables_module_1.WearablesModule,
            invoices_module_1.InvoicesModule,
            payments_module_1.PaymentsModule,
            notifications_module_1.NotificationsModule,
        ],
        controllers: [app_controller_1.AppController],
        providers: [],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map