import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { toast } from 'sonner';
import Modal from '../components/Modal';
import { Plus, Search, Pencil, Truck } from 'lucide-react';
import { Page, PageHeader, FormField, FormGrid } from '@/components/primitives';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DataTable } from '@/components/DataTable';
import type { ColumnDef } from '@tanstack/react-table';
import { Badge } from '@/components/ui/badge';

interface Supplier {
  id: string;
  name: string;
  cnpj: string;
  phone: string;
  address: string;
  email: string;
  parts: { id: string; name: string }[];
}

const Suppliers: React.FC = () => {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form
  const [name, setName] = useState('');
  const [cnpj, setCnpj] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [email, setEmail] = useState('');

  useEffect(() => {
    fetchSuppliers();
  }, []);

  const fetchSuppliers = async () => {
    try {
      const response = await api.get('/suppliers');
      setSuppliers(response.data);
    } catch {
      toast.error('Erro ao buscar fornecedores.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        await api.put(`/suppliers/${editingId}`, { name, cnpj, phone, address, email });
        toast.success('Fornecedor atualizado!');
      } else {
        await api.post('/suppliers', { name, cnpj, phone, address, email });
        toast.success('Fornecedor cadastrado!');
      }
      setShowModal(false);
      resetForm();
      fetchSuppliers();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erro ao salvar fornecedor.');
    }
  };

  const handleEdit = (s: Supplier) => {
    setEditingId(s.id);
    setName(s.name);
    setCnpj(s.cnpj || '');
    setPhone(s.phone || '');
    setAddress(s.address || '');
    setEmail(s.email || '');
    setShowModal(true);
  };

  const resetForm = () => {
    setEditingId(null);
    setName('');
    setCnpj('');
    setPhone('');
    setAddress('');
    setEmail('');
  };

  const filtered = suppliers.filter(
    (s) => s.name.toLowerCase().includes(search.toLowerCase()) || s.cnpj?.includes(search)
  );

  const columns: ColumnDef<Supplier>[] = [
    {
      accessorKey: 'name',
      header: 'Fornecedor',
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary shrink-0">
            <Truck className="h-5 w-5" />
          </div>
          <div className="flex flex-col">
            <span className="font-semibold text-foreground">{row.original.name}</span>
            {row.original.email && <span className="text-xs text-muted-foreground">{row.original.email}</span>}
          </div>
        </div>
      ),
    },
    {
      accessorKey: 'cnpj',
      header: 'CNPJ',
      cell: ({ row }) => <span className="font-mono text-muted-foreground">{row.getValue('cnpj') || '—'}</span>,
    },
    {
      accessorKey: 'phone',
      header: 'Contato',
      cell: ({ row }) => <span className="font-mono text-muted-foreground">{row.getValue('phone') || '—'}</span>,
    },
    {
      id: 'parts',
      header: 'Peças Vinculadas',
      cell: ({ row }) => (
        <Badge variant="outline" className="font-semibold text-xs border-primary/20 text-primary bg-primary/5">
          {row.original.parts?.length || 0} Peças
        </Badge>
      ),
    },
    {
      id: 'actions',
      cell: ({ row }) => (
        <div className="flex justify-end">
          <Button variant="ghost" size="sm" onClick={() => handleEdit(row.original)} className="text-xs">
            <Pencil className="h-3.5 w-3.5 mr-1" /> Editar
          </Button>
        </div>
      ),
    },
  ];

  return (
    <Page>
      <PageHeader
        title="Fornecedores"
        description="Gerencie seus fornecedores de peças, peças sob encomenda e insumos."
        actions={
          <Button
            onClick={() => {
              resetForm();
              setShowModal(true);
            }}
            size="lg"
            className="shadow-xs font-semibold text-xs uppercase tracking-wider"
          >
            <Plus className="mr-2 h-4 w-4" /> Novo Fornecedor
          </Button>
        }
      />

      <div className="bg-card p-4 rounded-xl border border-border shadow-xs flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Pesquisar por nome ou CNPJ..."
            className="pl-9 h-10 text-xs"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <DataTable columns={columns} data={filtered} loading={loading} />

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editingId ? 'Editar Fornecedor' : 'Novo Fornecedor'}>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <FormField label="Razão Social" htmlFor="supp-name" required>
            <Input id="supp-name" placeholder="Nome do Fornecedor" value={name} onChange={(e) => setName(e.target.value)} required className="h-10 text-xs" />
          </FormField>
          <FormField label="CNPJ" htmlFor="supp-cnpj">
            <Input id="supp-cnpj" placeholder="00.000.000/0001-00" value={cnpj} onChange={(e) => setCnpj(e.target.value)} className="h-10 text-xs" />
          </FormField>
          <FormField label="Endereço" htmlFor="supp-addr">
            <Input id="supp-addr" placeholder="Rua, número, bairro, cidade" value={address} onChange={(e) => setAddress(e.target.value)} className="h-10 text-xs" />
          </FormField>
          <FormGrid cols={2}>
            <FormField label="Telefone" htmlFor="supp-phone">
              <Input id="supp-phone" placeholder="(00) 0000-0000" value={phone} onChange={(e) => setPhone(e.target.value)} className="h-10 text-xs" />
            </FormField>
            <FormField label="E-mail" htmlFor="supp-email">
              <Input id="supp-email" type="email" placeholder="contato@fornecedor.com" value={email} onChange={(e) => setEmail(e.target.value)} className="h-10 text-xs" />
            </FormField>
          </FormGrid>

          <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-border/60">
            <Button type="button" variant="outline" size="sm" onClick={() => setShowModal(false)}>
              Cancelar
            </Button>
            <Button type="submit" size="sm" className="font-semibold text-xs">
              Salvar
            </Button>
          </div>
        </form>
      </Modal>
    </Page>
  );
};

export default Suppliers;
