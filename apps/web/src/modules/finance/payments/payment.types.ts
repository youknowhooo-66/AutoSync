export type PaymentMethod = 'CASH' | 'CARD' | 'PIX' | 'TRANSFER'
export type PaymentStatus = 'PENDING' | 'CONFIRMED' | 'FAILED'

export interface Payment {
  id: string
  invoiceId: string
  method: PaymentMethod
  amount: number
  status: PaymentStatus
  transactionRef?: string
  createdAt: string
  confirmedAt?: string
}
