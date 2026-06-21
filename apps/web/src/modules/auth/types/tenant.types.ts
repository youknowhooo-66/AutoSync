export interface Tenant {
  id: string
  name: string
  plan: 'FREE' | 'PRO' | 'ENTERPRISE'
  isActive: boolean
  createdAt: string
}
