import React, { useState } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { Plus, Search, FileText, ChevronRight } from 'lucide-react';
import { DataTable } from '../../../components/DataTable';
import { useServiceOrders } from '../hooks/useServiceOrders';
import { ServiceOrder, ServiceOrderStatus } from '../types';
import { Link } from 'react-router-dom';

const statusMap: Record<ServiceOrderStatus, { label: string; color: string }> = {
  OPEN: { label: 'Aberta', color: 'bg-blue-100 text-blue-700 border-blue-200' },
  IN_PROGRESS: { label: 'Em Execução', color: 'bg-yellow-100 text-yellow-700 border-yellow-200' },
  COMPLETED: { label: 'Concluída', color: 'bg-green-100 text-green-700 border-green-200' },
  CANCELED: { label: 'Cancelada', color: 'bg-red-100 text-red-700 border-red-200' },
};

export default function ServiceOrderList() {
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({});

  const { data, isLoading } = useServiceOrders(page, 10, filters);

  const columns: ColumnDef<ServiceOrder>[] = [
    {
      accessorKey: 'number',
      header: 'OS #',
      cell: ({ row }) => (
        <div className="font-bold text-slate-900">
          {String(row.getValue('number')).padStart(5, '0')}
        </div>
      ),
    },
    {
      id: 'client',
      header: 'Cliente',
      cell: ({ row }) => row.original.client.name,
    },
    {
      id: 'vehicle',
      header: 'Veículo',
      cell: ({ row }) => (
        <div className="flex flex-col">
          <span className="font-medium text-slate-700">{row.original.vehicle.model}</span>
          <span className="text-xs font-mono text-slate-400">{row.original.vehicle.plate}</span>
        </div>
      ),
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => {
        const status = row.getValue('status') as ServiceOrderStatus;
        const config = statusMap[status];
        return (
          <span className={`px-2 py-1 rounded-full text-xs font-bold border ${config.color}`}>
            {config.label}
          </span>
        );
      },
    },
    {
      accessorKey: 'finalValue',
      header: 'Valor Total',
      cell: ({ row }) => (
        <div className="font-semibold text-slate-900">
          {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(row.getValue('finalValue'))}
        </div>
      ),
    },
    {
      id: 'actions',
      cell: ({ row }) => (
        <div className="flex justify-end">
          <Link 
            to={`/service-orders/${row.original.id}`}
            className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
          >
            <ChevronRight size={20} />
          </Link>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 text-indigo-900">Ordens de Serviço</h1>
          <p className="text-slate-500">Acompanhe e gerencie todos os trabalhos da oficina.</p>
        </div>
        <Link 
          to="/service-orders/new"
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg font-semibold flex items-center gap-2 hover:bg-indigo-700 transition-colors shadow-sm"
        >
          <Plus size={20} />
          Nova OS
        </Link>
      </div>

      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            type="text"
            placeholder="Buscar por OS, cliente ou placa..."
            className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
          />
        </div>
        <select className="px-4 py-2 rounded-lg border border-slate-200 bg-white text-slate-600 outline-none">
          <option value="">Todos os Status</option>
          <option value="OPEN">Abertas</option>
          <option value="IN_PROGRESS">Em Execução</option>
          <option value="COMPLETED">Concluídas</option>
        </select>
      </div>

      <DataTable 
        columns={columns} 
        data={data?.data || []} 
        loading={isLoading} 
      />
    </div>
  );
}
