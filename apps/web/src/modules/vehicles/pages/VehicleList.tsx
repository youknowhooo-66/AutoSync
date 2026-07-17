import React, { useState } from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import { Plus, Search, Pencil, Trash2 } from 'lucide-react';
import { DataTable } from '../../../components/DataTable';
import { useVehicles, useDeleteVehicle } from '../hooks/useVehicles';
import type { Vehicle } from '../types';
import { CreateVehicleModal } from '../components/CreateVehicleModal';

export default function VehicleList() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);

  const { data, isLoading } = useVehicles(page, 10, search);
  const { mutate: deleteVehicle } = useDeleteVehicle();

  // Local filtering to support real-time user search across fetched vehicle dataset
  const filteredData = React.useMemo(() => {
    if (!data) return [];
    return data.filter(v =>
      v.plate.toLowerCase().includes(search.toLowerCase()) ||
      v.brand.toLowerCase().includes(search.toLowerCase()) ||
      v.model.toLowerCase().includes(search.toLowerCase()) ||
      (v.client?.name && v.client.name.toLowerCase().includes(search.toLowerCase()))
    );
  }, [data, search]);

  const columns: ColumnDef<Vehicle>[] = [
    {
      accessorKey: 'plate',
      header: 'Placa',
      cell: ({ row }) => (
        <div className="font-mono font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded border border-indigo-100 inline-block">
          {row.getValue('plate')}
        </div>
      ),
    },
    {
      accessorKey: 'brand',
      header: 'Marca',
    },
    {
      accessorKey: 'model',
      header: 'Modelo',
    },
    {
      accessorKey: 'year',
      header: 'Ano',
    },
    {
      id: 'client',
      header: 'Proprietário',
      cell: ({ row }) => row.original.client?.name || '-',
    },
    {
      id: 'actions',
      cell: ({ row }) => (
        <div className="flex items-center justify-end gap-2">
          <button 
            className="p-1 text-slate-400 hover:text-indigo-600 transition-colors"
            onClick={() => {
              setEditingVehicle(row.original);
              setIsModalOpen(true);
            }}
            title="Editar"
          >
            <Pencil size={18} />
          </button>
          <button 
            className="p-1 text-slate-400 hover:text-red-600 transition-colors"
            onClick={() => {
              if (confirm('Deseja realmente excluir este veículo?')) {
                deleteVehicle(row.original.id);
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
          <h1 className="text-2xl font-bold text-slate-900">Veículos</h1>
          <p className="text-slate-500">Gerencie a frota de veículos dos seus clientes.</p>
        </div>
        <button 
          onClick={() => {
            setEditingVehicle(null);
            setIsModalOpen(true);
          }}
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg font-semibold flex items-center gap-2 hover:bg-indigo-700 transition-colors shadow-sm"
        >
          <Plus size={20} />
          Novo Veículo
        </button>
      </div>

      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            type="text"
            placeholder="Buscar por placa, marca ou modelo..."
            className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <DataTable 
        columns={columns} 
        data={filteredData} 
        loading={isLoading} 
      />

      <CreateVehicleModal 
        isOpen={isModalOpen} 
        onClose={() => {
          setIsModalOpen(false);
          setEditingVehicle(null);
        }} 
        editingVehicle={editingVehicle}
      />
    </div>
  );
}
