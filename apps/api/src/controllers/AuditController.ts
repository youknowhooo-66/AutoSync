import { Request, Response } from 'express';
import { prisma } from '../config/prisma';
import { logger } from "../shared/logger";

export const listAuditLogs = async (req: Request, res: Response) => {
  try {
    const { userId, resource, startDate, endDate } = req.query;

    const where: any = {};
    if (userId) where.userId = String(userId);
    if (resource) where.resource = String(resource);
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(String(startDate));
      if (endDate) where.createdAt.lte = new Date(String(endDate));
    }

    const logs = await prisma.auditLog.findMany(({
          where,
          include: { user: { select: { id: true, name: true, email: true } } },
          orderBy: { createdAt: 'desc' },
          take: 200,
        } as unknown as Parameters<typeof prisma.auditLog.findMany>[0]));

    res.json(logs);
  } catch (error: unknown) {
    res.status(500).json({ message: 'Erro ao listar logs de auditoria.' });
  }
};

export const createAuditLog = async (
  userId: string,
  action: string,
  resource: string,
  resourceId?: string,
  oldValue?: any,
  newValue?: any,
  ip?: string
) => {
  // Use a non-blocking approach to ensure audit logging doesn't crash the main request
  setImmediate(async () => {
    try {
      if (!userId) return;

      // Deep clone and sanitize objects to remove complex types like Decimals or circular refs
      const sanitize = (val: any) => {
        if (!val) return null;
        try {
          // Handle BigInt and other Prisma-specific types during serialization
          return JSON.parse(JSON.stringify(val, (key, value) => 
            typeof value === 'bigint' ? value.toString() : value
          ));
        } catch (e: unknown) {
        if (e instanceof Error) {
          return { error: "Unserializable data", message: String(e) };
        } else {
          logger.error({ err: e }, "An unknown error occurred");
        }
      }
      };

      const sanitizedOld = sanitize(oldValue);
      const sanitizedNew = sanitize(newValue);

      await prisma.auditLog.create(({
              data: { 
                userId, 
                action, 
                resource, 
                resourceId: resourceId?.toString(), 
                oldValue: sanitizedOld, 
                newValue: sanitizedNew, 
                ip 
              },
            } as unknown as Parameters<typeof prisma.auditLog.create>[0]));
    } catch (error: unknown) {
    if (error instanceof Error) {
      console.error('CRITICAL: Audit Log Failure:', error);
    } else {
      logger.error({ err: error }, "An unknown error occurred during audit logging");
    }
  }
  });
};
