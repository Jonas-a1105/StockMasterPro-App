import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import * as pg from 'pg';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(__dirname, '../.env') });

const url = process.env.DATABASE_URL;
if (!url) {
  console.error('ERROR: DATABASE_URL no definida');
  process.exit(1);
}

const pool = new pg.Pool({
  connectionString: url,
  ssl: { rejectUnauthorized: false },
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function check() {
  const tenants = await prisma.tenant.findMany();
  console.log('=== LISTA DE TENANTS EN LA BASE DE DATOS ===');
  for (const t of tenants) {
    console.log(`ID:                  ${t.id}`);
    console.log(`Nombre:              ${t.name}`);
    console.log(`Plan:                ${t.planType}`);
    console.log(`Estado Suscripción:  ${t.subscriptionStatus}`);
    console.log(`Expiración Licencia: ${t.licenseExpiresAt}`);
    console.log(`Bloqueado:           ${t.isBlocked}`);
    console.log('--------------------------------------------');
  }
}

check()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
