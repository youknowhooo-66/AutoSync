import type { EventType } from '../events/eventTypes';

export interface AuditLogEntry {
  id: string;
  tenantId: string;
  userId: string;
  action: string;
  module: string;
  entityId?: string;
  eventType?: EventType;
  before?: Record<string, any>;
  after?: Record<string, any>;
  timestamp: string;
}
