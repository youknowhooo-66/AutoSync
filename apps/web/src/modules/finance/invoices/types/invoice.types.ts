export type InvoiceStatus = 'DRAFT' | 'ISSUED' | 'PAID' | 'PARTIALLY_PAID' | 'CANCELED'

export interface Invoice {
  id: string
  invoiceNumber: string
  serviceOrderId: string
  client: { name: string; document?: string; email?: string }
  vehicle: { model: string; plate: string }
  subtotal: number
  discount: number
  taxes: number
  totalAmount: number
  amountPaid: number
  status: InvoiceStatus
  issuedAt?: string
  dueDate?: string
  paidAt?: string
  createdAt: string
}
