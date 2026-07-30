import React from 'react';
import { usePermissions } from '../hooks/usePermissions';
import type { AppPermission } from '../types/roles.types';

interface PermissionGateProps {
  permission: AppPermission;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export const PermissionGate: React.FC<PermissionGateProps> = ({ permission, children, fallback = null }) => {
  const { can } = usePermissions();

  if (!can(permission)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
};
