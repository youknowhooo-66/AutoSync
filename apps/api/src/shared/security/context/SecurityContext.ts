import { Role, Permission } from '../../../modules/auth/rbac/permissions';

export interface ISecurityContext {
  userId: string;
  companyId: string;
  role: Role;
  permissions: Permission[];
  correlationId: string;
  sessionId: string;
  ip?: string;
  timestamp: number;
}

export class SecurityContext {
  private static storage = new Map<string, ISecurityContext>();

  public static set(correlationId: string, context: ISecurityContext) {
    this.storage.set(correlationId, context);
  }

  public static get(correlationId: string): ISecurityContext | undefined {
    return this.storage.get(correlationId);
  }

  public static clear(correlationId: string) {
    this.storage.delete(correlationId);
  }
}
