import React from 'react';
import { Badge } from '@/components/ui/badge';
import type { PurchaseRequestStatus } from '../types/procurement.types';
import { formatStatusText } from '../utils/procurementUtils';

interface Props {
  status: PurchaseRequestStatus | string;
  className?: string;
}

export const PurchaseRequestStatusBadge: React.FC<Props> = ({ status, className = '' }) => {
  const label = formatStatusText(status);

  switch (status) {
    case 'REQUESTED':
      return (
        <Badge variant="outline" className={`bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800 ${className}`}>
          {label}
        </Badge>
      );
    case 'IN_PROGRESS':
      return (
        <Badge variant="outline" className={`bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800 ${className}`}>
          {label}
        </Badge>
      );
    case 'READY_FOR_PICKUP':
      return (
        <Badge variant="outline" className={`bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800 ${className}`}>
          {label}
        </Badge>
      );
    case 'INSTALLED':
      return (
        <Badge variant="outline" className={`bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800 ${className}`}>
          {label}
        </Badge>
      );
    case 'CANCELED':
      return (
        <Badge variant="outline" className={`bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800 ${className}`}>
          {label}
        </Badge>
      );
    default:
      return <Badge variant="secondary" className={className}>{status}</Badge>;
  }
};
