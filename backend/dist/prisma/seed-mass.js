"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const bcrypt = __importStar(require("bcrypt"));
const prisma = new client_1.PrismaClient();
async function main() {
    console.log('🚀 Iniciando Super-Poblamiento de SportNexus...');
    const passwordHash = await bcrypt.hash('password123', 10);
    const businessTypes = [
        { name: 'Gym Elite', type: 'GYM', category: 'Fitness & Bodybuilding' },
        { name: 'Soccer Academy', type: 'ACADEMY', category: 'Deportes de Equipo' },
        { name: 'Sport Shop', type: 'SHOP', category: 'Artículos Deportivos' },
    ];
    const suffixes = ['Norte', 'Sur', 'Premium', 'Pro', 'Express', 'Central', 'Plaza', 'Beach', 'Elite', 'Master'];
    for (let i = 1; i <= 15; i++) {
        const bType = businessTypes[i % 3];
        const bName = `${bType.name} ${suffixes[i % suffixes.length]} ${i}`;
        const owner = await prisma.user.create({
            data: {
                email: `dueno${i}@sportnexus.com`,
                passwordHash,
                name: `Dueno ${bName}`,
                role: client_1.UserRole.GYM_OWNER,
            },
        });
        const gym = await prisma.gym.create({
            data: {
                name: bName,
                ownerId: owner.id,
                address: `Calle Deportiva ${i}, Ciudad Central`,
                description: `El mejor centro de ${bType.category} de la zona. 100% equipado.`,
                phone: `+51 900 100 20${i}`,
                status: 'ACTIVE',
            },
        });
        await prisma.membershipPlan.create({
            data: {
                gymId: gym.id,
                name: 'Plan Demo Black',
                description: 'Acceso total a las instalaciones y clases.',
                price: 99.99,
                durationDays: 30,
            },
        });
        if (bType.type === 'SHOP' || bType.type === 'GYM') {
            await prisma.product.createMany({
                data: [
                    {
                        gymId: gym.id,
                        name: `${bType.type === 'SHOP' ? 'Pack Ropa' : 'Proteína'} Pro ${i}`,
                        description: 'Calidad superior para rendimiento máximo.',
                        price: 45.00,
                        stock: 50,
                        category: bType.type === 'SHOP' ? 'CLOTHING' : 'SUPPLEMENTS',
                    },
                    {
                        gymId: gym.id,
                        name: `Accesorio ${i}`,
                        description: 'Ideal para entrenar.',
                        price: 15.00,
                        stock: 100,
                        category: 'GEAR',
                    }
                ],
            });
        }
        if (bType.type === 'ACADEMY' || bType.type === 'GYM') {
            await prisma.class.create({
                data: {
                    gymId: gym.id,
                    title: `Sesión de ${bType.category} ${i}`,
                    description: 'Entrenamiento dirigido por especialistas.',
                    capacity: 20,
                    scheduledAt: new Date(),
                    durationMin: 60,
                    classType: client_1.ClassType.IN_PERSON,
                },
            });
        }
        for (let j = 1; j <= 10; j++) {
            await prisma.user.create({
                data: {
                    email: `atleta${i}_${j}@example.com`,
                    passwordHash,
                    name: `Atleta ${j} de ${bName}`,
                    role: client_1.UserRole.USER,
                },
            });
        }
        console.log(`✅ Negocio ${i}/15 creado: ${bName}`);
    }
    console.log('✨ Super-Poblamiento completado con éxito.');
}
main()
    .catch((e) => {
    console.error(e);
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
});
//# sourceMappingURL=seed-mass.js.map