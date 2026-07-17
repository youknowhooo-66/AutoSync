export type ServiceOrderStatus = 'OPEN' | 'DIAGNOSIS' | 'WAITING_PARTS' | 'IN_PROGRESS' | 'COMPLETED' | 'FINISHED' | 'BILLED' | 'CANCELED' | 'CANCELLED'

export interface ServiceOrder {
  id: string
  number: number
  status: ServiceOrderStatus
  finalValue: number
  estimatedValue?: number
  createdAt: string
  notes?: string
  client: { name: string; document?: string }
  vehicle: { model: string; plate: string }
  mechanic?: { name: string }
  parts?: Array<{
    part: { id: string; name: string }
    quantity: number
    unitPrice: number
  }>
  services?: Array<{
    name: string
    price: number
  }>
}

export interface TimelineEvent {
  id: string
  osId: string
  type: 'STATUS_CHANGE' | 'PART_ADDED' | 'SERVICE_ADDED' | 'NOTE_ADDED'
  description: string
  metadata?: any
  createdAt: string
  createdBy: { name: string }
}
