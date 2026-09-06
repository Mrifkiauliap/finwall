import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import pg from 'pg';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '../..');

// Helper to load .env file if present
function loadEnv() {
  const envPath = path.join(rootDir, '.env');
  if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, 'utf8');
    for (const line of content.split('\n')) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const [key, ...values] = trimmed.split('=');
      const val = values.join('=').trim().replace(/^["']|["']$/g, '');
      if (key && val && !process.env[key.trim()]) {
        process.env[key.trim()] = val;
      }
    }
  }
}

loadEnv();

const dbHost = process.env.DATABASE_HOST || 'localhost';
const dbPort = parseInt(process.env.DATABASE_PORT || '5432', 10);
const dbUser = process.env.DATABASE_USER || 'postgres';
const dbPassword = process.env.DATABASE_PASSWORD || 'postgres';
const dbName = process.env.DATABASE_NAME || 'finwall_db';

async function resetDatabase() {
  console.log('🔄 Starting Hard Database Reset...');
  console.log(`📍 Host: ${dbHost}:${dbPort}`);
  console.log(`👤 User: ${dbUser}`);
  console.log(`🗄️  Target DB: ${dbName}`);

  // Connect to default 'postgres' database to manage target database
  const client = new pg.Client({
    host: dbHost,
    port: dbPort,
    user: dbUser,
    password: dbPassword,
    database: 'postgres',
  });

  try {
    await client.connect();
    console.log('🔌 Connected to PostgreSQL instance.');

    // 1. Terminate all active connections to the target database
    console.log(`🛑 Terminating active connections to "${dbName}"...`);
    await client.query(`
      SELECT pg_terminate_backend(pg_stat_activity.pid)
      FROM pg_stat_activity
      WHERE pg_stat_activity.datname = '${dbName}'
        AND pid <> pg_backend_pid();
    `);

    // 2. Drop target database
    console.log(`🗑️  Dropping database "${dbName}"...`);
    await client.query(`DROP DATABASE IF EXISTS "${dbName}";`);

    // 3. Create target database
    console.log(`✨ Creating fresh database "${dbName}"...`);
    await client.query(`CREATE DATABASE "${dbName}";`);

    console.log('✅ Database reset in PostgreSQL complete!');
  } catch (error) {
    console.error('❌ Error while resetting database in PostgreSQL:', error);
    process.exit(1);
  } finally {
    await client.end();
  }

  // 4. Run Drizzle migrations on the fresh database
  console.log('\n🚀 Running database migrations...');
  try {
    execSync('pnpm --filter @finwall/db db:migrate', {
      cwd: rootDir,
      stdio: 'inherit',
    });
    console.log('🎉 Migrations executed successfully on fresh database!');
  } catch (error) {
    console.error('❌ Failed to run migrations:', error);
    process.exit(1);
  }
}

resetDatabase();
