import React, { useState } from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import { Plus, Search, Pencil, Trash2 } from 'lucide-react';
import { DataTable } from '../../../components/DataTable';
import { useVehicles, useDeleteVehicle } from '../hooks/useVehicles';
import type { Vehicle } from '../types';
import { CreateVehicleModal } from '../components/CreateVehicleModal';
import { Page, PageHeader } from '@/components/primitives';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function VehicleList() {
  const [page] = useState(1);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);

  const { data, isLoading } = useVehicles(page, 100, search);
  const { mutate: deleteVehicle } = useDeleteVehicle();

  const filteredData = React.useMemo(() => {
    if (!data) return [];
    return data.filter(
      (v) =>
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
        <div className="font-mono font-bold text-primary bg-primary/10 px-2 py-1 rounded border border-primary/20 inline-block text-xs uppercase tracking-wider">
          {row.getValue('plate')}
        </div>
      ),
    },
    {
      accessorKey: 'brand',
      header: 'Marca',
      cell: ({ row }) => <span className="font-medium text-foreground">{row.getValue('brand')}</span>,
    },
    {
      accessorKey: 'model',
      header: 'Modelo',
      cell: ({ row }) => <span className="font-medium text-foreground">{row.getValue('model')}</span>,
    },
    {
      accessorKey: 'year',
      header: 'Ano',
      cell: ({ row }) => <span className="text-muted-foreground font-mono">{row.getValue('year')}</span>,
    },
    {
      id: 'client',
      header: 'Proprietário',
      cell: ({ row }) => <span className="text-muted-foreground">{row.original.client?.name || '-'}</span>,
    },
    {
      id: 'actions',
      cell: ({ row }) => (
        <div className="flex items-center justify-end gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-primary"
            onClick={() => {
              setEditingVehicle(row.original);
              setIsModalOpen(true);
            }}
            title="Editar"
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-danger"
            onClick={() => {
              if (confirm('Deseja realmente excluir este veículo?')) {
                deleteVehicle(row.original.id);
              }
            }}
            title="Excluir"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <Page>
      <PageHeader
        title="Veículos"
        description="Gerencie a frota de veículos dos seus clientes."
        actions={
          <Button
            onClick={() => {
              setEditingVehicle(null);
              setIsModalOpen(true);
            }}
            size="lg"
            className="shadow-xs font-semibold text-xs uppercase tracking-wider"
          >
            <Plus className="mr-2 h-4 w-4" />
            Novo Veículo
          </Button>
        }
      />

      <div className="bg-card p-4 rounded-xl border border-border shadow-xs flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            type="text"
            placeholder="Buscar por placa, marca ou modelo..."
            className="pl-9 h-10 text-xs"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <DataTable columns={columns} data={filteredData} loading={isLoading} />

      <CreateVehicleModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingVehicle(null);
        }}
        editingVehicle={editingVehicle}
      />
    </Page>
  );
}
