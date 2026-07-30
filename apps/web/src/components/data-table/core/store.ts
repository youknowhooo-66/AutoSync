import { create } from "zustand"
import type { SortingState, ColumnFiltersState, VisibilityState, RowSelectionState } from "@tanstack/react-table"

export interface TableState {
  sorting: SortingState
  columnFilters: ColumnFiltersState
  columnVisibility: VisibilityState
  rowSelection: RowSelectionState
  globalFilter: string
}

const defaultTableState: TableState = {
  sorting: [],
  columnFilters: [],
  columnVisibility: {},
  rowSelection: {},
  globalFilter: "",
}

interface DataTableStore {
  tables: Record<string, TableState>
  initTable: (tableId: string) => void
  setSorting: (tableId: string, sorting: SortingState | ((old: SortingState) => SortingState)) => void
  setColumnFilters: (tableId: string, filters: ColumnFiltersState | ((old: ColumnFiltersState) => ColumnFiltersState)) => void
  setColumnVisibility: (tableId: string, visibility: VisibilityState | ((old: VisibilityState) => VisibilityState)) => void
  setRowSelection: (tableId: string, selection: RowSelectionState | ((old: RowSelectionState) => RowSelectionState)) => void
  setGlobalFilter: (tableId: string, filter: string) => void
  resetFilters: (tableId: string) => void
}

export const useDataTableStore = create<DataTableStore>((set, get) => ({
  tables: {},
  initTable: (tableId) => {
    if (!get().tables[tableId]) {
      set((state) => ({
        tables: {
          ...state.tables,
          [tableId]: { ...defaultTableState },
        },
      }))
    }
  },
  setSorting: (tableId, sorting) => set((state) => {
    const table = state.tables[tableId] || { ...defaultTableState }
    const newSorting = typeof sorting === 'function' ? sorting(table.sorting) : sorting
    return { tables: { ...state.tables, [tableId]: { ...table, sorting: newSorting } } }
  }),
  setColumnFilters: (tableId, filters) => set((state) => {
    const table = state.tables[tableId] || { ...defaultTableState }
    const newFilters = typeof filters === 'function' ? filters(table.columnFilters) : filters
    return { tables: { ...state.tables, [tableId]: { ...table, columnFilters: newFilters } } }
  }),
  setColumnVisibility: (tableId, visibility) => set((state) => {
    const table = state.tables[tableId] || { ...defaultTableState }
    const newVis = typeof visibility === 'function' ? visibility(table.columnVisibility) : visibility
    return { tables: { ...state.tables, [tableId]: { ...table, columnVisibility: newVis } } }
  }),
  setRowSelection: (tableId, selection) => set((state) => {
    const table = state.tables[tableId] || { ...defaultTableState }
    const newSel = typeof selection === 'function' ? selection(table.rowSelection) : selection
    return { tables: { ...state.tables, [tableId]: { ...table, rowSelection: newSel } } }
  }),
  setGlobalFilter: (tableId, filter) => set((state) => {
    const table = state.tables[tableId] || { ...defaultTableState }
    return { tables: { ...state.tables, [tableId]: { ...table, globalFilter: filter } } }
  }),
  resetFilters: (tableId) => set((state) => {
    const table = state.tables[tableId] || { ...defaultTableState }
    return {
      tables: {
        ...state.tables,
        [tableId]: {
          ...table,
          columnFilters: [],
          globalFilter: "",
          sorting: [],
        },
      },
    }
  }),
}))
