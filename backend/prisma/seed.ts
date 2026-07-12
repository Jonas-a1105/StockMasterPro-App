import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import * as pg from 'pg';
import * as bcrypt from 'bcrypt';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(__dirname, '../.env') });

const url = process.env.DATABASE_URL;
if (!url) {
  throw new Error('DATABASE_URL no definida en el archivo .env');
}

const pool = new pg.Pool({
  connectionString: url,
  ssl: { rejectUnauthorized: false },
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!adminEmail || !adminPassword) {
    console.error(
      'ERROR: Debes definir ADMIN_EMAIL y ADMIN_PASSWORD en el archivo .env',
    );
    process.exit(1);
  }

  const existingAdmin = await prisma.user.findUnique({
    where: { email: adminEmail },
  });
  if (existingAdmin) {
    console.log(`Admin ya existe: ${adminEmail}`);
    return;
  }

  const licenseExpiresAt = new Date();
  licenseExpiresAt.setFullYear(licenseExpiresAt.getFullYear() + 10);

  const tenant = await prisma.tenant.create({
    data: {
      name: process.env.ADMIN_TENANT || 'StockMaster PRO',
      planType: 'enterprise',
      subscriptionStatus: 'active',
      licenseExpiresAt,
      isBlocked: false,
    },
  });

  const passwordHash = await bcrypt.hash(adminPassword, 10);

  await prisma.user.create({
    data: {
      tenantId: tenant.id,
      email: adminEmail,
      passwordHash,
      name: process.env.ADMIN_NAME || 'Administrador',
      role: 'admin',
      isActive: true,
      isPlatformAdmin: true,
    },
  });

  // ===== Sample Data =====
  const categories = await Promise.all([
    prisma.category.create({ data: { tenantId: tenant.id, name: 'Bebidas' } }),
    prisma.category.create({ data: { tenantId: tenant.id, name: 'Lácteos' } }),
    prisma.category.create({ data: { tenantId: tenant.id, name: 'Limpieza' } }),
    prisma.category.create({ data: { tenantId: tenant.id, name: 'Despensa' } }),
  ]);

  const warehouse = await prisma.warehouse.create({
    data: {
      tenantId: tenant.id,
      name: 'Almacén Central',
      code: 'ALC-001',
      address: 'Av. Principal #123',
    },
  });

  const productsData = [
    {
      name: 'Coca Cola 2L',
      barcode: '7501055300110',
      price: 2.5,
      cost: 1.8,
      minStock: 20,
      categoryId: categories[0].id,
    },
    {
      name: 'Leche Entera 1L',
      barcode: '7501085512345',
      price: 1.8,
      cost: 1.2,
      minStock: 15,
      categoryId: categories[1].id,
    },
    {
      name: 'Jabón Líquido 500ml',
      barcode: '7501025698741',
      price: 3.2,
      cost: 2.1,
      minStock: 10,
      categoryId: categories[2].id,
    },
    {
      name: 'Arroz 1kg',
      barcode: '7501096302587',
      price: 1.5,
      cost: 0.9,
      minStock: 30,
      categoryId: categories[3].id,
    },
    {
      name: 'Pan Molde Blanco',
      barcode: '7501047123654',
      price: 2.0,
      cost: 1.3,
      minStock: 12,
      categoryId: categories[3].id,
    },
    {
      name: 'Yogur Natural 1kg',
      barcode: '7501063258741',
      price: 3.5,
      cost: 2.4,
      minStock: 10,
      categoryId: categories[1].id,
    },
    {
      name: 'Detergente 1kg',
      barcode: '7501014785236',
      price: 4.0,
      cost: 2.8,
      minStock: 8,
      categoryId: categories[2].id,
    },
    {
      name: 'Galletas Integrales',
      barcode: '7501036987452',
      price: 1.2,
      cost: 0.7,
      minStock: 20,
      categoryId: categories[3].id,
    },
    {
      name: 'Agua Mineral 1.5L',
      barcode: '7501074123658',
      price: 1.0,
      cost: 0.5,
      minStock: 25,
      categoryId: categories[0].id,
    },
    {
      name: 'Queso Fresco 500g',
      barcode: '7501098741256',
      price: 4.5,
      cost: 3.2,
      minStock: 5,
      categoryId: categories[1].id,
    },
  ];

  for (const p of productsData) {
    const product = await prisma.product.create({
      data: { tenantId: tenant.id, ...p },
    });
    await prisma.productWarehouse.create({
      data: {
        tenantId: tenant.id,
        productId: product.id,
        warehouseId: warehouse.id,
        stock: 100,
        minStock: p.minStock || 10,
      },
    });
  }

  await prisma.customer.create({
    data: {
      tenantId: tenant.id,
      name: 'Carlos López',
      email: 'carlos@example.com',
      phone: '+584141234567',
      creditLimit: 500,
      balance: 120,
    },
  });

  await prisma.customer.create({
    data: {
      tenantId: tenant.id,
      name: 'María García',
      email: 'maria@example.com',
      phone: '+584147654321',
      creditLimit: 300,
      balance: 0,
    },
  });

  console.log('=== ADMIN CREADO EXITOSAMENTE ===');
  console.log(`Email:    ${adminEmail}`);
  console.log(`Password: ${adminPassword}`);
  console.log(`Tenant:   ${tenant.name}`);
  console.log(`Categorías: ${categories.length}`);
  console.log(`Productos:  ${productsData.length}`);
  console.log('================================');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
