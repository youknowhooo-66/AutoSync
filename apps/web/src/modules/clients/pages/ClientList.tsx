import React, { useState } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { Plus, Search, MoreHorizontal, Eye, Trash2 } from 'lucide-react';
import { DataTable } from '../../../components/DataTable';
import { useClients, useDeleteClient } from '../hooks/useClients';
import { Client } from '../types';
import { CreateClientModal } from '../components/CreateClientModal';

export default function ClientList() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { data, isLoading } = useClients(page, 10, search);
  const { mutate: deleteClient } = useDeleteClient();

  const columns: ColumnDef<Client>[] = [
    {
      accessorKey: 'name',
      header: 'Nome',
      cell: ({ row }) => (
        <div className="font-medium text-slate-900">{row.getValue('name')}</div>
      ),
    },
    {
      accessorKey: 'email',
      header: 'E-mail',
    },
    {
      accessorKey: 'phone',
      header: 'Telefone',
      cell: ({ row }) => row.getValue('phone') || '-',
    },
    {
      accessorKey: 'createdAt',
      header: 'Desde',
      cell: ({ row }) => new Date(row.getValue('createdAt')).toLocaleDateString('pt-BR'),
    },
    {
      id: 'actions',
      cell: ({ row }) => (
        <div className="flex items-center justify-end gap-2">
          <button 
            className="p-1 text-slate-400 hover:text-indigo-600 transition-colors"
            title="Visualizar"
          >
            <Eye size={18} />
          </button>
          <button 
            className="p-1 text-slate-400 hover:text-red-600 transition-colors"
            onClick={() => {
              if (confirm('Deseja realmente excluir este cliente?')) {
                deleteClient(row.original.id);
              }
            }}
            title="Excluir"
          >
            <Trash2 size={18} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Clientes</h1>
          <p className="text-slate-500">Gerencie sua base de clientes e históricos.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg font-semibold flex items-center gap-2 hover:bg-indigo-700 transition-colors shadow-sm"
        >
          <Plus size={20} />
          Novo Cliente
        </button>
      </div>

      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            type="text"
            placeholder="Buscar por nome ou e-mail..."
            className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <DataTable 
        columns={columns} 
        data={data?.data || []} 
        loading={isLoading} 
      />

      <CreateClientModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
      />
    </div>
  );
}
