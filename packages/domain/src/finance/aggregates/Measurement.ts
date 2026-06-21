import { AggregateRoot } from '../../shared/AggregateRoot';
import { UniqueEntityId } from '../../shared/UniqueEntityId';
import { MeasurementStatus } from '../value-objects/FinanceEnums';
import { MeasurementAlreadyApprovedError, MeasurementValueMustBePositiveError } from '../errors/FinanceErrors';
import { createMeasurementGeneratedEvent, MeasurementGeneratedV1 } from '../events/MeasurementGenerated.v1';

export interface MeasurementProps {
  readonly companyId: UniqueEntityId;
  readonly contractId: UniqueEntityId;
  readonly periodStart: Date;
  readonly periodEnd: Date;
  readonly totalValue: number;
  readonly status: MeasurementStatus;
}

/**
 * Measurement — Aggregate Root for the Finance context.
 * Represents a billing period (medição) against a public contract.
 *
 * Rules (aggregates-design.md): Measurement is a snapshot aggregate.
 * Emits: MeasurementGenerated.v1
 */
export class Measurement extends AggregateRoot<MeasurementProps> {
  private _status: MeasurementStatus;

  private constructor(props: MeasurementProps, id?: UniqueEntityId) {
    super(props, id);
    this._status = props.status;
  }

  get companyId(): UniqueEntityId { return this._props.companyId; }
  get contractId(): UniqueEntityId { return this._props.contractId; }
  get periodStart(): Date { return this._props.periodStart; }
  get periodEnd(): Date { return this._props.periodEnd; }
  get totalValue(): number { return this._props.totalValue; }
  get status(): MeasurementStatus { return this._status; }

  analyze(): void {
    if (this._status !== MeasurementStatus.PENDING) {
      throw new MeasurementAlreadyApprovedError(this._id.value);
    }
    this._status = MeasurementStatus.IN_ANALYSIS;
  }

  approve(): void {
    if (this._status === MeasurementStatus.APPROVED || this._status === MeasurementStatus.INVOICED || this._status === MeasurementStatus.PAID) {
      throw new MeasurementAlreadyApprovedError(this._id.value);
    }
    this._status = MeasurementStatus.APPROVED;
  }

  invoice(): void {
    if (this._status !== MeasurementStatus.APPROVED) {
      // Rule: must be approved before invoicing, simplify for domain logic
      throw new Error(`Measurement "${this._id.value}" must be APPROVED before invoicing.`);
    }
    this._status = MeasurementStatus.INVOICED;
  }

  pay(): void {
    if (this._status !== MeasurementStatus.INVOICED) {
      throw new Error(`Measurement "${this._id.value}" must be INVOICED before paying.`);
    }
    this._status = MeasurementStatus.PAID;
  }

  static create(
    props: {
      companyId: string;
      contractId: string;
      periodStart: Date;
      periodEnd: Date;
      totalValue: number;
      workItemIds?: string[];
      correlationId: string;
    },
    id?: UniqueEntityId,
  ): Measurement {
    if (props.totalValue <= 0) {
      throw new MeasurementValueMustBePositiveError();
    }

    const measurement = new Measurement(
      {
        companyId: new UniqueEntityId(props.companyId),
        contractId: new UniqueEntityId(props.contractId),
        periodStart: props.periodStart,
        periodEnd: props.periodEnd,
        totalValue: props.totalValue,
        status: MeasurementStatus.PENDING,
      },
      id,
    );

    const event: MeasurementGeneratedV1 = createMeasurementGeneratedEvent(
      {
        measurementId: measurement.id.value,
        period: `${props.periodStart.toISOString()}_${props.periodEnd.toISOString()}`,
        totalValue: props.totalValue,
        workItemIds: props.workItemIds,
      },
      {
        companyId: props.companyId,
        correlationId: props.correlationId,
      },
    );
    measurement.addDomainEvent(event);

    return measurement;
  }

  static reconstitute(props: MeasurementProps, id: UniqueEntityId): Measurement {
    return new Measurement(props, id);
  }
}
