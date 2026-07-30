import React, { useState } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { History, ArrowUpRight, ArrowDownRight, RefreshCw, AlertCircle } from 'lucide-react';
import { DataTable } from '../../../components/DataTable';
import { useStockMovements } from '../hooks/useStock';
import { StockMovement, MovementType } from '../types';

export default function MovementHistory() {
  const [page, setPage] = useState(1);
  const { data, isLoading } = useStockMovements(page, 20);

  const columns: ColumnDef<StockMovement>[] = [
    {
      accessorKey: 'createdAt',
      header: 'Data / Hora',
      cell: ({ row }) => new Date(row.getValue('createdAt')).toLocaleString('pt-BR'),
    },
    {
      id: 'type',
      header: 'Tipo',
      cell: ({ row }) => {
        const type = row.original.type;
        const config: Record<MovementType, { label: string; color: string; icon: any }> = {
          IN: { label: 'Entrada', color: 'text-emerald-600 bg-emerald-50 border-emerald-100', icon: ArrowUpRight },
          OUT: { label: 'Saída', color: 'text-red-600 bg-red-50 border-red-100', icon: ArrowDownRight },
          ADJUSTMENT: { label: 'Ajuste', color: 'text-amber-600 bg-amber-50 border-amber-100', icon: AlertCircle },
          TRANSFER: { label: 'Transferência', color: 'text-blue-600 bg-blue-50 border-blue-100', icon: RefreshCw },
          RETURN: { label: 'Devolução', color: 'text-indigo-600 bg-indigo-50 border-indigo-100', icon: ArrowUpRight },
        };
        const active = config[type];
        return (
          <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs font-bold border ${active.color}`}>
            <active.icon size={14} /> {active.label}
          </span>
        );
      },
    },
    {
      accessorKey: 'part.name',
      header: 'Peça',
      cell: ({ row }) => <span className="font-bold text-slate-900">{row.original.part.name}</span>,
    },
    {
      accessorKey: 'quantity',
      header: 'Quantidade',
      cell: ({ row }) => (
        <span className={`font-mono font-bold ${row.original.type === 'IN' ? 'text-emerald-600' : 'text-red-600'}`}>
          {row.original.type === 'IN' ? '+' : '-'}{row.getValue('quantity')}
        </span>
      ),
    },
    {
      id: 'user',
      header: 'Operador',
      cell: ({ row }) => row.original.user.name,
    },
    {
      accessorKey: 'reason',
      header: 'Motivo / Origem',
      cell: ({ row }) => <span className="text-slate-500 italic">{row.getValue('reason') || '-'}</span>,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
            <History className="text-indigo-600" /> Histórico de Movimentações
          </h1>
          <p className="text-slate-500">Rastreabilidade completa de todas as entradas e saídas de estoque.</p>
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
