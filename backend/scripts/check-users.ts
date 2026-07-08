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
  const users = await prisma.user.findMany();
  console.log('=== LISTA DE USUARIOS EN LA BASE DE DATOS ===');
  for (const u of users) {
    console.log(`ID:        ${u.id}`);
    console.log(`Email:     ${u.email}`);
    console.log(`Nombre:    ${u.name}`);
    console.log(`Rol:       ${u.role}`);
    console.log(`Tenant ID: ${u.tenantId}`);
    console.log(`Activo:    ${u.isActive}`);
    console.log('--------------------------------------------');
  }
}

check()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
