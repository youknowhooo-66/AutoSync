import type { ColumnDef, SortingState, ColumnFiltersState, VisibilityState, RowSelectionState } from "@tanstack/react-table"

export interface BulkAction<TData> {
  label: string
  action: (rows: TData[]) => void
  icon?: React.ReactNode
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link"
}

export interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
  pageCount?: number
  isLoading?: boolean
  searchKey?: string // Key to search by default
  toolbarActions?: React.ReactNode
  onRowClick?: (row: TData) => void
  bulkActions?: BulkAction<TData>[]
}
