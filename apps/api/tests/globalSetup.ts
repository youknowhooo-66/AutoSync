import { execSync } from 'child_process';
import path from 'path';
import dotenv from 'dotenv';

export default async function globalSetup() {
  console.log('\n🔄 [Global Setup] Bootstrapping isolated testing environment...');
  
  // Load environment variables from apps/api/.env.test
  const envPath = path.resolve(__dirname, '../.env.test');
  dotenv.config({ path: envPath });

  // Enforce DATABASE_URL for prisma CLI processes
  const testDbUrl = process.env.DATABASE_URL || "postgresql://postgres:admin123@localhost:5436/autosync_test?schema=public";
  process.env.DATABASE_URL = testDbUrl;

  console.log(`📡 [Global Setup] Database URL: ${testDbUrl}`);

  try {
    // Run prisma db push to sync the postgres test database with schema.prisma
    console.log('📦 [Global Setup] Synchronizing Prisma schema with test database...');
    execSync('npx prisma db push --accept-data-loss', {
      env: { ...process.env, DATABASE_URL: testDbUrl },
      stdio: 'inherit',
    });
    console.log('✅ [Global Setup] Database schema synchronized successfully.');
  } catch (error) {
    console.error('❌ [Global Setup] Error synchronizing database schema:', error);
    throw error;
  }
}
