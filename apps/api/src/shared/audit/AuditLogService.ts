import { prismaClient } from '../database/prismaClient';
import { logger } from "../logger";

interface IAuditLogRequest {
  userId: string;
  companyId: string;
  action: string;
  resource: string;
  resourceId?: string;
  oldValue?: any;
  newValue?: any;
  ip?: string;
  tx?: any;
}

export class AuditLogService {
  static async log({
    userId,
    companyId,
    action,
    resource,
    resourceId,
    oldValue,
    newValue,
    ip,
    tx,
  }: IAuditLogRequest) {
    try {
      const client = tx || prismaClient;
      await client.auditLog.create({
        data: {
          userId,
          action,
          resource,
          resourceId,
          oldValue: oldValue ? JSON.parse(JSON.stringify(oldValue)) : null,
          newValue: newValue ? JSON.parse(JSON.stringify(newValue)) : null,
          ip,
        },
      });
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error('Failed to create audit log:', error);
      } else {
        logger.error({ err: error }, "An unknown error occurred");
      }
      if (tx) {
        throw error;
      }
    }
  }
}
