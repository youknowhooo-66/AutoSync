import React from 'react'
import { FileText, Search, PauseCircle, Clock, CheckCircle2, DollarSign, XCircle } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import type { ServiceOrderStatus } from '../types/serviceOrder.types'

export const STATUS_CONFIG: Record<ServiceOrderStatus, { label: string; icon: React.ReactNode; className: string }> = {
  OPEN: { label: 'Aberta', icon: <FileText className="w-3 h-3 mr-1" />, className: 'bg-blue-500/10 text-blue-500 hover:bg-blue-500/20 border-blue-500/20' },
  DIAGNOSIS: { label: 'Diagnóstico', icon: <Search className="w-3 h-3 mr-1" />, className: 'bg-indigo-500/10 text-indigo-500 hover:bg-indigo-500/20 border-indigo-500/20' },
  WAITING_PARTS: { label: 'Aguardando Peças', icon: <PauseCircle className="w-3 h-3 mr-1" />, className: 'bg-purple-500/10 text-purple-500 hover:bg-purple-500/20 border-purple-500/20' },
  IN_PROGRESS: { label: 'Em Execução', icon: <Clock className="w-3 h-3 mr-1" />, className: 'bg-amber-500/10 text-amber-500 hover:bg-amber-500/20 border-amber-500/20' },
  COMPLETED: { label: 'Finalizada', icon: <CheckCircle2 className="w-3 h-3 mr-1" />, className: 'bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 border-emerald-500/20' },
  FINISHED: { label: 'Finalizada', icon: <CheckCircle2 className="w-3 h-3 mr-1" />, className: 'bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 border-emerald-500/20' },
  BILLED: { label: 'Faturada', icon: <DollarSign className="w-3 h-3 mr-1" />, className: 'bg-teal-500/10 text-teal-500 hover:bg-teal-500/20 border-teal-500/20' },
  CANCELED: { label: 'Cancelada', icon: <XCircle className="w-3 h-3 mr-1" />, className: 'bg-red-500/10 text-red-500 hover:bg-red-500/20 border-red-500/20' },
  CANCELLED: { label: 'Cancelada', icon: <XCircle className="w-3 h-3 mr-1" />, className: 'bg-red-500/10 text-red-500 hover:bg-red-500/20 border-red-500/20' }
}

interface Props {
  status: ServiceOrderStatus
}

export function ServiceOrderStatusBadge({ status }: Props) {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.OPEN
  return (
    <Badge variant="outline" className={`flex items-center w-fit px-2.5 py-0.5 rounded-full transition-all ${config.className}`}>
      {config.icon}
      <span className="font-semibold">{config.label}</span>
    </Badge>
  )
}
