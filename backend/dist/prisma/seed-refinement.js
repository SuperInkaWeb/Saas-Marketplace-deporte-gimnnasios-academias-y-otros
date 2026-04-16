"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
async function main() {
    console.log('💎 Iniciando Enriquecimiento de Datos de Nivel Élite...');
    const gyms = await prisma.gym.findMany({
        include: {
            products: true,
        }
    });
    const athletes = await prisma.user.findMany({
        where: { role: client_1.UserRole.USER, email: { contains: '@example.com' } },
        take: 150
    });
    if (athletes.length === 0) {
        console.error('❌ No se encontraron atletas para generar transacciones. Asegúrate de ejecutar el seed masivo primero.');
        return;
    }
    for (const gym of gyms) {
        console.log(`✨ Enriqueciendo: ${gym.name}...`);
        let extraProducts = [];
        if (gym.name.toLowerCase().includes('gym') || gym.name.toLowerCase().includes('fitness')) {
            extraProducts = [
                { name: 'Creatina Monohidratada 500g', price: 35.0, cat: 'SUPPLEMENTS', img: 'https://images.unsplash.com/photo-1593095948071-474c5cc2989d?w=400' },
                { name: 'Shaker Pro SportNexus', price: 12.0, cat: 'GEAR', img: 'https://images.unsplash.com/photo-1593103445831-d8ec717be63c?w=400' },
                { name: 'Cinturón de Levantamiento', price: 45.0, cat: 'GEAR', img: 'https://images.unsplash.com/photo-1620188467120-0962aa1fa3e2?w=400' },
                { name: 'Pre-Workout Energy', price: 29.99, cat: 'SUPPLEMENTS', img: 'https://images.unsplash.com/photo-1579722820308-d74e571900a9?w=400' },
            ];
        }
        else if (gym.name.toLowerCase().includes('soccer') || gym.name.toLowerCase().includes('academy')) {
            extraProducts = [
                { name: 'Balón de Fútbol N5 Oficial', price: 55.0, cat: 'GEAR', img: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=400' },
                { name: 'Kit de Conos de Entrenamiento', price: 25.0, cat: 'GEAR', img: 'https://images.unsplash.com/photo-1544698310-74ea9d1c8258?w=400' },
                { name: 'Medias de Compresión', price: 18.0, cat: 'CLOTHING', img: 'https://images.unsplash.com/photo-1582533089852-02c3cd20119c?w=400' },
                { name: 'Canilleras Ultra-Lite', price: 22.0, cat: 'GEAR', img: 'https://images.unsplash.com/photo-1589131901306-0b127411656f?w=400' },
            ];
        }
        else {
            extraProducts = [
                { name: 'Mochila Técnica Outdoor', price: 85.0, cat: 'GEAR', img: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400' },
                { name: 'Reloj Smart Training', price: 199.0, cat: 'ELECTRONICS', img: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400' },
                { name: 'Camiseta Dry-Fit Qoribex', price: 25.0, cat: 'CLOTHING', img: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400' },
            ];
        }
        for (const ep of extraProducts) {
            await prisma.product.create({
                data: {
                    gymId: gym.id,
                    name: ep.name,
                    price: new client_1.Prisma.Decimal(ep.price),
                    category: ep.cat,
                    description: `Producto de alta calidad para rendimiento máximo en ${gym.name}.`,
                    imageUrl: ep.img,
                    stock: 100,
                }
            });
        }
        const gymAthletes = athletes.sort(() => 0.5 - Math.random()).slice(0, 10);
        const gymProducts = await prisma.product.findMany({ where: { gymId: gym.id } });
        if (gymProducts.length > 0) {
            for (const athlete of gymAthletes) {
                const product = gymProducts[Math.floor(Math.random() * gymProducts.length)];
                const order = await prisma.order.create({
                    data: {
                        userId: athlete.id,
                        gymId: gym.id,
                        status: client_1.OrderStatus.PAID,
                        totalAmount: product.price,
                        orderItems: {
                            create: {
                                productId: product.id,
                                quantity: 1,
                                unitPrice: product.price,
                            }
                        }
                    }
                });
                await prisma.payment.create({
                    data: {
                        userId: athlete.id,
                        amount: product.price,
                        status: client_1.PaymentStatus.COMPLETED,
                        orderId: order.id,
                        description: `Compra de ${product.name} en ${gym.name}`,
                        paidAt: new Date(Date.now() - Math.floor(Math.random() * 30) * 24 * 60 * 60 * 1000),
                    }
                });
            }
        }
    }
    console.log('✅ Enriquecimiento Élite completado con éxito.');
}
main()
    .catch((e) => {
    console.error(e);
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
});
//# sourceMappingURL=seed-refinement.js.map