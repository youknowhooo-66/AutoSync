import { AggregateRoot } from '../../shared/AggregateRoot';
import { UniqueEntityId } from '../../shared/UniqueEntityId';
import { ServiceInvoiceStatus } from '../value-objects/FiscalEnums';
import { createInvoiceIssuedEvent, InvoiceIssuedV1 } from '../events/InvoiceIssued.v1';

export interface ServiceInvoiceProps {
  readonly maintenanceId: UniqueEntityId;
  readonly companyId: UniqueEntityId;
  readonly totalValue: number;
  readonly status: ServiceInvoiceStatus;
}

/**
 * ServiceInvoice (NFS-e) — Aggregate Root for service invoices.
 * Usually generated at the end of a Maintenance, covering the service WorkItems.
 */
export class ServiceInvoice extends AggregateRoot<ServiceInvoiceProps> {
  private _status: ServiceInvoiceStatus;

  private constructor(props: ServiceInvoiceProps, id?: UniqueEntityId) {
    super(props, id);
    this._status = props.status;
  }

  get maintenanceId(): UniqueEntityId { return this._props.maintenanceId; }
  get companyId(): UniqueEntityId { return this._props.companyId; }
  get totalValue(): number { return this._props.totalValue; }
  get status(): ServiceInvoiceStatus { return this._status; }

  issue(correlationId: string): void {
    if (this._status === ServiceInvoiceStatus.ISSUED) return;
    this._status = ServiceInvoiceStatus.ISSUED;

    const event: InvoiceIssuedV1 = createInvoiceIssuedEvent(
      {
        invoiceId: this._id.value,
        type: 'nfse',
        referenceId: this._props.maintenanceId.value,
      },
      {
        companyId: this._props.companyId.value,
        correlationId,
      },
    );
    this.addDomainEvent(event);
  }

  cancel(): void {
    this._status = ServiceInvoiceStatus.CANCELLED;
  }

  fail(): void {
    this._status = ServiceInvoiceStatus.ERROR;
  }

  static create(
    props: {
      maintenanceId: string;
      companyId: string;
      totalValue: number;
    },
    id?: UniqueEntityId,
  ): ServiceInvoice {
    return new ServiceInvoice(
      {
        maintenanceId: new UniqueEntityId(props.maintenanceId),
        companyId: new UniqueEntityId(props.companyId),
        totalValue: props.totalValue,
        status: ServiceInvoiceStatus.DRAFT,
      },
      id,
    );
  }

  static reconstitute(props: ServiceInvoiceProps, id: UniqueEntityId): ServiceInvoice {
    return new ServiceInvoice(props, id);
  }
}
