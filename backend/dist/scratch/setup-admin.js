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
const prisma = new client_1.PrismaClient({
    datasources: {
        db: {
            url: "postgresql://neondb_owner:npg_7gzFXtWqS5os@ep-tiny-cell-amwm2qa6-pooler.c-5.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"
        }
    }
});
async function main() {
    const email = 'admin@sportnexus.com';
    const password = 'Admin123!';
    const hashedPassword = await bcrypt.hash(password, 10);
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
        await prisma.user.update({
            where: { email },
            data: { passwordHash: hashedPassword, role: 'ADMIN', isActive: true }
        });
        console.log('✅ Usuario ADMIN actualizado con éxito.');
    }
    let gym = await prisma.gym.findFirst({ where: { ownerId: existingUser?.id || '' } });
    if (!gym) {
        gym = await prisma.gym.create({
            data: {
                ownerId: existingUser?.id || '',
                name: 'Titan Fitness Black',
                description: 'Elite training facility.',
                address: 'Av. El Dorado #45-10',
                city: 'Bogotá',
                country: 'Colombia'
            }
        });
    }
    const invoicesData = [
        { num: 'INV-2026-001', amount: 142800, date: new Date('2026-04-01') },
        { num: 'INV-2026-002', amount: 142800, date: new Date('2026-03-01') },
        { num: 'INV-2026-003', amount: 95000, date: new Date('2026-02-15') },
    ];
    for (const data of invoicesData) {
        const payment = await prisma.payment.create({
            data: {
                userId: existingUser.id,
                amount: data.amount,
                status: 'COMPLETED',
                description: `Pago de membresía ${data.num}`,
                paidAt: data.date,
            }
        });
        await prisma.invoice.upsert({
            where: { invoiceNum: data.num },
            update: {},
            create: {
                paymentId: payment.id,
                userId: existingUser.id,
                gymId: gym.id,
                invoiceNum: data.num,
                amount: data.amount * 0.81,
                tax: data.amount * 0.19,
                total: data.amount,
                status: 'PAID',
                issuedAt: data.date,
            }
        });
    }
    console.log('✅ Facturas reales inyectadas satisfactoriamente.');
    await prisma.product.upsert({
        where: { id: 'test-product-1' },
        update: {},
        create: {
            id: 'test-product-1',
            gymId: gym.id,
            name: 'Proteína Whey Isolate',
            description: 'Proteína de alta calidad para recuperación muscular.',
            price: 45.00,
            stock: 50,
            category: 'Suplementos',
            isActive: true
        }
    });
    console.log('✅ Producto de prueba añadido.');
}
main()
    .catch(e => console.error(e))
    .finally(() => prisma.$disconnect());
//# sourceMappingURL=setup-admin.js.map