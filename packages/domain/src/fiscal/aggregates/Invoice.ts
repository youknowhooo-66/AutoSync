import { AggregateRoot } from '../../shared/AggregateRoot';
import { UniqueEntityId } from '../../shared/UniqueEntityId';
import { InvoiceType } from '../value-objects/FiscalEnums';
import { InvalidInvoiceNumberError } from '../errors/FiscalErrors';
import { createInvoiceIssuedEvent, InvoiceIssuedV1 } from '../events/InvoiceIssued.v1';

export interface InvoiceProps {
  readonly companyId: UniqueEntityId;
  readonly xml: string;
  readonly number: string;
  readonly type: InvoiceType;
  readonly totalValue: number;
  readonly issuedAt: Date;
}

/**
 * Invoice (NF-e) — Aggregate Root for product/goods invoices.
 * Usually generated from IN (purchases) or OUT (parts sold).
 */
export class Invoice extends AggregateRoot<InvoiceProps> {
  private constructor(props: InvoiceProps, id?: UniqueEntityId) {
    super(props, id);
  }

  get companyId(): UniqueEntityId { return this._props.companyId; }
  get xml(): string { return this._props.xml; }
  get number(): string { return this._props.number; }
  get type(): InvoiceType { return this._props.type; }
  get totalValue(): number { return this._props.totalValue; }
  get issuedAt(): Date { return this._props.issuedAt; }

  static create(
    props: {
      companyId: string;
      xml: string;
      number: string;
      type: InvoiceType;
      totalValue: number;
      correlationId: string;
    },
    id?: UniqueEntityId,
  ): Invoice {
    if (!props.number || props.number.trim() === '') {
      throw new InvalidInvoiceNumberError();
    }

    const invoice = new Invoice(
      {
        companyId: new UniqueEntityId(props.companyId),
        xml: props.xml,
        number: props.number,
        type: props.type,
        totalValue: props.totalValue,
        issuedAt: new Date(),
      },
      id,
    );

    const event: InvoiceIssuedV1 = createInvoiceIssuedEvent(
      {
        invoiceId: invoice.id.value,
        type: 'nfe',
        referenceId: invoice.id.value,
      },
      {
        companyId: props.companyId,
        correlationId: props.correlationId,
      },
    );
    invoice.addDomainEvent(event);

    return invoice;
  }

  static reconstitute(props: InvoiceProps, id: UniqueEntityId): Invoice {
    return new Invoice(props, id);
  }
}
