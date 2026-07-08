import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import * as pg from 'pg';
import * as bcrypt from 'bcrypt';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Cargar el archivo .env de la carpeta backend
dotenv.config({ path: path.join(__dirname, '../.env') });

const url = process.env.DATABASE_URL;
if (!url) {
  console.error('ERROR: DATABASE_URL no definida en el archivo .env');
  process.exit(1);
}

const pool = new pg.Pool({
  connectionString: url,
  ssl: { rejectUnauthorized: false },
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function reset() {
  const email = 'admin@stockmaster.com';
  const newPassword = 'Admin123!';

  console.log(`Buscando usuario admin: ${email}...`);
  const user = await prisma.user.findUnique({ where: { email } });

  const passwordHash = await bcrypt.hash(newPassword, 10);

  if (!user) {
    console.log('El usuario admin no existe. Creándolo...');
    // Buscar o crear un tenant por defecto para el admin
    let tenant = await prisma.tenant.findFirst();
    if (!tenant) {
      const licenseExpiresAt = new Date();
      licenseExpiresAt.setFullYear(licenseExpiresAt.getFullYear() + 10);
      tenant = await prisma.tenant.create({
        data: {
          name: 'StockMaster PRO',
          planType: 'enterprise',
          subscriptionStatus: 'active',
          licenseExpiresAt,
          isBlocked: false,
        },
      });
    }

    await prisma.user.create({
      data: {
        tenantId: tenant.id,
        email,
        passwordHash,
        name: 'Administrador Principal',
        role: 'admin',
        isActive: true,
      },
    });
    console.log('=== ADMIN CREADO EXITOSAMENTE ===');
  } else {
    console.log('El usuario admin ya existe. Restableciendo contraseña y asegurando rol...');
    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        role: 'admin',
        isActive: true,
      },
    });
    console.log('=== CONTRASEÑA Y ROL DE ADMIN ACTUALIZADOS CON ÉXITO ===');
  }

  console.log(`Email:    ${email}`);
  console.log(`Password: ${newPassword}`);
}

reset()
  .catch(e => {
    console.error('Error al restablecer el admin:', e);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
