import { useMemo } from 'react'
import type { SecureColumn } from './types'
import { useVisibilityResolver } from './visibilityResolver'

export function useColumnGuard<T>(columns: SecureColumn<T>[]) {
  const { resolve } = useVisibilityResolver()

  return useMemo(() => {
    return columns.filter(col => {
      const visibility = resolve(col.requiredPermission, col.hiddenIfUnauthorized ?? true)
      return visibility === 'ALLOW' || visibility === 'DISABLE'
    }).map(col => {
      const visibility = resolve(col.requiredPermission, col.hiddenIfUnauthorized ?? true)
      if (visibility === 'DISABLE') {
        // Here we could mask or disable rendering of cells if we chose to,
        // but hiding the entire column is usually safer in DataTables.
        // For disabled columns, we'll return a stub cell.
        return {
          ...col,
          cell: () => '***' // Masked data
        }
      }
      return col
    })
  }, [columns, resolve])
}
