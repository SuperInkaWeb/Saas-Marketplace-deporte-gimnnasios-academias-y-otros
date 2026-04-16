"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const client_1 = require("@prisma/client");
console.log('DB URL:', process.env.DATABASE_URL?.substring(0, 20) + '...');
const prisma = new client_1.PrismaClient();
async function test() {
    try {
        const users = await prisma.user.findMany();
        console.log('Users count:', users.length);
    }
    catch (e) {
        console.error('Test failed:', e.message);
    }
    finally {
        await prisma.$disconnect();
    }
}
test();
//# sourceMappingURL=test-conn.js.map