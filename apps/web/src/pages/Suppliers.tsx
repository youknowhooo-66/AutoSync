import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';
import { toast } from 'sonner';
import Modal from '../components/Modal';
import { Plus, Search, Pencil, Truck, RefreshCw, AlertCircle, PackageCheck } from 'lucide-react';
import { Page, PageHeader, FormField, FormGrid } from '@/components/primitives';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DataTable } from '@/components/DataTable';
import type { ColumnDef } from '@tanstack/react-table';
import { Badge } from '@/components/ui/badge';
import { useBranch } from '../contexts/BranchContext';
import { usePermissions } from '../modules/auth/hooks/usePermissions';
import { formatDocument, formatPhone } from '@/utils/formatters';
import { extractErrorMessage } from '@/utils/errorHandler';
import { PageSkeleton } from '@/components/feedback/PageSkeleton';

export interface Supplier {
  id: string;
  name: string;
  cnpj?: string | null;
  phone?: string | null;
  address?: string | null;
  email?: string | null;
  parts?: { id: string; name: string }[];
  companyId?: string;
  createdAt?: string;
}

const Suppliers: React.FC = () => {
  const queryClient = useQueryClient();
  const { activeBranch } = useBranch();
  const { can } = usePermissions();

  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [cnpj, setCnpj] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [email, setEmail] = useState('');

  // Permission: stockist/manager/admin can manage suppliers
  const canManage = can('stock.movement') || can('stock.adjust');

  // Query: List Suppliers
  const {
    data: suppliers = [],
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery<Supplier[]>({
    queryKey: ['suppliers', activeBranch?.id],
    queryFn: async () => {
      const res = await api.get('/suppliers');
      return res.data;
    },
  });

  // Mutation: Save Supplier
  const saveMutation = useMutation({
    mutationFn: async (payload: { name: string; cnpj?: string; phone?: string; address?: string; email?: string }) => {
      if (editingSupplier) {
        const res = await api.put(`/suppliers/${editingSupplier.id}`, payload);
        return res.data;
      } else {
        const res = await api.post('/suppliers', payload);
        return res.data;
      }
    },
    onSuccess: () => {
      toast.success(editingSupplier ? 'Fornecedor atualizado com sucesso!' : 'Fornecedor cadastrado com sucesso!');
      setShowModal(false);
      resetForm();
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
    },
    onError: (err) => {
      toast.error(extractErrorMessage(err, 'Erro ao salvar fornecedor.'));
    },
  });

  const resetForm = () => {
    setEditingSupplier(null);
    setName('');
    setCnpj('');
    setPhone('');
    setAddress('');
    setEmail('');
  };

  const handleEdit = (s: Supplier) => {
    setEditingSupplier(s);
    setName(s.name || '');
    setCnpj(s.cnpj || '');
    setPhone(s.phone || '');
    setAddress(s.address || '');
    setEmail(s.email || '');
    setShowModal(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Preencha a Razão Social / Nome do fornecedor.');
      return;
    }

    saveMutation.mutate({
      name: name.trim(),
      cnpj: cnpj.trim() || undefined,
      phone: phone.trim() || undefined,
      address: address.trim() || undefined,
      email: email.trim().toLowerCase() || undefined,
    });
  };

  const filtered = suppliers.filter(
    (s) =>
      (s.name || '').toLowerCase().includes(search.toLowerCase().trim()) ||
      (s.cnpj || '').includes(search.trim()) ||
      (s.email || '').toLowerCase().includes(search.toLowerCase().trim())
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
          <div className="flex flex-col min-w-0">
            <span className="font-semibold text-foreground text-xs truncate">{row.original.name || 'Sem Nome'}</span>
            {row.original.email && <span className="text-[11px] text-muted-foreground truncate">{row.original.email}</span>}
          </div>
        </div>
      ),
    },
    {
      accessorKey: 'cnpj',
      header: 'CNPJ / Documento',
      cell: ({ row }) => (
        <span className="font-mono text-xs text-muted-foreground">{formatDocument(row.getValue('cnpj'))}</span>
      ),
    },
    {
      accessorKey: 'phone',
      header: 'Telefone Contato',
      cell: ({ row }) => (
        <span className="font-mono text-xs text-muted-foreground">{formatPhone(row.getValue('phone'))}</span>
      ),
    },
    {
      id: 'parts',
      header: 'Peças em Catálogo',
      cell: ({ row }) => (
        <Badge variant="outline" className="font-semibold text-[10px] border-primary/20 text-primary bg-primary/5">
          <PackageCheck className="h-3 w-3 mr-1" /> {row.original.parts?.length || 0} Peças
        </Badge>
      ),
    },
    {
      id: 'actions',
      cell: ({ row }) => (
        <div className="flex justify-end">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleEdit(row.original)}
            disabled={!canManage}
            className={`text-xs ${!canManage ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <Pencil className="h-3.5 w-3.5 mr-1" /> Editar
          </Button>
        </div>
      ),
    },
  ];

  if (isLoading) return <PageSkeleton />;

  return (
    <Page data-testid="suppliers-page">
      <PageHeader
        title="Gestão de Fornecedores & Insumos"
        description="Cadastre e gerencie os parceiros de fornecimento de peças, óleo e insumos operacionais."
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => refetch()} className="text-xs" title="Atualizar">
              <RefreshCw className="h-3.5 w-3.5 mr-1.5" /> Atualizar
            </Button>
            <Button
              onClick={() => {
                resetForm();
                setShowModal(true);
              }}
              disabled={!canManage}
              size="lg"
              className={`shadow-xs font-semibold text-xs uppercase tracking-wider ${
                !canManage ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              <Plus className="mr-2 h-4 w-4" /> Novo Fornecedor
            </Button>
          </div>
        }
      />

      {/* Search Bar */}
      <div className="bg-card p-4 rounded-xl border border-border shadow-xs flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Pesquisar fornecedor por nome, CNPJ ou e-mail..."
            className="pl-9 h-10 text-xs"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {isError && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 flex items-center gap-3">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <span className="text-xs font-semibold">{extractErrorMessage(error)}</span>
        </div>
      )}

      {/* Data Table */}
      <DataTable columns={columns} data={filtered} loading={isLoading} />

      {/* Modal: Create / Edit Supplier */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editingSupplier ? 'Editar Fornecedor' : 'Novo Fornecedor'}>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <FormField label="Razão Social / Nome Fantasia" htmlFor="supp-name" required>
            <Input
              id="supp-name"
              placeholder="Ex: Distribuidora de Peças Brasil Ltda"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="h-10 text-xs"
            />
          </FormField>
          <FormField label="CNPJ / Documento" htmlFor="supp-cnpj">
            <Input
              id="supp-cnpj"
              placeholder="00.000.000/0001-00"
              value={cnpj}
              onChange={(e) => setCnpj(e.target.value)}
              className="h-10 text-xs font-mono"
            />
          </FormField>
          <FormField label="Endereço Completo" htmlFor="supp-addr">
            <Input
              id="supp-addr"
              placeholder="Rua, número, bairro, cidade - UF"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="h-10 text-xs"
            />
          </FormField>
          <FormGrid cols={2}>
            <FormField label="Telefone de Contato" htmlFor="supp-phone">
              <Input
                id="supp-phone"
                placeholder="(00) 0000-0000"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="h-10 text-xs font-mono"
              />
            </FormField>
            <FormField label="E-mail Comercial" htmlFor="supp-email">
              <Input
                id="supp-email"
                type="email"
                placeholder="comercial@fornecedor.com.br"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-10 text-xs"
              />
            </FormField>
          </FormGrid>

          <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-border/60">
            <Button type="button" variant="outline" size="sm" onClick={() => setShowModal(false)}>
              Cancelar
            </Button>
            <Button type="submit" size="sm" disabled={saveMutation.isPending} className="font-semibold text-xs">
              {saveMutation.isPending ? 'Salvando...' : 'Salvar Fornecedor'}
            </Button>
          </div>
        </form>
      </Modal>
    </Page>
  );
};

export default Suppliers;
