import React from 'react';
import { Navigate } from 'react-router-dom';
import { usePermissions } from '../hooks/usePermissions';
import { AppPermission } from '../types/roles.types';

interface PermissionRouteProps {
  permission: AppPermission;
  children: React.ReactNode;
  redirectTo?: string;
}

export const PermissionRoute: React.FC<PermissionRouteProps> = ({
  permission,
  children,
  redirectTo = '/dashboard',
}) => {
  const { can } = usePermissions();

  if (!can(permission)) {
    return <Navigate to={redirectTo} replace />;
  }

  return <>{children}</>;
};
