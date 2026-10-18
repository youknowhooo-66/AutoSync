/**
 * bootstrap-admin.ts — creates the first company, branch and ADMIN user.
 *
 * Idempotent and NON-destructive: it never deletes anything and does nothing
 * if a user with ADMIN_EMAIL already exists. Safe to run in production.
 *
 * Required env: ADMIN_EMAIL, ADMIN_PASSWORD (min. 12 chars)
 * Optional env: COMPANY_NAME, COMPANY_DOCUMENT, ADMIN_NAME
 */
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD;
  if (!email || !password || password.length < 12) {
    throw new Error('ADMIN_EMAIL and ADMIN_PASSWORD (min. 12 chars) are required.');
  }

  if (await prisma.user.findUnique({ where: { email } })) {
    console.log('[bootstrap] Admin already exists — nothing to do.');
    return;
  }

  const document = process.env.COMPANY_DOCUMENT ?? '00.000.000/0001-00';
  const company =
    (await prisma.company.findUnique({ where: { document } })) ??
    (await prisma.company.create({
      data: { name: process.env.COMPANY_NAME ?? 'AutoSync', document },
    }));

  await prisma.user.create({
    data: {
      companyId: company.id,
      name: process.env.ADMIN_NAME ?? 'Administrador',
      email,
      password: await bcrypt.hash(password, 12),
      role: 'ADMIN',
    },
  });
  console.log(`[bootstrap] Admin created: ${email}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
