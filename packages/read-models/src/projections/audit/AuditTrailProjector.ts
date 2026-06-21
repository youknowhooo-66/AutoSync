import { DomainEvent } from '@autosync/domain';
import { IProjectionStore } from '../../repositories';
import { AuditTrailView } from '../../views';

const ENTITY_ID_FIELDS = [
  'workItemId',
  'maintenanceId',
  'stockItemId',
  'measurementId',
  'invoiceId',
  'accountId',
  'vehicleId',
  'userId',
] as const;

const USER_ID_FIELDS = ['approvedBy', 'userId'] as const;

export class AuditTrailProjector {
  constructor(private readonly store: IProjectionStore) {}

  async onDomainEvent(event: DomainEvent<unknown>): Promise<void> {
    const existing = await this.store.auditTrail.get(event.eventId);
    if (existing) return;

    const payload = event.payload as Record<string, unknown>;
    const entityId = this.extractEntityId(payload);
    const userId = this.extractUserId(payload);

    const view: AuditTrailView = {
      eventId: event.eventId,
      correlationId: event.correlationId,
      entityId,
      entityType: this.inferEntityType(event.eventType, payload),
      action: event.eventType,
      userId,
      companyId: event.companyId,
      timestamp: event.timestamp,
    };

    await this.store.auditTrail.upsert(event.eventId, view);
  }

  private extractEntityId(payload: Record<string, unknown>): string {
    for (const field of ENTITY_ID_FIELDS) {
      const value = payload[field];
      if (typeof value === 'string' && value.length > 0) {
        return value;
      }
    }
    return 'unknown';
  }

  private extractUserId(payload: Record<string, unknown>): string | null {
    for (const field of USER_ID_FIELDS) {
      const value = payload[field];
      if (typeof value === 'string' && value.length > 0) {
        return value;
      }
    }
    return null;
  }

  private inferEntityType(eventType: string, payload: Record<string, unknown>): string {
    if (payload.workItemId) return 'WorkItem';
    if (payload.maintenanceId) return 'Maintenance';
    if (payload.stockItemId) return 'StockItem';
    if (payload.measurementId) return 'Measurement';
    if (payload.invoiceId) return 'Invoice';
    if (payload.accountId) return 'Account';
    if (payload.vehicleId) return 'Vehicle';
    if (payload.userId) return 'Technician';

    if (eventType.includes('WorkItem')) return 'WorkItem';
    if (eventType.includes('Maintenance')) return 'Maintenance';
    if (eventType.includes('Stock')) return 'StockItem';
    if (eventType.includes('Invoice')) return 'Invoice';
    if (eventType.includes('Measurement')) return 'Measurement';
    if (eventType.includes('Account')) return 'Account';

    return 'Unknown';
  }
}
