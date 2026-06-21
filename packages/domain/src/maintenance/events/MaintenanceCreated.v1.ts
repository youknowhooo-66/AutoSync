import { DomainEvent, buildEventMetadata } from '../../shared/DomainEvent';

// ─── MaintenanceCreated.v1 ────────────────────────────────────────────────────

export interface MaintenanceCreatedPayload {
  readonly maintenanceId: string;
  readonly clientId: string;
  readonly vehicleId: string;
}

export type MaintenanceCreatedV1 = DomainEvent<MaintenanceCreatedPayload>;

export function createMaintenanceCreatedEvent(
  payload: MaintenanceCreatedPayload,
  meta: { companyId: string; correlationId: string; eventId?: string },
): MaintenanceCreatedV1 {
  return {
    ...buildEventMetadata({
      eventType: 'MaintenanceCreated',
      companyId: meta.companyId,
      correlationId: meta.correlationId,
      version: 'v1',
      eventId: meta.eventId,
    }),
    payload,
  };
}
