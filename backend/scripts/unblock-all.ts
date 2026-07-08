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

async function unblock() {
  const licenseExpiresAt = new Date();
  licenseExpiresAt.setFullYear(licenseExpiresAt.getFullYear() + 10); // Expiración en 10 años

  console.log('Actualizando todos los tenants a estado ACTIVO y plan ENTERPRISE...');
  const result = await prisma.tenant.updateMany({
    data: {
      planType: 'enterprise',
      subscriptionStatus: 'active',
      isBlocked: false,
      licenseExpiresAt,
    },
  });

  console.log(`Se actualizaron y desbloquearon ${result.count} empresas (tenants) con éxito.`);
}

unblock()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
