import React, { useRef } from "react"
import { flexRender } from "@tanstack/react-table"
import { useVirtualizer } from "@tanstack/react-virtual"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Skeleton } from "@/components/ui/skeleton"

import { useDataTable } from "./useDataTable"
import type { DataTableProps } from "./types"
import { DataTableToolbar } from "../parts/DataTableToolbar"
import { DataTablePagination } from "../parts/DataTablePagination"
import { DATA_TABLE_ROW_HEIGHT, DATA_TABLE_OVERSCAN } from "./constants"

import { useSecureTableConfig } from "./security/useSecureTableConfig"
import type { SecureColumn } from "./security/types"

export function DataTableCore<TData, TValue>({
  tableId,
  columns,
  data,
  pageCount,
  isLoading,
  searchKey,
  toolbarActions,
  onRowClick,
  manualPagination,
  manualFiltering,
  manualSorting,
}: DataTableProps<TData, TValue> & { 
  tableId: string
  columns: SecureColumn<TData>[]
  manualPagination?: boolean
  manualFiltering?: boolean
  manualSorting?: boolean
}) {
  const { secureColumns, isAuthorized } = useSecureTableConfig(columns as any)

  const table = useDataTable({
    tableId,
    data,
    columns: secureColumns as any,
    pageCount,
    manualPagination,
    manualFiltering,
    manualSorting,
  })

  if (!isAuthorized) {
    return (
      <div className="flex items-center justify-center h-48 bg-card rounded-xl border border-border">
        <p className="text-muted-foreground">Acesso negado ao contexto do Tenant.</p>
      </div>
    )
  }

  const tableContainerRef = useRef<HTMLDivElement>(null)

  const { rows } = table.getRowModel()

  const rowVirtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => tableContainerRef.current,
    estimateSize: () => DATA_TABLE_ROW_HEIGHT,
    overscan: DATA_TABLE_OVERSCAN,
  })

  return (
    <div className="flex flex-col h-full bg-card rounded-xl border border-border shadow-sm overflow-hidden">
      <DataTableToolbar
        table={table}
        tableId={tableId}
        searchKey={searchKey}
        toolbarActions={toolbarActions}
      />
      
      <div 
        ref={tableContainerRef}
        className="flex-1 overflow-auto bg-background/50"
      >
        <Table className="relative w-full border-collapse">
          <TableHeader className="sticky top-0 z-10 bg-card/90 backdrop-blur-md shadow-[0_1px_0_0_var(--border)]">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="border-b-0 hover:bg-transparent">
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead 
                      key={header.id} 
                      colSpan={header.colSpan}
                      style={{ width: header.getSize() }}
                      className="font-medium text-muted-foreground whitespace-nowrap px-4 py-3 h-[var(--header-height)]"
                    >
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  )
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 10 }).map((_, index) => (
                <TableRow key={`skeleton-${index}`}>
                  {secureColumns.map((col, colIndex) => (
                    <TableCell key={`skeleton-cell-${colIndex}`} className="p-4">
                      <Skeleton className="h-5 w-full rounded-md bg-muted/50" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : rows.length ? (
              <>
                {rowVirtualizer.getVirtualItems().length > 0 && rowVirtualizer.getVirtualItems()[0].start > 0 && (
                  <tr>
                    <td style={{ height: `${rowVirtualizer.getVirtualItems()[0].start}px` }} colSpan={secureColumns.length} />
                  </tr>
                )}
                {rowVirtualizer.getVirtualItems().map((virtualRow) => {
                  const row = rows[virtualRow.index]
                  return (
                    <TableRow
                      key={row.id}
                      data-state={row.getIsSelected() && "selected"}
                      onClick={() => onRowClick && onRowClick(row.original)}
                      className={`
                        border-b border-border/50 
                        transition-colors hover:bg-muted/30 
                        ${onRowClick ? 'cursor-pointer' : ''}
                      `}
                      style={{ height: `${virtualRow.size}px` }}
                    >
                      {row.getVisibleCells().map((cell) => (
                        <TableCell 
                          key={cell.id} 
                          className="p-4 align-middle truncate"
                          style={{ width: cell.column.getSize(), maxWidth: cell.column.getSize() }}
                        >
                          {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext()
                          )}
                        </TableCell>
                      ))}
                    </TableRow>
                  )
                })}
                {rowVirtualizer.getVirtualItems().length > 0 && (
                  <tr>
                    <td 
                      style={{ height: `${rowVirtualizer.getTotalSize() - rowVirtualizer.getVirtualItems()[rowVirtualizer.getVirtualItems().length - 1].end}px` }} 
                      colSpan={secureColumns.length} 
                    />
                  </tr>
                )}
              </>
            ) : (
              <TableRow>
                <TableCell
                  colSpan={secureColumns.length}
                  className="h-24 text-center text-muted-foreground"
                >
                  Nenhum registro encontrado.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <DataTablePagination table={table} />
    </div>
  )
}
