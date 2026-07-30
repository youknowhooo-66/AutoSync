import { DomainError } from '../../shared/errors/DomainError';

export class InvoiceAlreadyIssuedError extends DomainError {
  constructor(invoiceId: string) {
    super(`Invoice "${invoiceId}" has already been issued.`);
    this.name = 'InvoiceAlreadyIssuedError';
  }
}

export class InvalidInvoiceNumberError extends DomainError {
  constructor() {
    super('Invoice number cannot be empty or invalid.');
    this.name = 'InvalidInvoiceNumberError';
  }
}
