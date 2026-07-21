import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';
import { toast } from 'sonner';
import Modal from '../components/Modal';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { Plus, Search, Pencil, UserPlus, ShieldAlert, ShieldCheck, RefreshCw, AlertCircle, Eye } from 'lucide-react';
import { Page, PageHeader, FormField, FormGrid, PageGrid } from '@/components/primitives';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DataTable } from '@/components/DataTable';
import type { ColumnDef } from '@tanstack/react-table';
import { Badge } from '@/components/ui/badge';
import { useBranch } from '../contexts/BranchContext';
import { usePermissions } from '../modules/auth/hooks/usePermissions';
import { useAuthStore } from '../modules/auth/state/auth.store';
import { ROLE_PERMISSIONS, type Role } from '../modules/auth/types/roles.types';
import { extractErrorMessage } from '@/utils/errorHandler';
import { PageSkeleton } from '@/components/feedback/PageSkeleton';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  active: boolean;
  branch?: { id: string; name: string } | null;
  branchId?: string | null;
  companyId?: string;
  createdAt?: string;
}

export interface BranchOption {
  id: string;
  name: string;
}

const ROLE_LABELS: Record<Role, { label: string; className: string; description: string }> = {
  ADMIN: { label: 'Administrador', className: 'bg-rose-500/10 text-rose-600 border-rose-500/20', description: 'Acesso irrestrito a todos os módulos, filiais e configurações do sistema.' },
  MANAGER: { label: 'Gestor / Gerente', className: 'bg-purple-500/10 text-purple-600 border-purple-500/20', description: 'Gestão operacional de ordens, estoque, equipes e conciliação financeira.' },
  STOCKIST: { label: 'Estoquista', className: 'bg-amber-500/10 text-amber-600 border-amber-500/20', description: 'Controle de movimentações de almoxarifado, peças e estoque mínimo.' },
  MECHANIC: { label: 'Mecânico', className: 'bg-sky-500/10 text-sky-600 border-sky-500/20', description: 'Execução técnica de diagnósticos, OSs e requisição de peças.' },
  FINANCIAL: { label: 'Financeiro', className: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20', description: 'Baixa de pagamentos, relatórios de caixa e emissão de cobranças.' },
  ATTENDANT: { label: 'Atendente', className: 'bg-slate-500/10 text-slate-600 border-slate-500/20', description: 'Abertura de ordens de serviço, triagem inicial e cadastro de clientes.' },
};

const Users: React.FC = () => {
  const queryClient = useQueryClient();
  const { activeBranch } = useBranch();
  const { can } = usePermissions();
  const currentUser = useAuthStore((state) => state.user);

  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('');
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [togglingUser, setTogglingUser] = useState<User | null>(null);
  const [inspectingUser, setInspectingUser] = useState<User | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<Role>('ATTENDANT');
  const [selectedBranchId, setSelectedBranchId] = useState('');

  const canManage = can('user.manage');

  // Query: Fetch Users
  const {
    data: users = [],
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery<User[]>({
    queryKey: ['users', activeBranch?.id],
    queryFn: async () => {
      const res = await api.get('/users');
      return res.data;
    },
  });

  // Query: Fetch Available Branches for allocation dropdown
  const { data: branches = [] } = useQuery<BranchOption[]>({
    queryKey: ['branches-options'],
    queryFn: async () => {
      const res = await api.get('/branches');
      return res.data;
    },
  });

  // Mutation: Save User
  const saveMutation = useMutation({
    mutationFn: async (payload: any) => {
      if (editingUser) {
        // Exclude password in updates unless explicitly set
        const res = await api.put(`/users/${editingUser.id}`, {
          name: payload.name,
          email: payload.email,
          role: payload.role,
          branchId: payload.branchId || null,
        });
        return res.data;
      } else {
        const res = await api.post('/users', payload);
        return res.data;
      }
    },
    onSuccess: () => {
      toast.success(editingUser ? 'Usuário atualizado com sucesso!' : 'Usuário cadastrado com sucesso!');
      setShowModal(false);
      resetForm();
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
    onError: (err) => {
      toast.error(extractErrorMessage(err, 'Erro ao salvar usuário.'));
    },
  });

  // Mutation: Toggle Active Status
  const toggleMutation = useMutation({
    mutationFn: async (u: User) => {
      const res = await api.put(`/users/${u.id}`, { active: !u.active });
      return res.data;
    },
    onSuccess: (_, u) => {
      toast.success(u.active ? 'Usuário desativado com sucesso.' : 'Usuário reativado com sucesso.');
      setTogglingUser(null);
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
    onError: (err) => {
      toast.error(extractErrorMessage(err, 'Erro ao alterar status do usuário.'));
    },
  });

  const resetForm = () => {
    setEditingUser(null);
    setName('');
    setEmail('');
    setPassword('');
    setRole('ATTENDANT');
    setSelectedBranchId('');
  };

  const handleEditClick = (u: User) => {
    setEditingUser(u);
    setName(u.name || '');
    setEmail(u.email || '');
    setRole(u.role || 'ATTENDANT');
    setSelectedBranchId(u.branch?.id || u.branchId || '');
    setPassword('');
    setShowModal(true);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) {
      toast.error('Preencha os campos obrigatórios (Nome e E-mail).');
      return;
    }

    if (!editingUser && (!password || password.length < 6)) {
      toast.error('A senha inicial deve conter no mínimo 6 caracteres.');
      return;
    }

    saveMutation.mutate({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      password: password ? password : undefined,
      role,
      branchId: selectedBranchId || null,
    });
  };

  const filtered = users.filter((u) => {
    const term = search.toLowerCase().trim();
    const matchesSearch =
      (u.name || '').toLowerCase().includes(term) || (u.email || '').toLowerCase().includes(term);
    const matchesRole = !roleFilter || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const columns: ColumnDef<User>[] = [
    {
      accessorKey: 'name',
      header: 'Usuário',
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-xs shrink-0">
            {row.original.name ? row.original.name.substring(0, 2).toUpperCase() : 'US'}
          </div>
          <div className="flex flex-col min-w-0">
            <span className="font-semibold text-foreground text-xs truncate">{row.original.name || 'Sem Nome'}</span>
            <span className="text-[11px] text-muted-foreground truncate">{row.original.email || '—'}</span>
          </div>
        </div>
      ),
    },
    {
      accessorKey: 'role',
      header: 'Cargo / Papel (RBAC)',
      cell: ({ row }) => {
        const roleInfo = ROLE_LABELS[row.original.role] || ROLE_LABELS.ATTENDANT;
        return (
          <Badge variant="outline" className={`font-semibold text-[10px] ${roleInfo.className}`}>
            {roleInfo.label}
          </Badge>
        );
      },
    },
    {
      id: 'branch',
      header: 'Filial Alocada',
      cell: ({ row }) => (
        <span className="text-xs text-muted-foreground">{row.original.branch?.name || 'Todas as Filiais'}</span>
      ),
    },
    {
      accessorKey: 'active',
      header: 'Status',
      cell: ({ row }) => (
        <Badge
          variant="outline"
          className={`text-[10px] font-semibold ${
            row.original.active !== false
              ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
              : 'bg-rose-500/10 text-rose-600 border-rose-500/20'
          }`}
        >
          {row.original.active !== false ? 'Ativo' : 'Inativo'}
        </Badge>
      ),
    },
    {
      id: 'actions',
      cell: ({ row }) => {
        const isSelf = currentUser?.id === row.original.id;
        return (
          <div className="flex items-center justify-end gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setInspectingUser(row.original)}
              className="text-xs text-muted-foreground hover:text-foreground"
              title="Inspecionar Permissões"
            >
              <Eye className="h-3.5 w-3.5 mr-1" /> Permissões
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleEditClick(row.original)}
              disabled={!canManage}
              className={`text-xs ${!canManage ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <Pencil className="h-3.5 w-3.5 mr-1" /> Editar
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setTogglingUser(row.original)}
              disabled={!canManage}
              className={`text-xs font-semibold ${
                row.original.active !== false
                  ? 'text-danger hover:bg-danger/10'
                  : 'text-emerald-600 hover:bg-emerald-500/10'
              } ${!canManage ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {row.original.active !== false ? 'Desativar' : 'Ativar'}
            </Button>
          </div>
        );
      },
    },
  ];

  if (isLoading) return <PageSkeleton />;

  return (
    <Page data-testid="users-page">
      <PageHeader
        title="Usuários & Governança RBAC"
        description="Gerencie os colaboradores da rede, papéis de acesso corporativo e escopo de atuação por filial."
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
              <UserPlus className="mr-2 h-4 w-4" /> Novo Usuário
            </Button>
          </div>
        }
      />

      {/* Toolbar: Search & Role Filter */}
      <div className="bg-card p-4 rounded-xl border border-border shadow-xs flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Pesquisar por nome ou e-mail..."
            className="pl-9 h-10 text-xs"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          aria-label="Filtrar por Papel"
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="h-10 rounded-lg border border-input bg-background px-3 text-xs focus:ring-1 focus:ring-primary outline-none min-w-[150px]"
        >
          <option value="">Todos os cargos</option>
          <option value="ADMIN">Administrador</option>
          <option value="MANAGER">Gestor</option>
          <option value="FINANCIAL">Financeiro</option>
          <option value="STOCKIST">Estoquista</option>
          <option value="MECHANIC">Mecânico</option>
          <option value="ATTENDANT">Atendente</option>
        </select>
        {(search || roleFilter) && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setSearch('');
              setRoleFilter('');
            }}
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            Limpar Filtros
          </Button>
        )}
      </div>

      {isError && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 flex items-center gap-3">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <span className="text-xs font-semibold">{extractErrorMessage(error)}</span>
        </div>
      )}

      {/* Data Table */}
      <DataTable columns={columns} data={filtered} loading={isLoading} />

      {/* Modal: Create / Edit User */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editingUser ? 'Editar Usuário' : 'Novo Usuário'}>
        <form onSubmit={handleFormSubmit} className="flex flex-col gap-4">
          <FormField label="Nome Completo" htmlFor="user-name" required>
            <Input
              id="user-name"
              placeholder="Ex: João da Silva"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="h-10 text-xs"
            />
          </FormField>

          <FormField label="E-mail de Acesso" htmlFor="user-email" required>
            <Input
              id="user-email"
              type="email"
              placeholder="joao@autosync.com.br"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="h-10 text-xs"
            />
          </FormField>

          {!editingUser && (
            <FormField label="Senha Inicial" htmlFor="user-pass" required helperText="Mínimo de 6 caracteres">
              <Input
                id="user-pass"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="h-10 text-xs"
              />
            </FormField>
          )}

          <FormGrid cols={2}>
            <FormField label="Cargo / Papel (RBAC)" htmlFor="user-role" required>
              <select
                id="user-role"
                aria-label="Cargo / Papel (RBAC)"
                className="h-10 rounded-lg border border-input bg-background px-3 text-xs focus:ring-1 focus:ring-primary outline-none"
                value={role}
                onChange={(e) => setRole(e.target.value as Role)}
                required
              >
                <option value="ADMIN">Administrador</option>
                <option value="MANAGER">Gestor / Gerente</option>
                <option value="FINANCIAL">Financeiro</option>
                <option value="STOCKIST">Estoquista</option>
                <option value="MECHANIC">Mecânico</option>
                <option value="ATTENDANT">Atendente</option>
              </select>
            </FormField>

            <FormField label="Filial Alocada" htmlFor="user-branch">
              <select
                id="user-branch"
                aria-label="Filial Alocada"
                className="h-10 rounded-lg border border-input bg-background px-3 text-xs focus:ring-1 focus:ring-primary outline-none"
                value={selectedBranchId}
                onChange={(e) => setSelectedBranchId(e.target.value)}
              >
                <option value="">Todas as Filiais (Global)</option>
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </FormField>
          </FormGrid>

          <div className="p-3 rounded-lg bg-surface-muted/50 border border-border/60 text-xs text-muted-foreground leading-relaxed">
            <span className="font-semibold text-foreground block mb-0.5">{ROLE_LABELS[role]?.label}</span>
            {ROLE_LABELS[role]?.description}
          </div>

          <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-border/60">
            <Button type="button" variant="outline" size="sm" onClick={() => setShowModal(false)}>
              Cancelar
            </Button>
            <Button type="submit" size="sm" disabled={saveMutation.isPending} className="font-semibold text-xs">
              {saveMutation.isPending ? 'Salvando...' : 'Salvar Usuário'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal: Inspection of Permissions */}
      <Modal
        isOpen={!!inspectingUser}
        onClose={() => setInspectingUser(null)}
        title="Capacidades & Permissões Efetivas"
        width="600px"
      >
        {inspectingUser && (
          <div className="flex flex-col gap-4 p-1">
            <div className="flex items-center justify-between p-3 rounded-lg bg-surface-muted/60 border border-border/60">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-xs">
                  {inspectingUser.name.substring(0, 2).toUpperCase()}
                </div>
                <div className="flex flex-col">
                  <span className="font-semibold text-xs text-foreground">{inspectingUser.name}</span>
                  <span className="text-[11px] text-muted-foreground">{inspectingUser.email}</span>
                </div>
              </div>
              <Badge variant="outline" className={`font-semibold text-[10px] ${ROLE_LABELS[inspectingUser.role]?.className}`}>
                {ROLE_LABELS[inspectingUser.role]?.label}
              </Badge>
            </div>

            <div className="flex flex-col gap-2">
              <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <ShieldCheck className="h-4 w-4 text-emerald-600" /> Permissões Concedidas ({ROLE_PERMISSIONS[inspectingUser.role]?.length || 0})
              </span>
              <div className="flex flex-wrap gap-1.5 p-3 rounded-xl bg-card border border-border/60 max-h-[200px] overflow-y-auto">
                {ROLE_PERMISSIONS[inspectingUser.role]?.map((perm) => (
                  <Badge key={perm} variant="outline" className="font-mono text-[10px] bg-surface-muted text-foreground">
                    {perm}
                  </Badge>
                ))}
              </div>
            </div>

            <div className="flex justify-end pt-3 border-t border-border/60">
              <Button onClick={() => setInspectingUser(null)} size="sm" className="font-semibold text-xs">
                Fechar Inspeção
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Confirmation Dialog: Toggle Active User */}
      <ConfirmDialog
        isOpen={!!togglingUser}
        onClose={() => setTogglingUser(null)}
        onConfirm={() => togglingUser && toggleMutation.mutate(togglingUser)}
        title={togglingUser?.active !== false ? 'Desativar Usuário' : 'Reativar Usuário'}
        description={
          togglingUser?.id === currentUser?.id
            ? `Atenção: Você está prestes a desativar sua própria conta (${togglingUser?.name}). Seu acesso ao sistema poderá ser suspenso imediatamente.`
            : togglingUser?.active !== false
            ? `Tem certeza que deseja inativar o acesso de "${togglingUser?.name}" (${togglingUser?.email})?`
            : `Deseja reativar o acesso ao sistema para "${togglingUser?.name}"?`
        }
        confirmText={togglingUser?.active !== false ? 'Sim, Desativar' : 'Sim, Reativar'}
        cancelText="Cancelar"
        variant={togglingUser?.active !== false ? 'danger' : 'primary'}
        isLoading={toggleMutation.isPending}
      />
    </Page>
  );
};

export default Users;
