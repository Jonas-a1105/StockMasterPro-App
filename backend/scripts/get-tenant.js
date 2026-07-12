const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

async function main() {
  const tenants = await p.$queryRawUnsafe(
    'SELECT DISTINCT tenant_id FROM sales LIMIT 1',
  );
  console.log('tenant:', JSON.stringify(tenants));

  const poTenants = await p.$queryRawUnsafe(
    'SELECT DISTINCT po.tenant_id FROM purchase_orders po JOIN purchase_order_items poi ON poi.purchase_order_id = po.id LIMIT 1',
  );
  console.log('po tenant:', JSON.stringify(poTenants));

  await p.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
