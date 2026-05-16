import React from 'react'
import { FileEdit, Send, CheckCircle2, AlertCircle, XCircle } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import type { InvoiceStatus } from '../types/invoice.types'

export const INVOICE_STATUS_CONFIG: Record<InvoiceStatus, { label: string; icon: React.ReactNode; className: string }> = {
  DRAFT: { label: 'Rascunho', icon: <FileEdit className="w-3 h-3 mr-1" />, className: 'bg-slate-500/10 text-slate-500 hover:bg-slate-500/20 border-slate-500/20' },
  ISSUED: { label: 'Emitida', icon: <Send className="w-3 h-3 mr-1" />, className: 'bg-blue-500/10 text-blue-500 hover:bg-blue-500/20 border-blue-500/20' },
  PARTIALLY_PAID: { label: 'Parcial', icon: <AlertCircle className="w-3 h-3 mr-1" />, className: 'bg-amber-500/10 text-amber-500 hover:bg-amber-500/20 border-amber-500/20' },
  PAID: { label: 'Paga', icon: <CheckCircle2 className="w-3 h-3 mr-1" />, className: 'bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 border-emerald-500/20' },
  CANCELED: { label: 'Cancelada', icon: <XCircle className="w-3 h-3 mr-1" />, className: 'bg-red-500/10 text-red-500 hover:bg-red-500/20 border-red-500/20' }
}

export function InvoiceStatusBadge({ status }: { status: InvoiceStatus }) {
  const config = INVOICE_STATUS_CONFIG[status] || INVOICE_STATUS_CONFIG.DRAFT
  return (
    <Badge variant="outline" className={`flex items-center w-fit px-2.5 py-0.5 rounded-full transition-all ${config.className}`}>
      {config.icon}
      <span className="font-semibold">{config.label}</span>
    </Badge>
  )
}
