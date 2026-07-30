import { DomainEvent, buildEventMetadata } from '../../shared/DomainEvent';

// ─── TechnicalAssignmentCreated.v1 ────────────────────────────────────────────

export interface TechnicalAssignmentCreatedPayload {
  readonly workItemId: string;
  readonly userId: string;
}

export type TechnicalAssignmentCreatedV1 = DomainEvent<TechnicalAssignmentCreatedPayload>;

export function createTechnicalAssignmentCreatedEvent(
  payload: TechnicalAssignmentCreatedPayload,
  meta: { companyId: string; correlationId: string; eventId?: string },
): TechnicalAssignmentCreatedV1 {
  return {
    ...buildEventMetadata({
      eventType: 'TechnicalAssignmentCreated',
      companyId: meta.companyId,
      correlationId: meta.correlationId,
      version: 'v1',
      eventId: meta.eventId,
    }),
    payload,
  };
}

// ─── TimeEntryRegistered.v1 ───────────────────────────────────────────────────

export interface TimeEntryRegisteredPayload {
  readonly workItemId: string;
  readonly hours: number;
}

export type TimeEntryRegisteredV1 = DomainEvent<TimeEntryRegisteredPayload>;

export function createTimeEntryRegisteredEvent(
  payload: TimeEntryRegisteredPayload,
  meta: { companyId: string; correlationId: string; eventId?: string },
): TimeEntryRegisteredV1 {
  return {
    ...buildEventMetadata({
      eventType: 'TimeEntryRegistered',
      companyId: meta.companyId,
      correlationId: meta.correlationId,
      version: 'v1',
      eventId: meta.eventId,
    }),
    payload,
  };
}

// ─── EvidenceUploaded.v1 ──────────────────────────────────────────────────────

export interface EvidenceUploadedPayload {
  readonly workItemId: string;
  readonly type: string; // EvidenceType string value
  readonly url: string;
}

export type EvidenceUploadedV1 = DomainEvent<EvidenceUploadedPayload>;

export function createEvidenceUploadedEvent(
  payload: EvidenceUploadedPayload,
  meta: { companyId: string; correlationId: string; eventId?: string },
): EvidenceUploadedV1 {
  return {
    ...buildEventMetadata({
      eventType: 'EvidenceUploaded',
      companyId: meta.companyId,
      correlationId: meta.correlationId,
      version: 'v1',
      eventId: meta.eventId,
    }),
    payload,
  };
}
