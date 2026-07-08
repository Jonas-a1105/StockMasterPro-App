require('dotenv/config');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  datasourceUrl: process.env.DATABASE_URL,
});

async function test() {
  try {
    await prisma.$connect();
    console.log('CONECTADO a Supabase!');
    const result = await prisma.$queryRaw`SELECT 1 as test`;
    console.log('Query OK:', result);
    await prisma.$disconnect();
  } catch (e) {
    console.error('ERROR:', e.message);
  }
}
test();
