import React from 'react'
import { AlertTriangle, PackageX, PackageMinus } from 'lucide-react'
import type { InventoryItem } from '../types/inventory.types'

interface StockAlertBannerProps {
  items: InventoryItem[]
}

export function StockAlertBanner({ items }: StockAlertBannerProps) {
  const outOfStock = items.filter(i => i.status === 'OUT_OF_STOCK').length
  const critical = items.filter(i => i.status === 'CRITICAL').length
  const lowStock = items.filter(i => i.status === 'LOW').length

  if (outOfStock === 0 && critical === 0 && lowStock === 0) return null

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
      <div className="flex items-center gap-4 p-4 rounded-xl border border-red-500/20 bg-red-500/10">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-red-500/20 text-red-500">
          <PackageX className="h-5 w-5" />
        </div>
        <div>
          <p className="text-sm font-medium text-red-500">Estoque Zerado</p>
          <p className="text-2xl font-bold text-foreground">{outOfStock}</p>
        </div>
      </div>
      
      <div className="flex items-center gap-4 p-4 rounded-xl border border-orange-500/20 bg-orange-500/10">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-orange-500/20 text-orange-500">
          <AlertTriangle className="h-5 w-5" />
        </div>
        <div>
          <p className="text-sm font-medium text-orange-500">Crítico</p>
          <p className="text-2xl font-bold text-foreground">{critical}</p>
        </div>
      </div>

      <div className="flex items-center gap-4 p-4 rounded-xl border border-yellow-500/20 bg-yellow-500/10">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-yellow-500/20 text-yellow-500">
          <PackageMinus className="h-5 w-5" />
        </div>
        <div>
          <p className="text-sm font-medium text-yellow-500">Baixo Estoque</p>
          <p className="text-2xl font-bold text-foreground">{lowStock}</p>
        </div>
      </div>
    </div>
  )
}
