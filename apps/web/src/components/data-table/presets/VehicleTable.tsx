import React, { useMemo } from "react"
import type { ColumnDef } from "@tanstack/react-table"
import { CarFront, User } from "lucide-react"

import { DataTableCore } from "../core/DataTableCore"
import { DataTableColumnHeader } from "../parts/DataTableHeader"
import { DataTableRowActions } from "../parts/DataTableRowActions"
import { Badge } from "@/components/ui/badge"

export interface Vehicle {
  id: string
  plate: string
  model: string
  brand: string
  year: number
  chassis: string
  mileage: number
  engine: string
  clientId: string
  client?: { name: string }
}

interface VehicleTableProps {
  data: Vehicle[]
  isLoading: boolean
  onEdit: (vehicle: Vehicle) => void
  onDelete?: (vehicle: Vehicle) => void
}

export function VehicleTable({ data, isLoading, onEdit, onDelete }: VehicleTableProps) {
  const columns = useMemo<ColumnDef<Vehicle>[]>(
    () => [
      {
        accessorKey: "model",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Veículo" />
        ),
        cell: ({ row }) => {
          const vehicle = row.original
          return (
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <CarFront className="h-5 w-5" />
              </div>
              <div className="flex flex-col">
                <span className="font-semibold text-foreground truncate max-w-[200px]">{vehicle.model}</span>
                <span className="text-xs text-muted-foreground truncate max-w-[200px]">{vehicle.brand}</span>
              </div>
            </div>
          )
        },
        enableSorting: true,
        enableHiding: false,
      },
      {
        accessorKey: "plate",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Placa" />
        ),
        cell: ({ row }) => {
          return (
            <Badge variant="outline" className="font-mono text-sm tracking-widest bg-secondary text-secondary-foreground border-border/50 uppercase">
              {row.getValue("plate")}
            </Badge>
          )
        },
        enableSorting: true,
      },
      {
        accessorKey: "year",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Ano" />
        ),
        cell: ({ row }) => {
          return <span className="text-muted-foreground font-medium">{row.getValue("year")}</span>
        },
        enableSorting: true,
      },
      {
        id: "clientName",
        accessorFn: (row) => row.client?.name || "Sem Proprietário",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Proprietário" />
        ),
        cell: ({ row }) => {
          return (
            <div className="flex items-center gap-2 text-foreground font-medium truncate max-w-[200px]">
              <User className="h-4 w-4 text-muted-foreground" />
              {row.getValue("clientName")}
            </div>
          )
        },
        enableSorting: true,
      },
      {
        id: "actions",
        cell: ({ row }) => <DataTableRowActions row={row} onEdit={onEdit} onDelete={onDelete} />,
      },
    ],
    [onEdit, onDelete]
  )

  return (
    <DataTableCore
      tableId="vehicles-table"
      columns={columns}
      data={data}
      isLoading={isLoading}
      searchKey="model"
    />
  )
}
