import { useEffect, useMemo } from "react"
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
} from "@tanstack/react-table"
import type { ColumnDef } from "@tanstack/react-table"
import { useDataTableStore } from "./store"

export interface UseDataTableProps<TData, TValue> {
  tableId: string
  data: TData[]
  columns: ColumnDef<TData, TValue>[]
  pageCount?: number
  manualPagination?: boolean
  manualSorting?: boolean
  manualFiltering?: boolean
}

export function useDataTable<TData, TValue>({
  tableId,
  data,
  columns,
  pageCount,
  manualPagination = false,
  manualSorting = false,
  manualFiltering = false,
}: UseDataTableProps<TData, TValue>) {
  const store = useDataTableStore()
  
  useEffect(() => {
    store.initTable(tableId)
  }, [tableId]) // eslint-disable-line

  const state = store.tables[tableId] || {
    sorting: [],
    columnFilters: [],
    columnVisibility: {},
    rowSelection: {},
    globalFilter: "",
  }

  const table = useReactTable({
    data,
    columns,
    state,
    pageCount,
    manualPagination,
    manualSorting,
    manualFiltering,
    enableRowSelection: true,
    onRowSelectionChange: (updater) => store.setRowSelection(tableId, updater),
    onSortingChange: (updater) => store.setSorting(tableId, updater),
    onColumnFiltersChange: (updater) => store.setColumnFilters(tableId, updater),
    onColumnVisibilityChange: (updater) => store.setColumnVisibility(tableId, updater),
    onGlobalFilterChange: (updater) => store.setGlobalFilter(tableId, updater as string),
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
  })

  return table
}
