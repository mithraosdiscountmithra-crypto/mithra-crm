import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const { Client } = pg;

async function runMigration() {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    console.log('[Migration] No DATABASE_URL specified in environment.');
    console.log('[Migration] The app will run in embedded multi-tenant fallback mode.');
    return;
  }

  console.log('[Migration] Connecting to Neon / PostgreSQL database...');
  const client = new Client({
    connectionString: dbUrl,
    ssl: dbUrl.includes('localhost') ? false : { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('[Migration] Successfully connected. Reading schema.sql...');

    const schemaPath = path.join(__dirname, 'schema.sql');
    const schemaSql = fs.readFileSync(schemaPath, 'utf8');

    await client.query(schemaSql);
    console.log('[Migration] Database schema migrated successfully! All tables and indexes are ready.');
  } catch (err) {
    console.error('[Migration Error]:', err.message);
  } finally {
    await client.end();
  }
}

runMigration();
