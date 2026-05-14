import { prismaClient } from '../database/prismaClient';

interface IAuditLogRequest {
  userId: string;
  companyId: string;
  action: string;
  resource: string;
  resourceId?: string;
  oldValue?: any;
  newValue?: any;
  ip?: string;
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
  }: IAuditLogRequest) {
    try {
      await prismaClient.auditLog.create({
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
    } catch (error) {
      console.error('Failed to create audit log:', error);
      // We don't throw here to avoid breaking the main business flow
    }
  }
}
