import React, { useMemo } from "react"
import type { ColumnDef } from "@tanstack/react-table"
import { Calendar, User, CarFront } from "lucide-react"

import { DataTableCore } from "@/components/data-table/core/DataTableCore"
import { DataTableColumnHeader } from "@/components/data-table/parts/DataTableHeader"
import { DataTableRowActions } from "@/components/data-table/parts/DataTableRowActions"
import { ServiceOrderStatusBadge } from "./ServiceOrderStatusBadge"
import type { ServiceOrder } from "../types/serviceOrder.types"

interface ServiceOrderTableProps {
  data: ServiceOrder[]
  isLoading: boolean
  onRowClick: (os: ServiceOrder) => void
  onEdit?: (os: ServiceOrder) => void
  onDelete?: (os: ServiceOrder) => void
}

export function ServiceOrderTable({ data, isLoading, onRowClick, onEdit, onDelete }: ServiceOrderTableProps) {
  const columns = useMemo<ColumnDef<ServiceOrder>[]>(
    () => [
      {
        accessorKey: "number",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Nº OS" />
        ),
        cell: ({ row }) => (
          <div className="flex items-center gap-2 font-mono font-medium">
            <span className="text-muted-foreground">#</span>
            <span className="text-foreground">{String(row.getValue("number")).padStart(4, '0')}</span>
          </div>
        ),
        enableSorting: true,
      },
      {
        id: "clientName",
        accessorFn: (row) => row.client?.name || "Sem Cliente",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Cliente" />
        ),
        cell: ({ row }) => (
          <div className="flex items-center gap-2 text-foreground font-medium truncate max-w-[200px]">
            <User className="h-4 w-4 text-muted-foreground shrink-0" />
            <span className="truncate">{row.getValue("clientName")}</span>
          </div>
        ),
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
        cell: ({ row }) => <ServiceOrderStatusBadge status={row.getValue("status")} />,
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
