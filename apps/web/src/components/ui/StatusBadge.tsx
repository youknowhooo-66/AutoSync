import React from 'react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Clock, CheckCircle2, AlertTriangle, XCircle, AlertCircle, PackageCheck, Ban } from 'lucide-react';

export type StatusType =
  // OS Statuses
  | 'DRAFT'
  | 'EM_ABERTO'
  | 'WAITING_APPROVAL'
  | 'AGUARDANDO_APROVACAO'
  | 'APPROVED'
  | 'APROVADO'
  | 'EXECUTING'
  | 'EM_EXECUCAO'
  | 'COMPLETED'
  | 'CONCLUIDO'
  | 'FINALIZADO'
  | 'CANCELED'
  | 'CANCELADO'
  // Financial Statuses
  | 'PENDING'
  | 'PENDENTE'
  | 'PAID'
  | 'PAGO'
  | 'OVERDUE'
  | 'ATRASADO'
  | 'PARTIAL'
  | 'PARCIAL'
  // Inventory Statuses
  | 'AVAILABLE'
  | 'DISPONIVEL'
  | 'RESERVED'
  | 'RESERVADO'
  | 'CRITICAL'
  | 'CRITICO'
  | 'OUT_OF_STOCK'
  | 'SEM_ESTOQUE'
  | 'INACTIVE'
  | 'INATIVO';

interface StatusBadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  status: StatusType | string;
  customLabel?: string;
  className?: string;
}

const statusConfig: Record<
  string,
  { label: string; className: string; icon: React.ReactNode }
