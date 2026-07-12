import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
import 'dotenv/config';

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error('DATABASE_URL no definida');
  }
  const pool = new pg.Pool({
    connectionString: url,
    ssl: { rejectUnauthorized: false },
  });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  const user = await prisma.user.findUnique({
    where: { email: 'admin@stockmaster.com' },
  });
  console.log('User:', user ? 'EXISTS' : 'NOT FOUND');
  if (user) {
    const valid = await bcrypt.compare('Admin123!', user.passwordHash);
    console.log('Password valid:', valid);
  }
  await prisma.$disconnect();
}

main().catch(console.error);
