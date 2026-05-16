import React, { useMemo } from "react"
import type { ColumnDef } from "@tanstack/react-table"
import { Wrench, Calendar, User, CarFront, FileText, CheckCircle2, Clock, PauseCircle, XCircle } from "lucide-react"

import { DataTableCore } from "../core/DataTableCore"
import { DataTableColumnHeader } from "../parts/DataTableHeader"
import { DataTableRowActions } from "../parts/DataTableRowActions"
import { Badge } from "@/components/ui/badge"

export interface OS {
  id: string
  number: number
  status: string
  finalValue: number
  createdAt: string
  notes?: string
  client: { name: string }
  vehicle: { model: string; plate: string }
  mechanic?: { name: string }
}

export const STATUS_CONFIG: Record<string, { label: string; icon: React.ReactNode; className: string }> = {
  OPEN: { label: "Aberta", icon: <FileText className="w-3 h-3 mr-1" />, className: "bg-blue-500/10 text-blue-500 hover:bg-blue-500/20 border-blue-500/20" },
  IN_PROGRESS: { label: "Em Andamento", icon: <Clock className="w-3 h-3 mr-1" />, className: "bg-amber-500/10 text-amber-500 hover:bg-amber-500/20 border-amber-500/20" },
  AWAITING_PARTS: { label: "Aguardando Peça", icon: <PauseCircle className="w-3 h-3 mr-1" />, className: "bg-purple-500/10 text-purple-500 hover:bg-purple-500/20 border-purple-500/20" },
  FINISHED: { label: "Finalizada", icon: <CheckCircle2 className="w-3 h-3 mr-1" />, className: "bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 border-emerald-500/20" },
  CANCELLED: { label: "Cancelada", icon: <XCircle className="w-3 h-3 mr-1" />, className: "bg-red-500/10 text-red-500 hover:bg-red-500/20 border-red-500/20" },
}

interface ServiceOrderTableProps {
  data: OS[]
  isLoading: boolean
  onRowClick: (os: OS) => void
  onEdit?: (os: OS) => void
  onDelete?: (os: OS) => void
}

export function ServiceOrderTable({ data, isLoading, onRowClick, onEdit, onDelete }: ServiceOrderTableProps) {
  const columns = useMemo<ColumnDef<OS>[]>(
    () => [
      {
        accessorKey: "number",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Nº OS" />
        ),
        cell: ({ row }) => {
          return (
            <div className="flex items-center gap-2 font-mono font-medium">
              <span className="text-muted-foreground">#</span>
              <span className="text-foreground">{String(row.getValue("number")).padStart(4, '0')}</span>
            </div>
          )
        },
        enableSorting: true,
      },
      {
        id: "clientName",
        accessorFn: (row) => row.client?.name || "Sem Cliente",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Cliente" />
        ),
        cell: ({ row }) => {
          return (
            <div className="flex items-center gap-2 text-foreground font-medium truncate max-w-[200px]">
              <User className="h-4 w-4 text-muted-foreground shrink-0" />
              <span className="truncate">{row.getValue("clientName")}</span>
            </div>
          )
        },
        enableSorting: true,
      },
      {
        id: "vehicle",
        accessorFn: (row) => `${row.vehicle?.model} - ${row.vehicle?.plate}`,
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Veículo" />
        ),
        cell: ({ row }) => {
          const os = row.original
          return (
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-secondary text-secondary-foreground">
                <CarFront className="h-4 w-4" />
              </div>
              <div className="flex flex-col">
                <span className="font-semibold text-sm text-foreground truncate max-w-[150px]">{os.vehicle?.model || "---"}</span>
                <span className="text-xs font-mono text-muted-foreground uppercase">{os.vehicle?.plate || "---"}</span>
              </div>
            </div>
          )
        },
      },
      {
        accessorKey: "status",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Status" />
        ),
        cell: ({ row }) => {
          const status = row.getValue("status") as string
          const config = STATUS_CONFIG[status] || STATUS_CONFIG.OPEN
          return (
            <Badge variant="outline" className={`flex items-center w-fit px-2.5 py-0.5 rounded-full ${config.className}`}>
              {config.icon}
              <span className="font-semibold">{config.label}</span>
            </Badge>
          )
        },
        enableSorting: true,
      },
      {
        accessorKey: "finalValue",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Valor Total" className="justify-end text-right" />
        ),
        cell: ({ row }) => {
          const value = Number(row.getValue("finalValue") || 0)
          return (
            <div className="text-right font-medium text-foreground">
              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)}
            </div>
          )
        },
        enableSorting: true,
      },
      {
        accessorKey: "createdAt",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Data de Abertura" />
        ),
        cell: ({ row }) => {
          const dateStr = row.getValue("createdAt") as string
          return (
            <div className="flex items-center gap-2 text-muted-foreground text-sm">
              <Calendar className="h-4 w-4 shrink-0" />
              {dateStr ? new Date(dateStr).toLocaleDateString('pt-BR') : "---"}
            </div>
          )
        },
        enableSorting: true,
      },
      {
        id: "actions",
        cell: ({ row }) => (
          <div onClick={(e) => e.stopPropagation()}>
             <DataTableRowActions row={row} onEdit={onEdit} onDelete={onDelete} />
          </div>
        ),
      },
    ],
    [onEdit, onDelete]
  )

  return (
    <DataTableCore
      tableId="service-orders-table"
      columns={columns}
      data={data}
      isLoading={isLoading}
      searchKey="number"
      onRowClick={onRowClick}
    />
  )
}
