import type { Role } from './roles.types'
import type { Tenant } from './tenant.types'

export interface User {
  id: string
  name: string
  email: string
  role: Role
  tenantId: string
  tenant?: Tenant
  isActive: boolean
  createdAt: string
}

export interface AuthSession {
  token: string
  user: User
}
