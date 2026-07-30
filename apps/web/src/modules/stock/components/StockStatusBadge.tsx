import React from 'react';
import { AlertTriangle, CheckCircle, XCircle } from 'lucide-react';

interface StockStatusBadgeProps {
  quantity: number;
  min: number;
}

export function StockStatusBadge({ quantity, min }: StockStatusBadgeProps) {
  if (quantity <= 0) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-red-100 text-red-700 border border-red-200">
        <XCircle size={14} /> Esgotado
      </span>
    );
  }

  if (quantity <= min) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-700 border border-amber-200">
        <AlertTriangle size={14} /> Estoque Baixo
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700 border border-emerald-200">
      <CheckCircle size={14} /> Em Estoque
    </span>
  );
}
