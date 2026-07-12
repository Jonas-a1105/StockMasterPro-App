const pg = require('pg');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');
const { parse } = require('pg-connection-string');

// Load environment variables from backend/.env
dotenv.config({ path: path.join(__dirname, '../.env') });

const connectionString = process.env.DIRECT_URL || process.env.DATABASE_URL;

if (!connectionString) {
  console.error('Error: DIRECT_URL or DATABASE_URL not defined in .env');
  process.exit(1);
}

// Parse connection string and override SSL setting
const config = parse(connectionString);
config.ssl = {
  rejectUnauthorized: false,
};

const client = new pg.Client(config);

async function main() {
  console.log('Connecting directly to database with parsed config...');
  await client.connect();

  console.log('Reading RLS SQL script...');
  const sqlPath = path.join(__dirname, '../prisma/rls-final-corrected.sql');
  const sql = fs.readFileSync(sqlPath, 'utf8');

  console.log('Applying RLS policies to Supabase...');
  await client.query(sql);

  console.log(
    'Row Level Security (RLS) policies successfully applied to the database!',
  );
}

main()
  .catch((e) => {
    console.error('Error applying RLS policies:', e);
    process.exit(1);
  })
  .finally(async () => {
    await client.end();
  });
