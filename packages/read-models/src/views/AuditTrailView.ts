export interface AuditTrailView {
  eventId: string;
  correlationId: string;
  entityId: string;
  entityType: string;
  action: string;
  userId: string | null;
  companyId: string;
  timestamp: Date;
}
