import React, { useMemo } from "react"
import type { ColumnDef } from "@tanstack/react-table"
import { Calendar, User, FileText } from "lucide-react"

import { DataTableCore } from "@/components/data-table/core/DataTableCore"
import { DataTableColumnHeader } from "@/components/data-table/parts/DataTableHeader"
import { DataTableRowActions } from "@/components/data-table/parts/DataTableRowActions"
import { InvoiceStatusBadge } from "./InvoiceStatusBadge"
import type { Invoice } from "../types/invoice.types"

interface InvoiceTableProps {
  data: Invoice[]
  isLoading: boolean
  onRowClick: (invoice: Invoice) => void
  onDelete?: (invoice: Invoice) => void
}

export function InvoiceTable({ data, isLoading, onRowClick, onDelete }: InvoiceTableProps) {
  const columns = useMemo<ColumnDef<Invoice>[]>(
    () => [
      {
        accessorKey: "invoiceNumber",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Fatura" />
        ),
        cell: ({ row }) => (
          <div className="flex items-center gap-2 font-mono font-medium">
            <FileText className="w-4 h-4 text-muted-foreground" />
            <span className="text-foreground">{row.getValue("invoiceNumber")}</span>
          </div>
        ),
        enableSorting: true,
      },
      {
        id: "client",
        accessorFn: (row) => row.client?.name || "Sem Cliente",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Cliente" />
        ),
        cell: ({ row }) => (
          <div className="flex items-center gap-2 text-foreground font-medium truncate max-w-[200px]">
            <User className="h-4 w-4 text-muted-foreground shrink-0" />
            <span className="truncate">{row.getValue("client")}</span>
          </div>
        ),
        enableSorting: true,
      },
      {
        id: "os",
        accessorFn: (row) => row.serviceOrderId,
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="OS Vinculada" />
        ),
        cell: ({ row }) => (
          <div className="text-muted-foreground font-mono text-xs uppercase">
            OS #{row.getValue("os")}
          </div>
        ),
        enableSorting: true,
      },
      {
        accessorKey: "status",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Status" />
        ),
        cell: ({ row }) => <InvoiceStatusBadge status={row.getValue("status")} />,
        enableSorting: true,
      },
      {
        accessorKey: "totalAmount",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Valor Total" className="justify-end text-right" />
        ),
        cell: ({ row }) => {
          const value = Number(row.getValue("totalAmount") || 0)
          return (
            <div className="text-right font-bold text-foreground">
              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)}
            </div>
          )
        },
        enableSorting: true,
      },
      {
        accessorKey: "createdAt",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Data de Emissão" />
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
             <DataTableRowActions row={row} onDelete={onDelete} />
          </div>
        ),
      },
    ],
    [onDelete]
  )

  return (
    <DataTableCore
      tableId="invoices-table"
      columns={columns}
      data={data}
      isLoading={isLoading}
      searchKey="invoiceNumber"
      onRowClick={onRowClick}
    />
  )
}
