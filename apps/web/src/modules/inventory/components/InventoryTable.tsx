import React, { useMemo } from "react"
import type { ColumnDef } from "@tanstack/react-table"
import { Package, Hash, Tag, AlertTriangle } from "lucide-react"

import { DataTableCore } from "@/components/data-table/core/DataTableCore"
import { DataTableColumnHeader } from "@/components/data-table/parts/DataTableHeader"
import { DataTableRowActions } from "@/components/data-table/parts/DataTableRowActions"
import { Badge } from "@/components/ui/badge"
import type { InventoryItem } from "../types/inventory.types"

interface InventoryTableProps {
  data: InventoryItem[]
  isLoading: boolean
  onRowClick?: (item: InventoryItem) => void
  onEdit?: (item: InventoryItem) => void
  onDelete?: (item: InventoryItem) => void
  onTransfer?: (item: InventoryItem) => void
}

export function InventoryTable({ data, isLoading, onRowClick, onEdit, onDelete, onTransfer }: InventoryTableProps) {
  const columns = useMemo<ColumnDef<InventoryItem>[]>(
    () => [
      {
        accessorKey: "name",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Peça" />
        ),
        cell: ({ row }) => {
          const item = row.original
          return (
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-secondary text-secondary-foreground">
                <Package className="h-5 w-5" />
              </div>
              <div className="flex flex-col">
                <span className="font-semibold text-foreground truncate max-w-[200px]">{item.name}</span>
                <span className="text-xs text-muted-foreground truncate max-w-[200px] font-mono">{item.internalCode}</span>
              </div>
            </div>
          )
        },
        enableSorting: true,
      },
      {
        accessorKey: "category",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Categoria" />
        ),
        cell: ({ row }) => {
          return (
            <div className="flex items-center gap-2 text-muted-foreground text-sm">
              <Tag className="w-4 h-4" />
              {row.getValue("category") || "---"}
            </div>
          )
        },
        enableSorting: true,
      },
      {
        accessorKey: "salePrice",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Preço de Venda" className="justify-end text-right" />
        ),
        cell: ({ row }) => {
          const value = Number(row.getValue("salePrice") || 0)
          return (
            <div className="text-right font-medium text-foreground">
              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)}
            </div>
          )
        },
        enableSorting: true,
      },
      {
        accessorKey: "totalQuantity",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Estoque" className="justify-center text-center" />
        ),
        cell: ({ row }) => {
          const item = row.original
          const isLow = item.status === 'LOW' || item.status === 'CRITICAL' || item.status === 'OUT_OF_STOCK'
          
          let colorClass = "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
          if (item.status === 'LOW') colorClass = "bg-yellow-500/10 text-yellow-500 border-yellow-500/20"
          if (item.status === 'CRITICAL') colorClass = "bg-orange-500/10 text-orange-500 border-orange-500/20"
          if (item.status === 'OUT_OF_STOCK') colorClass = "bg-red-500/10 text-red-500 border-red-500/20"

          return (
            <div className="flex justify-center">
              <Badge variant="outline" className={`flex items-center gap-1.5 px-3 py-0.5 rounded-full font-mono text-sm ${colorClass}`}>
                {isLow && <AlertTriangle className="w-3 h-3" />}
                {item.totalQuantity}
              </Badge>
            </div>
          )
        },
        enableSorting: true,
      },
      {
        id: "actions",
        cell: ({ row }) => (
          <div onClick={(e) => e.stopPropagation()}>
            <DataTableRowActions 
              row={row} 
              onEdit={onEdit} 
              onDelete={onDelete} 
              extraActions={[
                { label: "Transferir Filial", onClick: () => onTransfer?.(row.original) }
              ]} 
            />
          </div>
        ),
      },
    ],
    [onEdit, onDelete, onTransfer]
  )

  return (
    <DataTableCore
      tableId="inventory-table"
      columns={columns}
      data={data}
      isLoading={isLoading}
      searchKey="name"
      onRowClick={onRowClick}
    />
  )
}
