"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TrainersController = void 0;
const common_1 = require("@nestjs/common");
const trainers_service_1 = require("./trainers.service");
const trainer_dto_1 = require("./dto/trainer.dto");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const roles_guard_1 = require("../auth/guards/roles.guard");
const roles_decorator_1 = require("../auth/decorators/roles.decorator");
const current_user_decorator_1 = require("../auth/decorators/current-user.decorator");
const client_1 = require("@prisma/client");
const swagger_1 = require("@nestjs/swagger");
let TrainersController = class TrainersController {
    trainersService;
    constructor(trainersService) {
        this.trainersService = trainersService;
    }
    upsertProfile(user, updateTrainerProfileDto) {
        return this.trainersService.upsertProfile(user.id, updateTrainerProfileDto);
    }
    assignToGym(gymId, user, assignTrainerDto) {
        return this.trainersService.assignToGym(gymId, user.id, assignTrainerDto.trainerId, assignTrainerDto.canCreateClasses ?? false);
    }
    findAll() {
        return this.trainersService.findAll();
    }
    getGymTrainers(gymId) {
        return this.trainersService.getGymTrainers(gymId);
    }
};
exports.TrainersController = TrainersController;
__decorate([
    (0, common_1.Post)('profile'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(client_1.UserRole.TRAINER, client_1.UserRole.ADMIN),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Crear o actualizar mi perfil de entrenador' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, trainer_dto_1.UpdateTrainerProfileDto]),
    __metadata("design:returntype", void 0)
], TrainersController.prototype, "upsertProfile", null);
__decorate([
    (0, common_1.Post)(':gymId/assign'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(client_1.UserRole.GYM_OWNER, client_1.UserRole.ADMIN),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Asignar un entrenador a un gimnasio (Dueño)' }),
    __param(0, (0, common_1.Param)('gymId')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, trainer_dto_1.AssignTrainerDto]),
    __metadata("design:returntype", void 0)
], TrainersController.prototype, "assignToGym", null);
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'Listar todos los perfiles de entrenadores' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], TrainersController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)('gym/:gymId'),
    (0, swagger_1.ApiOperation)({ summary: 'Listar entrenadores de un gimnasio específico' }),
    __param(0, (0, common_1.Param)('gymId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], TrainersController.prototype, "getGymTrainers", null);
exports.TrainersController = TrainersController = __decorate([
    (0, swagger_1.ApiTags)('trainers'),
    (0, common_1.Controller)('trainers'),
    __metadata("design:paramtypes", [trainers_service_1.TrainersService])
], TrainersController);
//# sourceMappingURL=trainers.controller.js.map