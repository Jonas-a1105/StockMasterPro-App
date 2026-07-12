const { Client } = require('pg');

async function main() {
  const client = new Client({
    connectionString:
      'postgresql://postgres.cnsxlktyravvjpnmgtij:Pr0d_S3cur3_K3y_2026@aws-1-us-west-2.pooler.supabase.com:5432/postgres',
    ssl: { rejectUnauthorized: false },
  });

  await client.connect();
  console.log('Connected to database');

  // Get tenant_id from existing sales to backfill sale_items
  const tenantRes = await client.query(
    'SELECT DISTINCT tenant_id FROM sales LIMIT 1',
  );
  const tenantId =
    tenantRes.rows.length > 0 ? tenantRes.rows[0].tenant_id : null;
  console.log('Tenant ID from sales:', tenantId);

  // Get tenant_id from purchase_orders for purchase_order_items
  const poTenantRes = await client.query(
    'SELECT DISTINCT tenant_id FROM purchase_orders LIMIT 1',
  );
  const poTenantId =
    poTenantRes.rows.length > 0 ? poTenantRes.rows[0].tenant_id : null;
  console.log('Tenant ID from purchase_orders:', poTenantId);

  const tid = tenantId || poTenantId;

  if (tid) {
    // Add tenant_id to sale_items if not exists
    const siCheck = await client.query(
      `SELECT column_name FROM information_schema.columns WHERE table_name='sale_items' AND column_name='tenant_id'`,
    );
    if (siCheck.rows.length === 0) {
      console.log('Adding tenant_id to sale_items...');
      await client.query(`ALTER TABLE sale_items ADD COLUMN tenant_id UUID`);
      await client.query(`UPDATE sale_items SET tenant_id = $1`, [tid]);
      await client.query(
        `ALTER TABLE sale_items ALTER COLUMN tenant_id SET NOT NULL`,
      );
      console.log('Done: sale_items.tenant_id');
    } else {
      console.log('sale_items.tenant_id already exists');
    }

    // Add tenant_id to purchase_order_items if not exists
    const poiCheck = await client.query(
      `SELECT column_name FROM information_schema.columns WHERE table_name='purchase_order_items' AND column_name='tenant_id'`,
    );
    if (poiCheck.rows.length === 0) {
      console.log('Adding tenant_id to purchase_order_items...');
      await client.query(
        `ALTER TABLE purchase_order_items ADD COLUMN tenant_id UUID`,
      );
      await client.query(
        `UPDATE purchase_order_items SET tenant_id = (SELECT tenant_id FROM purchase_orders po WHERE po.id = purchase_order_items.purchase_order_id LIMIT 1)`,
      );
      await client.query(
        `ALTER TABLE purchase_order_items ALTER COLUMN tenant_id SET NOT NULL`,
      );
      console.log('Done: purchase_order_items.tenant_id');
    } else {
      console.log('purchase_order_items.tenant_id already exists');
    }
  } else {
    console.log('No tenant found, tables might be empty');
  }

  await client.end();
  console.log('Migration complete!');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
