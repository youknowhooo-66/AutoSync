/**
 * AccountStatus — lifecycle for AccountPayable and AccountReceivable.
 */
export enum AccountStatus {
  PENDING = 'PENDING',
  PAID = 'PAID',
  OVERDUE = 'OVERDUE',
  CANCELLED = 'CANCELLED',
}

/**
 * MeasurementStatus — lifecycle for a Measurement (medição).
 * Source: DOMAIN_BLUEPRINT.md
 */
export enum MeasurementStatus {
  PENDING = 'PENDENTE',
  IN_ANALYSIS = 'EM_ANALISE',
  APPROVED = 'APROVADA',
  INVOICED = 'FATURADA',
  PAID = 'PAGA',
}
