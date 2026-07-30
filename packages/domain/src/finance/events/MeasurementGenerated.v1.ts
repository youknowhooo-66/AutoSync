import { DomainEvent, buildEventMetadata } from '../../shared/DomainEvent';

export interface MeasurementGeneratedPayload {
  readonly measurementId: string;
  readonly period: string;
  readonly totalValue: number;
  readonly workItemIds?: string[];
}

export type MeasurementGeneratedV1 = DomainEvent<MeasurementGeneratedPayload>;

export function createMeasurementGeneratedEvent(
  payload: MeasurementGeneratedPayload,
  meta: { companyId: string; correlationId: string; eventId?: string },
): MeasurementGeneratedV1 {
  return {
    ...buildEventMetadata({
      eventType: 'MeasurementGenerated',
      companyId: meta.companyId,
      correlationId: meta.correlationId,
      version: 'v1',
      eventId: meta.eventId,
    }),
    payload,
  };
}
