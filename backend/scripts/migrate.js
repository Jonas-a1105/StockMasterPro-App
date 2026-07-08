require('dotenv/config');
const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

async function migrate() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error('ERROR: DATABASE_URL no está definida en .env');
    process.exit(1);
  }

  console.log('Conectando a Supabase...');
  const client = new Client({ connectionString: url });

  try {
    await client.connect();
    console.log('Conectado! Ejecutando migración...');

    const sqlPath = path.join(__dirname, '..', 'prisma', 'init.sql');
    const sql = fs.readFileSync(sqlPath, 'utf-8');

    await client.query(sql);
    console.log('Migración completada exitosamente!');

    await client.end();
    process.exit(0);
  } catch (e) {
    console.error('ERROR:', e.message);
    process.exit(1);
  }
}

migrate();
