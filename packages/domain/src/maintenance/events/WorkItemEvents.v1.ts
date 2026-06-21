import { DomainEvent, buildEventMetadata } from '../../shared/DomainEvent';

// ─── WorkItemCreated.v1 ───────────────────────────────────────────────────────

export interface WorkItemCreatedPayload {
  readonly workItemId: string;
  readonly maintenanceId: string;
  readonly description: string;
  readonly estimatedCost: number;
}

export type WorkItemCreatedV1 = DomainEvent<WorkItemCreatedPayload>;

export function createWorkItemCreatedEvent(
  payload: WorkItemCreatedPayload,
  meta: { companyId: string; correlationId: string; eventId?: string },
): WorkItemCreatedV1 {
  return {
    ...buildEventMetadata({
      eventType: 'WorkItemCreated',
      companyId: meta.companyId,
      correlationId: meta.correlationId,
      version: 'v1',
      eventId: meta.eventId,
    }),
    payload,
  };
}

// ─── WorkItemApproved.v1 ──────────────────────────────────────────────────────

export interface WorkItemApprovedPayload {
  readonly workItemId: string;
  readonly maintenanceId: string;
  readonly approvedBy: string;
}

export type WorkItemApprovedV1 = DomainEvent<WorkItemApprovedPayload>;

export function createWorkItemApprovedEvent(
  payload: WorkItemApprovedPayload,
  meta: { companyId: string; correlationId: string; eventId?: string },
): WorkItemApprovedV1 {
  return {
    ...buildEventMetadata({
      eventType: 'WorkItemApproved',
      companyId: meta.companyId,
      correlationId: meta.correlationId,
      version: 'v1',
      eventId: meta.eventId,
    }),
    payload,
  };
}

// ─── WorkItemRejected.v1 ──────────────────────────────────────────────────────

export interface WorkItemRejectedPayload {
  readonly workItemId: string;
  readonly reason: string;
}

export type WorkItemRejectedV1 = DomainEvent<WorkItemRejectedPayload>;

export function createWorkItemRejectedEvent(
  payload: WorkItemRejectedPayload,
  meta: { companyId: string; correlationId: string; eventId?: string },
): WorkItemRejectedV1 {
  return {
    ...buildEventMetadata({
      eventType: 'WorkItemRejected',
      companyId: meta.companyId,
      correlationId: meta.correlationId,
      version: 'v1',
      eventId: meta.eventId,
    }),
    payload,
  };
}

// ─── WorkItemCompleted.v1 ─────────────────────────────────────────────────────

export interface WorkItemCompletedPayload {
  readonly workItemId: string;
  readonly totalCost: number;
}

export type WorkItemCompletedV1 = DomainEvent<WorkItemCompletedPayload>;

export function createWorkItemCompletedEvent(
  payload: WorkItemCompletedPayload,
  meta: { companyId: string; correlationId: string; eventId?: string },
): WorkItemCompletedV1 {
  return {
    ...buildEventMetadata({
      eventType: 'WorkItemCompleted',
      companyId: meta.companyId,
      correlationId: meta.correlationId,
      version: 'v1',
      eventId: meta.eventId,
    }),
    payload,
  };
}
