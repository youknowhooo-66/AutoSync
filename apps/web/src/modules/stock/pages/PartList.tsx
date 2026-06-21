import React, { useState } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { Search, Plus, Package, Edit, BarChart3 } from 'lucide-react';
import { DataTable } from '../../../components/DataTable';
import { useStock } from '../hooks/useStock';
import { StockItem } from '../types';
import { StockStatusBadge } from '../components/StockStatusBadge';

export default function PartList() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');

  const { data, isLoading } = useStock(page, 10, search);

  const columns: ColumnDef<StockItem>[] = [
    {
      accessorKey: 'part.name',
      header: 'Peça / Insumo',
      cell: ({ row }) => (
        <div className="flex flex-col">
          <span className="font-bold text-slate-900">{row.original.part.name}</span>
          <span className="text-xs font-mono text-slate-400">{row.original.part.sku}</span>
        </div>
      ),
    },
    {
      accessorKey: 'quantity',
      header: 'Estoque Atual',
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <span className="font-bold text-slate-900">{row.getValue('quantity')}</span>
          <span className="text-xs text-slate-400">unid.</span>
        </div>
      ),
    },
    {
      id: 'status',
      header: 'Status',
      cell: ({ row }) => (
        <StockStatusBadge 
          quantity={row.original.quantity} 
          min={row.original.minimumStock} 
        />
      ),
    },
    {
      accessorKey: 'part.price',
      header: 'Preço Unitário',
      cell: ({ row }) => (
        <div className="font-semibold text-slate-900">
          {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(row.original.part.price)}
        </div>
      ),
    },
    {
      id: 'actions',
      cell: ({ row }) => (
        <div className="flex items-center justify-end gap-2">
          <button 
            className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
            title="Ver Detalhes"
          >
            <BarChart3 size={18} />
          </button>
          <button 
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-all"
            title="Editar"
          >
            <Edit size={18} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Estoque de Peças</h1>
          <p className="text-slate-500">Controle total de peças, insumos e mercadorias.</p>
        </div>
        <button className="bg-indigo-600 text-white px-4 py-2 rounded-lg font-semibold flex items-center gap-2 hover:bg-indigo-700 transition-colors shadow-sm">
          <Plus size={20} />
          Cadastrar Peça
        </button>
      </div>

      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            type="text"
            placeholder="Buscar por nome ou SKU..."
            className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          <button className="px-4 py-2 bg-white border border-slate-200 text-slate-600 text-sm font-semibold rounded-lg hover:bg-slate-50 transition-all flex items-center gap-2">
            <Package size={16} /> Todos
          </button>
          <button className="px-4 py-2 bg-amber-50 border border-amber-200 text-amber-700 text-sm font-semibold rounded-lg hover:bg-amber-100 transition-all flex items-center gap-2">
            <TrendingDown size={16} /> Estoque Baixo
          </button>
        </div>
      </div>

      <DataTable 
        columns={columns} 
        data={data?.data || []} 
        loading={isLoading} 
      />
    </div>
  );
}
