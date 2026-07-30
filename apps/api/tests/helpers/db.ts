import { prismaClient } from '../../src/shared/database/prismaClient';

/**
 * Truncates all tables in the PostgreSQL database to reset state between tests.
 * This runs Cascade truncations safely in milliseconds.
 */
export async function truncateDatabase() {
  try {
    const tablenames = await prismaClient.$queryRaw<Array<{ tablename: string }>>`
      SELECT tablename FROM pg_tables WHERE schemaname='public'
    `;

    const tables = tablenames
      .map(({ tablename }) => tablename)
      .filter((name) => name !== '_prisma_migrations');

    if (tables.length === 0) return;

    // Build the query to truncate all tables in a single command, which is faster
    const quotedTables = tables.map((table) => `"${table}"`).join(', ');
    const truncateQuery = `TRUNCATE TABLE ${quotedTables} CASCADE;`;

    await prismaClient.$executeRawUnsafe(truncateQuery);
  } catch (error) {
    console.error('❌ Error truncating test database:', error);
  }
}
