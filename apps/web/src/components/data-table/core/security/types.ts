import type { ColumnDef } from '@tanstack/react-table'
import type { AppPermission } from '@/modules/auth/types/roles.types'

export type SecureColumn<T> = ColumnDef<T> & {
  requiredPermission?: AppPermission
  hiddenIfUnauthorized?: boolean
}

export type SecureAction = {
  id: string
  label: string
  requiredPermission?: AppPermission
  icon?: React.ReactNode
  onClick?: (row: any) => void
}
