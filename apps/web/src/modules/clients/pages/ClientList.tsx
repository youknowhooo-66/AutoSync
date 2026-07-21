import React, { useState } from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import { Plus, Search, Pencil, Trash2, User as UserIcon } from 'lucide-react';
import { DataTable } from '../../../components/DataTable';
import { useClients, useDeleteClient } from '../hooks/useClients';
import type { Client } from '../types';
import { CreateClientModal } from '../components/CreateClientModal';
import { Page, PageHeader } from '@/components/primitives';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function ClientList() {
  const [page] = useState(1);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);

  const { data, isLoading } = useClients(page, 100, search);
  const { mutate: deleteClient } = useDeleteClient();

  const filteredData = React.useMemo(() => {
    if (!data) return [];
    return data.filter(
      (c) =>
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        (c.email && c.email.toLowerCase().includes(search.toLowerCase())) ||
        (c.document && c.document.includes(search))
    );
  }, [data, search]);

  const columns: ColumnDef<Client>[] = [
    {
      accessorKey: 'name',
      header: 'Nome',
      cell: ({ row }) => (
        <div className="flex items-center gap-2.5 font-medium text-foreground">
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold text-xs shrink-0">
            {row.getValue<string>('name')?.substring(0, 2).toUpperCase() || <UserIcon className="h-3.5 w-3.5" />}
          </div>
          <span>{row.getValue('name')}</span>
        </div>
      ),
    },
    {
      accessorKey: 'email',
      header: 'E-mail',
      cell: ({ row }) => <span className="text-muted-foreground">{row.getValue('email') || '-'}</span>,
    },
    {
      accessorKey: 'phone',
      header: 'Telefone',
      cell: ({ row }) => <span className="text-muted-foreground font-mono">{row.getValue('phone') || '-'}</span>,
    },
    {
      accessorKey: 'document',
      header: 'Documento',
      cell: ({ row }) => <span className="text-muted-foreground font-mono">{row.getValue('document') || '-'}</span>,
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
              setEditingClient(row.original);
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
              if (confirm('Deseja realmente excluir este cliente?')) {
                deleteClient(row.original.id);
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
        title="Clientes"
        description="Gerencie sua base de clientes e históricos de atendimento."
        actions={
          <Button
            onClick={() => {
              setEditingClient(null);
              setIsModalOpen(true);
            }}
            size="lg"
            className="shadow-xs font-semibold text-xs uppercase tracking-wider"
          >
            <Plus className="mr-2 h-4 w-4" />
            Novo Cliente
          </Button>
        }
      />

      <div className="bg-card p-4 rounded-xl border border-border shadow-xs flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            type="text"
            placeholder="Buscar por nome, e-mail ou documento..."
            className="pl-9 h-10 text-xs"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <DataTable columns={columns} data={filteredData} loading={isLoading} />

      <CreateClientModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingClient(null);
        }}
        editingClient={editingClient}
      />
    </Page>
  );
}
