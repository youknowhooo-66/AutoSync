import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';
import { toast } from 'sonner';
import Modal from '../components/Modal';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { Plus, Search, Store, Pencil, ToggleLeft, ToggleRight, MapPin, Phone, Mail, Check, AlertCircle, RefreshCw } from 'lucide-react';
import { Page, PageHeader, PageGrid, FormField, FormGrid } from '@/components/primitives';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useBranch } from '../contexts/BranchContext';
import { usePermissions } from '../modules/auth/hooks/usePermissions';
import { formatDocument, formatPhone } from '@/utils/formatters';
import { extractErrorMessage } from '@/utils/errorHandler';
import { PageSkeleton } from '@/components/feedback/PageSkeleton';

export interface Branch {
  id: string;
  name: string;
  cnpj: string;
  address: string;
  phone: string;
  email: string;
  active: boolean;
  companyId?: string;
  createdAt?: string;
}

const Branches: React.FC = () => {
  const queryClient = useQueryClient();
  const { activeBranch, setActiveBranch, setAvailableBranches } = useBranch();
  const { can } = usePermissions();

  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingBranch, setEditingBranch] = useState<Branch | null>(null);
  const [togglingBranch, setTogglingBranch] = useState<Branch | null>(null);

  // Form state
  const [name, setName] = useState('');
  const [cnpj, setCnpj] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');

  const canManage = can('branch.manage');

  // Query: Fetch Branches
  const {
    data: branches = [],
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery<Branch[]>({
    queryKey: ['branches'],
    queryFn: async () => {
      const res = await api.get('/branches');
      return res.data;
    },
  });

  // Sync available branches with context
  useEffect(() => {
    if (branches && branches.length > 0) {
      setAvailableBranches(branches);
    }
  }, [branches, setAvailableBranches]);

  // Mutation: Create or Edit Branch
  const saveMutation = useMutation({
    mutationFn: async (payload: { name: string; cnpj: string; address: string; phone: string; email: string }) => {
      if (editingBranch) {
        const res = await api.put(`/branches/${editingBranch.id}`, payload);
        return res.data;
      } else {
        const res = await api.post('/branches', payload);
        return res.data;
      }
    },
    onSuccess: (_, variables) => {
      toast.success(editingBranch ? 'Filial atualizada com sucesso!' : 'Filial cadastrada com sucesso!');
      setShowModal(false);
      resetForm();
      queryClient.invalidateQueries({ queryKey: ['branches'] });
    },
    onError: (err) => {
      toast.error(extractErrorMessage(err, 'Erro ao salvar filial.'));
    },
  });

  // Mutation: Toggle Active Status
  const toggleMutation = useMutation({
    mutationFn: async (branch: Branch) => {
      const res = await api.put(`/branches/${branch.id}`, { active: !branch.active });
      return res.data;
    },
    onSuccess: (_, branch) => {
      toast.success(branch.active ? 'Filial desativada com sucesso.' : 'Filial ativada com sucesso.');
      setTogglingBranch(null);
      queryClient.invalidateQueries({ queryKey: ['branches'] });
    },
    onError: (err) => {
      toast.error(extractErrorMessage(err, 'Erro ao atualizar status da filial.'));
    },
  });

  const resetForm = () => {
    setEditingBranch(null);
    setName('');
    setCnpj('');
    setAddress('');
    setPhone('');
    setEmail('');
  };

  const handleEditClick = (branch: Branch) => {
    setEditingBranch(branch);
    setName(branch.name || '');
    setCnpj(branch.cnpj || '');
    setAddress(branch.address || '');
    setPhone(branch.phone || '');
    setEmail(branch.email || '');
    setShowModal(true);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !cnpj.trim()) {
      toast.error('Preencha os campos obrigatórios (Nome e CNPJ).');
      return;
    }
    saveMutation.mutate({
      name: name.trim(),
      cnpj: cnpj.trim(),
      address: address.trim(),
      phone: phone.trim(),
      email: email.trim(),
    });
  };

  const filtered = branches.filter(
    (b) =>
      (b.name || '').toLowerCase().includes(search.toLowerCase().trim()) ||
      (b.cnpj || '').includes(search.trim()) ||
      (b.city || b.address || '').toLowerCase().includes(search.toLowerCase().trim())
  );

  if (isLoading) return <PageSkeleton />;

  return (
    <Page data-testid="branches-page">
      <PageHeader
        title="Gestão de Filiais & Unidades Operacionais"
        description="Administre as unidades da sua rede de oficinas com controle de acessos e estoques isolados por branch."
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
              <Plus className="mr-2 h-4 w-4" /> Nova Filial
            </Button>
          </div>
        }
      />

      {/* Search Toolbar */}
      <div className="bg-card p-4 rounded-xl border border-border shadow-xs flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Pesquisar por nome da filial, CNPJ ou cidade..."
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

      {/* Grid of Branch Cards */}
      <PageGrid cols={3}>
        {filtered.map((branch) => {
          const isSelected = activeBranch?.id === branch.id;
          return (
            <Card
              key={branch.id}
              className={`p-5 flex flex-col justify-between gap-4 border transition-all ${
                isSelected
                  ? 'border-primary ring-2 ring-primary/20 bg-primary/5'
                  : branch.active !== false
                  ? 'border-border bg-card'
                  : 'border-border/40 bg-surface-muted/50 opacity-70'
              }`}
              data-testid={`branch-card-${branch.id}`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 ${
                      isSelected
                        ? 'bg-primary text-primary-foreground shadow-xs'
                        : branch.active !== false
                        ? 'bg-primary/10 text-primary'
                        : 'bg-surface-muted text-muted-foreground'
                    }`}
                  >
                    <Store className="h-5 w-5" />
                  </div>
                  <div className="flex flex-col min-w-0">
                    <div className="flex items-center gap-1.5">
                      <h3 className="font-semibold text-sm text-foreground truncate">{branch.name || 'Sem Nome'}</h3>
                      {isSelected && (
                        <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 text-[9px]">
                          <Check className="h-3 w-3 mr-0.5" /> Ativa no Contexto
                        </Badge>
                      )}
                    </div>
                    <span className="text-xs font-mono text-muted-foreground truncate">{formatDocument(branch.cnpj)}</span>
                  </div>
                </div>
                <Badge
                  variant="outline"
                  className={`text-[10px] font-semibold ${
                    branch.active !== false
                      ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
                      : 'bg-rose-500/10 text-rose-600 border-rose-500/20'
                  }`}
                >
                  {branch.active !== false ? 'Ativa' : 'Inativa'}
                </Badge>
              </div>

              <div className="flex flex-col gap-1.5 text-xs text-muted-foreground pt-2 border-t border-border/40">
                {branch.address && (
                  <div className="flex items-center gap-2 truncate" title={branch.address}>
                    <MapPin className="h-3.5 w-3.5 shrink-0 text-primary/70" />
                    <span className="truncate">{branch.address}</span>
                  </div>
                )}
                {branch.phone && (
                  <div className="flex items-center gap-2 truncate font-mono">
                    <Phone className="h-3.5 w-3.5 shrink-0 text-primary/70" />
                    <span className="truncate">{formatPhone(branch.phone)}</span>
                  </div>
                )}
                {branch.email && (
                  <div className="flex items-center gap-2 truncate">
                    <Mail className="h-3.5 w-3.5 shrink-0 text-primary/70" />
                    <span className="truncate">{branch.email}</span>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-3 gap-2 pt-3 border-t border-border/40">
                <Button
                  variant={isSelected ? "secondary" : "outline"}
                  size="sm"
                  disabled={isSelected || branch.active === false}
                  onClick={() => setActiveBranch(branch)}
                  className="text-xs font-semibold text-primary border-primary/30 hover:bg-primary/10 disabled:opacity-50 w-full"
                >
                  {isSelected ? 'Ativa' : 'Selecionar'}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleEditClick(branch)}
                  disabled={!canManage}
                  className="text-xs font-semibold w-full"
                >
                  <Pencil className="h-3.5 w-3.5 mr-1" /> Editar
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setTogglingBranch(branch)}
                  disabled={!canManage || isSelected}
                  className={`text-xs font-semibold w-full ${
                    branch.active !== false ? 'text-danger hover:bg-danger/10' : 'text-emerald-600 hover:bg-emerald-500/10'
                  } ${!canManage || isSelected ? 'opacity-50 cursor-not-allowed' : ''}`}
                  title={isSelected ? 'Não é possível desativar a filial ativa no seu contexto' : ''}
                >
                  {branch.active !== false ? <ToggleLeft className="h-4 w-4 mr-1" /> : <ToggleRight className="h-4 w-4 mr-1" />}
                  {branch.active !== false ? 'Desativar' : 'Ativar'}
                </Button>
              </div>
            </Card>
          );
        })}
      </PageGrid>

      {/* Modal: Create / Edit Branch */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editingBranch ? 'Editar Filial' : 'Nova Filial'}>
        <form onSubmit={handleFormSubmit} className="flex flex-col gap-4">
          <FormField label="Nome da Filial" htmlFor="branch-name" required>
            <Input
              id="branch-name"
              placeholder="Ex: Matriz Centro ou Filial Sul"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="h-10 text-xs"
            />
          </FormField>
          <FormField label="CNPJ" htmlFor="branch-cnpj" required>
            <Input
              id="branch-cnpj"
              placeholder="00.000.000/0001-00"
              value={cnpj}
              onChange={(e) => setCnpj(e.target.value)}
              required
              className="h-10 text-xs font-mono"
            />
          </FormField>
          <FormField label="Endereço Completo" htmlFor="branch-addr">
            <Input
              id="branch-addr"
              placeholder="Rua, número, bairro, cidade - UF"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="h-10 text-xs"
            />
          </FormField>
          <FormGrid cols={2}>
            <FormField label="Telefone de Contato" htmlFor="branch-phone">
              <Input
                id="branch-phone"
                placeholder="(00) 0000-0000"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="h-10 text-xs font-mono"
              />
            </FormField>
            <FormField label="E-mail Operacional" htmlFor="branch-email">
              <Input
                id="branch-email"
                type="email"
                placeholder="contato@filial.com.br"
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
              {saveMutation.isPending ? 'Salvando...' : 'Salvar Filial'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Confirm Dialog for Status Toggle */}
      <ConfirmDialog
        isOpen={!!togglingBranch}
        onClose={() => setTogglingBranch(null)}
        onConfirm={() => togglingBranch && toggleMutation.mutate(togglingBranch)}
        title={togglingBranch?.active !== false ? 'Inativar Filial' : 'Ativar Filial'}
        description={
          togglingBranch?.active !== false
            ? `Tem certeza que deseja inativar a filial "${togglingBranch?.name}"? Usuários desta unidade poderão ter seu acesso restrito.`
            : `Deseja reativar a filial "${togglingBranch?.name}" para operação regular?`
        }
        confirmText={togglingBranch?.active !== false ? 'Sim, Inativar' : 'Sim, Ativar'}
        cancelText="Cancelar"
        variant={togglingBranch?.active !== false ? 'danger' : 'primary'}
        isLoading={toggleMutation.isPending}
      />
    </Page>
  );
};

export default Branches;