> = {
  // OS
  DRAFT: { label: 'Rascunho', className: 'bg-slate-500/10 text-slate-600 border-slate-200 dark:text-slate-400 dark:border-slate-800', icon: <Clock className="w-3 h-3" /> },
  EM_ABERTO: { label: 'Em Aberto', className: 'bg-sky-500/10 text-sky-700 border-sky-200 dark:text-sky-400 dark:border-sky-800', icon: <Clock className="w-3 h-3" /> },
  WAITING_APPROVAL: { label: 'Aguardando Aprovação', className: 'bg-amber-500/10 text-amber-700 border-amber-200 dark:text-amber-400 dark:border-amber-800', icon: <AlertTriangle className="w-3 h-3" /> },
  AGUARDANDO_APROVACAO: { label: 'Aguardando Aprovação', className: 'bg-amber-500/10 text-amber-700 border-amber-200 dark:text-amber-400 dark:border-amber-800', icon: <AlertTriangle className="w-3 h-3" /> },
  APPROVED: { label: 'Aprovado', className: 'bg-emerald-500/10 text-emerald-700 border-emerald-200 dark:text-emerald-400 dark:border-emerald-800', icon: <CheckCircle2 className="w-3 h-3" /> },
  APROVADO: { label: 'Aprovado', className: 'bg-emerald-500/10 text-emerald-700 border-emerald-200 dark:text-emerald-400 dark:border-emerald-800', icon: <CheckCircle2 className="w-3 h-3" /> },
  EXECUTING: { label: 'Em Execução', className: 'bg-indigo-500/10 text-indigo-700 border-indigo-200 dark:text-indigo-400 dark:border-indigo-800', icon: <Clock className="w-3 h-3 animate-spin" /> },
  EM_EXECUCAO: { label: 'Em Execução', className: 'bg-indigo-500/10 text-indigo-700 border-indigo-200 dark:text-indigo-400 dark:border-indigo-800', icon: <Clock className="w-3 h-3" /> },
  COMPLETED: { label: 'Concluído', className: 'bg-emerald-500/10 text-emerald-700 border-emerald-200 dark:text-emerald-400 dark:border-emerald-800', icon: <CheckCircle2 className="w-3 h-3" /> },
  CONCLUIDO: { label: 'Concluído', className: 'bg-emerald-500/10 text-emerald-700 border-emerald-200 dark:text-emerald-400 dark:border-emerald-800', icon: <CheckCircle2 className="w-3 h-3" /> },
  FINALIZADO: { label: 'Finalizado', className: 'bg-emerald-500/10 text-emerald-700 border-emerald-200 dark:text-emerald-400 dark:border-emerald-800', icon: <CheckCircle2 className="w-3 h-3" /> },
  CANCELED: { label: 'Cancelado', className: 'bg-rose-500/10 text-rose-700 border-rose-200 dark:text-rose-400 dark:border-rose-800', icon: <XCircle className="w-3 h-3" /> },
  CANCELADO: { label: 'Cancelado', className: 'bg-rose-500/10 text-rose-700 border-rose-200 dark:text-rose-400 dark:border-rose-800', icon: <XCircle className="w-3 h-3" /> },

  // Financial
  PENDING: { label: 'Pendente', className: 'bg-amber-500/10 text-amber-700 border-amber-200 dark:text-amber-400 dark:border-amber-800', icon: <Clock className="w-3 h-3" /> },
  PENDENTE: { label: 'Pendente', className: 'bg-amber-500/10 text-amber-700 border-amber-200 dark:text-amber-400 dark:border-amber-800', icon: <Clock className="w-3 h-3" /> },
  PAID: { label: 'Pago', className: 'bg-emerald-500/10 text-emerald-700 border-emerald-200 dark:text-emerald-400 dark:border-emerald-800', icon: <CheckCircle2 className="w-3 h-3" /> },
  PAGO: { label: 'Pago', className: 'bg-emerald-500/10 text-emerald-700 border-emerald-200 dark:text-emerald-400 dark:border-emerald-800', icon: <CheckCircle2 className="w-3 h-3" /> },
  OVERDUE: { label: 'Atrasado', className: 'bg-rose-500/10 text-rose-700 border-rose-200 dark:text-rose-400 dark:border-rose-800', icon: <AlertCircle className="w-3 h-3" /> },
  ATRASADO: { label: 'Atrasado', className: 'bg-rose-500/10 text-rose-700 border-rose-200 dark:text-rose-400 dark:border-rose-800', icon: <AlertCircle className="w-3 h-3" /> },
  PARTIAL: { label: 'Parcial', className: 'bg-blue-500/10 text-blue-700 border-blue-200 dark:text-blue-400 dark:border-blue-800', icon: <Clock className="w-3 h-3" /> },
  PARCIAL: { label: 'Parcial', className: 'bg-blue-500/10 text-blue-700 border-blue-200 dark:text-blue-400 dark:border-blue-800', icon: <Clock className="w-3 h-3" /> },

  // Inventory
  AVAILABLE: { label: 'Disponível', className: 'bg-emerald-500/10 text-emerald-700 border-emerald-200 dark:text-emerald-400 dark:border-emerald-800', icon: <PackageCheck className="w-3 h-3" /> },
  DISPONIVEL: { label: 'Disponível', className: 'bg-emerald-500/10 text-emerald-700 border-emerald-200 dark:text-emerald-400 dark:border-emerald-800', icon: <PackageCheck className="w-3 h-3" /> },
  RESERVED: { label: 'Reservado', className: 'bg-blue-500/10 text-blue-700 border-blue-200 dark:text-blue-400 dark:border-blue-800', icon: <Clock className="w-3 h-3" /> },
  RESERVADO: { label: 'Reservado', className: 'bg-blue-500/10 text-blue-700 border-blue-200 dark:text-blue-400 dark:border-blue-800', icon: <Clock className="w-3 h-3" /> },
  CRITICAL: { label: 'Estoque Crítico', className: 'bg-amber-500/10 text-amber-700 border-amber-200 dark:text-amber-400 dark:border-amber-800', icon: <AlertTriangle className="w-3 h-3" /> },
  CRITICO: { label: 'Estoque Crítico', className: 'bg-amber-500/10 text-amber-700 border-amber-200 dark:text-amber-400 dark:border-amber-800', icon: <AlertTriangle className="w-3 h-3" /> },
  OUT_OF_STOCK: { label: 'Sem Estoque', className: 'bg-rose-500/10 text-rose-700 border-rose-200 dark:text-rose-400 dark:border-rose-800', icon: <Ban className="w-3 h-3" /> },
  SEM_ESTOQUE: { label: 'Sem Estoque', className: 'bg-rose-500/10 text-rose-700 border-rose-200 dark:text-rose-400 dark:border-rose-800', icon: <Ban className="w-3 h-3" /> },
  INACTIVE: { label: 'Inativo', className: 'bg-slate-500/10 text-slate-600 border-slate-200 dark:text-slate-400 dark:border-slate-800', icon: <Ban className="w-3 h-3" /> },
  INATIVO: { label: 'Inativo', className: 'bg-slate-500/10 text-slate-600 border-slate-200 dark:text-slate-400 dark:border-slate-800', icon: <Ban className="w-3 h-3" /> },
};

export function StatusBadge({ status, customLabel, className }: StatusBadgeProps) {
  const normalizedKey = String(status).toUpperCase();
  const config = statusConfig[normalizedKey] || {
    label: customLabel || String(status),
    className: 'bg-slate-500/10 text-slate-700 border-slate-200 dark:text-slate-300 dark:border-slate-800',
    icon: <Clock className="w-3 h-3" />,
  };

  return (
    <Badge
      variant="outline"
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-0.5 text-xs font-semibold rounded-full border shadow-2xs transition-colors',
        config.className,
        className
      )}
    >
      {config.icon}
      <span>{customLabel || config.label}</span>
    </Badge>
  );
}
