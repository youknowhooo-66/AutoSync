import React from "react"
import type { Table } from "@tanstack/react-table"
import { X, Settings2, Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useDataTableStore } from "../core/store"

interface DataTableToolbarProps<TData> {
  table: Table<TData>
  tableId: string
  searchKey?: string
  toolbarActions?: React.ReactNode
}

export function DataTableToolbar<TData>({
  table,
  tableId,
  searchKey,
  toolbarActions,
}: DataTableToolbarProps<TData>) {
  const isFiltered = table.getState().columnFilters.length > 0 || table.getState().globalFilter
  const { resetFilters } = useDataTableStore()

  return (
    <div className="flex items-center justify-between p-4 bg-card border-b border-border/50">
      <div className="flex flex-1 items-center space-x-2">
        <div className="relative w-[250px] lg:w-[350px]">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar..."
            value={table.getState().globalFilter ?? ""}
            onChange={(event) => table.setGlobalFilter(event.target.value)}
            className="pl-9 bg-background border-border/50 shadow-sm transition-all focus:ring-2 focus:ring-primary/20"
          />
        </div>
        
        {isFiltered && (
          <Button
            variant="ghost"
            onClick={() => resetFilters(tableId)}
            className="h-9 px-3 text-muted-foreground hover:text-foreground"
          >
            Limpar
            <X className="ml-2 h-4 w-4" />
          </Button>
        )}
      </div>

      <div className="flex items-center space-x-2">
        {toolbarActions}
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="ml-auto hidden h-9 md:flex bg-background shadow-sm border-border/50"
            >
              <Settings2 className="mr-2 h-4 w-4" />
              Colunas
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-[150px]">
            <DropdownMenuLabel>Alternar colunas</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {table
              .getAllColumns()
              .filter(
                (column) =>
                  typeof column.accessorFn !== "undefined" && column.getCanHide()
              )
              .map((column) => {
                return (
                  <DropdownMenuCheckboxItem
                    key={column.id}
                    className="capitalize"
                    checked={column.getIsVisible()}
                    onCheckedChange={(value) => column.toggleVisibility(!!value)}
                  >
                    {typeof column.columnDef.header === 'string' ? column.columnDef.header : column.id}
                  </DropdownMenuCheckboxItem>
                )
              })}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  )
}
