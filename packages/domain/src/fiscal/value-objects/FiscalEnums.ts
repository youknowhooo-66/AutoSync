/**
 * InvoiceType — differentiates NF-e and NFS-e logic internally, or direction.
 * In ERD_DIAGRAM.md: Invoice.type (IN | OUT)
 */
export enum InvoiceType {
  IN = 'IN',
  OUT = 'OUT',
}

/**
 * ServiceInvoiceStatus — lifecycle of an NFS-e.
 */
export enum ServiceInvoiceStatus {
  DRAFT = 'DRAFT',
  PROCESSING = 'PROCESSING',
  ISSUED = 'ISSUED',
  CANCELLED = 'CANCELLED',
  ERROR = 'ERROR',
}
