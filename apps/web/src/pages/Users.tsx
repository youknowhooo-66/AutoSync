import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { toast } from 'sonner';
import Modal from '../components/Modal';
import { Plus, Search, Pencil, ToggleLeft, ToggleRight, UserPlus, ShieldAlert } from 'lucide-react';
import { Page, PageHeader, FormField, FormGrid } from '@/components/primitives';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DataTable } from '@/components/DataTable';
import type { ColumnDef } from '@tanstack/react-table';
import { Badge } from '@/components/ui/badge';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  active: boolean;
  branch: { id: string; name: string } | null;
}

interface Branch {
  id: string;
  name: string;
}

const ROLE_LABELS: Record<string, { label: string; className: string }> = {
  ADMIN: { label: 'Administrador', className: 'bg-rose-500/10 text-rose-600 border-rose-500/20' },
  MANAGER: { label: 'Gerente', className: 'bg-purple-500/10 text-purple-600 border-purple-500/20' },
  STOCKIST: { label: 'Estoquista', className: 'bg-amber-500/10 text-amber-600 border-amber-500/20' },
  MECHANIC: { label: 'Mecânico', className: 'bg-sky-500/10 text-sky-600 border-sky-500/20' },
  FINANCIAL: { label: 'Financeiro', className: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' },
  ATTENDANT: { label: 'Atendente', className: 'bg-slate-500/10 text-slate-600 border-slate-500/20' },
};

const Users: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('ATTENDANT');
  const [branchId, setBranchId] = useState('');

  useEffect(() => {
    fetchUsers();
    fetchBranches();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await api.get('/users');
      setUsers(res.data);
    } catch {
      toast.error('Erro ao buscar usuários.');
    } finally {
      setLoading(false);
    }
  };

  const fetchBranches = async () => {
    try {
      const res = await api.get('/branches');
      setBranches(res.data);
    } catch {}
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        await api.put(`/users/${editingId}`, { name, email, role, branchId: branchId || null });
        toast.success('Usuário atualizado!');
      } else {
        await api.post('/users', { name, email, password, role, branchId: branchId || null });
        toast.success('Usuário cadastrado!');
      }
      setShowModal(false);
      resetForm();
      fetchUsers();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erro ao salvar usuário.');
    }
  };

  const handleEdit = (u: User) => {
    setEditingId(u.id);
    setName(u.name);
    setEmail(u.email);
    setRole(u.role);
    setBranchId(u.branch?.id || '');
    setPassword('');
    setShowModal(true);
  };

  const handleToggle = async (u: User) => {
    try {
      await api.put(`/users/${u.id}`, { active: !u.active });
      toast.success(u.active ? 'Usuário desativado.' : 'Usuário ativado.');
      fetchUsers();
    } catch {
      toast.error('Erro ao atualizar usuário.');
    }
  };

  const resetForm = () => {
    setEditingId(null);
    setName('');
    setEmail('');
    setPassword('');
    setRole('ATTENDANT');
    setBranchId('');
  };

  const filtered = users.filter(
    (u) =>
      (u.name || '').toLowerCase().includes(search.toLowerCase()) ||
      (u.email || '').toLowerCase().includes(search.toLowerCase())
  );

  const columns: ColumnDef<User>[] = [
    {
      accessorKey: 'name',
      header: 'Usuário',
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold text-xs shrink-0">
            {row.original.name ? row.original.name.substring(0, 2).toUpperCase() : 'US'}
          </div>
          <div className="flex flex-col">
            <span className="font-semibold text-foreground">{row.original.name || 'Sem Nome'}</span>
            <span className="text-xs text-muted-foreground">{row.original.email || '—'}</span>
          </div>
        </div>
      ),
    },
    {
      accessorKey: 'role',
      header: 'Cargo / Papel',
      cell: ({ row }) => {
        const roleInfo = ROLE_LABELS[row.original.role] || ROLE_LABELS.ATTENDANT;
        return (
          <Badge variant="outline" className={`font-semibold text-xs ${roleInfo.className}`}>
            {roleInfo.label}
          </Badge>
        );
      },
    },
    {
      id: 'branch',
      header: 'Filial Designada',
      cell: ({ row }) => <span className="text-muted-foreground">{row.original.branch?.name || '—'}</span>,
    },
    {
      accessorKey: 'active',
      header: 'Status',
      cell: ({ row }) => (
        <Badge
          variant="outline"
          className={`text-[10px] font-semibold ${
            row.original.active
              ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
              : 'bg-rose-500/10 text-rose-600 border-rose-500/20'
          }`}
        >
          {row.original.active ? 'Ativo' : 'Inativo'}
        </Badge>
      ),
    },
    {
      id: 'actions',
      cell: ({ row }) => (
        <div className="flex items-center justify-end gap-1">
          <Button variant="ghost" size="sm" onClick={() => handleEdit(row.original)} className="text-xs">
            <Pencil className="h-3.5 w-3.5 mr-1" /> Editar
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleToggle(row.original)}
            className={`text-xs font-semibold ${
              row.original.active ? 'text-danger hover:bg-danger/10' : 'text-emerald-600 hover:bg-emerald-500/10'
            }`}
          >
            {row.original.active ? 'Desativar' : 'Ativar'}
          </Button>
        </div>
      ),
    },
  ];

  return (
    <Page>
      <PageHeader
        title="Usuários & Permissões (RBAC)"
        description="Gerencie os membros da sua equipe, cargos e escopos de acesso corporativo."
        actions={
          <Button
            onClick={() => {
              resetForm();
              setShowModal(true);
            }}
            size="lg"
            className="shadow-xs font-semibold text-xs uppercase tracking-wider"
          >
            <UserPlus className="mr-2 h-4 w-4" /> Novo Usuário
          </Button>
        }
      />

      <div className="bg-card p-4 rounded-xl border border-border shadow-xs flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Pesquisar por nome ou e-mail..."
            className="pl-9 h-10 text-xs"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <DataTable columns={columns} data={filtered} loading={loading} />

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editingId ? 'Editar Usuário' : 'Novo Usuário'}>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <FormField label="Nome Completo" htmlFor="user-name" required>
            <Input id="user-name" placeholder="João da Silva" value={name} onChange={(e) => setName(e.target.value)} required className="h-10 text-xs" />
          </FormField>
          <FormField label="E-mail" htmlFor="user-email" required>
            <Input id="user-email" type="email" placeholder="joao@email.com" value={email} onChange={(e) => setEmail(e.target.value)} required className="h-10 text-xs" />
          </FormField>
          {!editingId && (
            <FormField label="Senha Inicial" htmlFor="user-pass" required>
              <Input id="user-pass" type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required className="h-10 text-xs" />
            </FormField>
          )}
          <FormGrid cols={2}>
            <FormField label="Cargo / Papel (RBAC)" htmlFor="user-role" required>
              <select id="user-role" className="h-10 rounded-lg border border-input bg-background px-3 text-xs focus:ring-1 focus:ring-primary outline-none" value={role} onChange={(e) => setRole(e.target.value)} required>
                <option value="ADMIN">Administrador</option>
                <option value="MANAGER">Gerente</option>
                <option value="STOCKIST">Estoquista</option>
                <option value="MECHANIC">Mecânico</option>
                <option value="FINANCIAL">Financeiro</option>
                <option value="ATTENDANT">Atendente</option>
              </select>
            </FormField>
            <FormField label="Filial Alocada" htmlFor="user-branch">
              <select id="user-branch" className="h-10 rounded-lg border border-input bg-background px-3 text-xs focus:ring-1 focus:ring-primary outline-none" value={branchId} onChange={(e) => setBranchId(e.target.value)}>
                <option value="">Sem filial restrita</option>
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
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

export default Users;
