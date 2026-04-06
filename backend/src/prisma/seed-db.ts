import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient({
  datasourceUrl: process.env.DATABASE_URL,
} as any);




async function main() {
  console.log('🌱 Starting seeding process...');
  
  const seedSqlPath = path.join(__dirname, '../../../../database/seed.sql');
  const sql = fs.readFileSync(seedSqlPath, 'utf8');

  // Split by semicolon but be careful with functions/triggers if any (none in this seed)
  // Actually, we can just execute the whole string since it's standard SQL
  // But Prisma's $executeRaw handles one statement at a time best, 
  // or we can try to run it as a transaction of raw queries.
  
  const statements = sql
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--'));

  console.log(`🚀 Executing ${statements.length} SQL statements...`);

  for (const statement of statements) {
    try {
      await prisma.$executeRawUnsafe(statement);
    } catch (error) {
      console.error(`❌ Error executing statement: ${statement.substring(0, 50)}...`);
      console.error(error.message);
    }
  }

  console.log('✅ Seeding complete!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
