import type { AuditLogEntry } from './audit.types';
import { auditService } from './audit.service';

export class AuditLog {
  static create(entry: Omit<AuditLogEntry, 'id' | 'timestamp'>) {
    const fullEntry: AuditLogEntry = {
      ...entry,
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString()
    };
    
    // In a real app, this would be an async call to a logging service queue
    // For now, we persist via the audit service
    auditService.persist(fullEntry);
  }
}
