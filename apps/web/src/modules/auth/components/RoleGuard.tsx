import React from 'react'
import { usePermissions } from '../hooks/usePermissions'
import type { AppPermission } from '../types/roles.types'

interface RoleGuardProps {
  action: AppPermission
  children: React.ReactNode
  fallback?: React.ReactNode
}

export function RoleGuard({ action, children, fallback = null }: RoleGuardProps) {
  const { can } = usePermissions()

  if (!can(action)) {
    return <>{fallback}</>
  }

  return <>{children}</>
}
