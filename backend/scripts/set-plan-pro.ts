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

async function updateToPro() {
  console.log('Cambiando planType de todos los tenants a "pro" para un desbloqueo inmediato...');
  const result = await prisma.tenant.updateMany({
    data: {
      planType: 'pro',
    },
  });

  console.log(`Se actualizaron ${result.count} empresas al plan "pro" con éxito.`);
}

updateToPro()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
