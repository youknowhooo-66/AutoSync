import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { toast } from 'sonner';
import Modal from '../components/Modal';
import { Plus, Search, Store, Pencil, ToggleLeft, ToggleRight, MapPin, Phone, Mail } from 'lucide-react';
import { Page, PageHeader, PageGrid, FormField, FormGrid } from '@/components/primitives';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PageSkeleton } from '@/components/feedback/PageSkeleton';

interface Branch {
  id: string;
  name: string;
  cnpj: string;
  address: string;
  phone: string;
  email: string;
  active: boolean;
  createdAt: string;
}

const Branches: React.FC = () => {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form
  const [name, setName] = useState('');
  const [cnpj, setCnpj] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');

  useEffect(() => {
    fetchBranches();
  }, []);

  const fetchBranches = async () => {
    try {
      const response = await api.get('/branches');
      setBranches(response.data);
    } catch {
      toast.error('Erro ao buscar filiais.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        await api.put(`/branches/${editingId}`, { name, cnpj, address, phone, email });
        toast.success('Filial atualizada com sucesso!');
      } else {
        await api.post('/branches', { name, cnpj, address, phone, email });
        toast.success('Filial cadastrada com sucesso!');
      }
      setShowModal(false);
      resetForm();
      fetchBranches();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erro ao salvar filial.');
    }
  };

  const handleEdit = (branch: Branch) => {
    setEditingId(branch.id);
    setName(branch.name);
    setCnpj(branch.cnpj);
    setAddress(branch.address || '');
    setPhone(branch.phone || '');
    setEmail(branch.email || '');
    setShowModal(true);
  };

  const handleToggle = async (branch: Branch) => {
    try {
      await api.put(`/branches/${branch.id}`, { active: !branch.active });
      toast.success(branch.active ? 'Filial desativada.' : 'Filial ativada.');
      fetchBranches();
    } catch {
      toast.error('Erro ao atualizar filial.');
    }
  };

  const resetForm = () => {
    setEditingId(null);
    setName('');
    setCnpj('');
    setAddress('');
    setPhone('');
    setEmail('');
  };

  const filtered = branches.filter(
    (b) => (b.name || '').toLowerCase().includes(search.toLowerCase()) || b.cnpj?.includes(search)
  );

  if (loading) return <PageSkeleton />;

  return (
    <Page>
      <PageHeader
        title="Filiais & Unidades Operacionais"
        description="Gerencie as unidades da sua rede de oficinas com controle de acessos e estoques isolados."
        actions={
          <Button
            onClick={() => {
              resetForm();
              setShowModal(true);
            }}
            size="lg"
            className="shadow-xs font-semibold text-xs uppercase tracking-wider"
          >
            <Plus className="mr-2 h-4 w-4" /> Nova Filial
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

      <PageGrid cols={3}>
        {filtered.map((branch) => (
          <Card
            key={branch.id}
            className={`p-5 flex flex-col justify-between gap-4 border transition-all ${
              branch.active ? 'border-border bg-card' : 'border-border/40 bg-surface-muted/50 opacity-75'
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 ${
                    branch.active ? 'bg-primary/10 text-primary' : 'bg-surface-muted text-muted-foreground'
                  }`}
                >
                  <Store className="h-5 w-5" />
                </div>
                <div className="flex flex-col min-w-0">
                  <h3 className="font-semibold text-sm text-foreground truncate">{branch.name || 'Sem Nome'}</h3>
                  <span className="text-xs font-mono text-muted-foreground truncate">{branch.cnpj}</span>
                </div>
              </div>
              <Badge
                variant="outline"
                className={`text-[10px] font-semibold ${
                  branch.active
                    ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
                    : 'bg-rose-500/10 text-rose-600 border-rose-500/20'
                }`}
              >
                {branch.active ? 'Ativa' : 'Inativa'}
              </Badge>
            </div>

            <div className="flex flex-col gap-1.5 text-xs text-muted-foreground pt-2 border-t border-border/40">
              {branch.address && (
                <div className="flex items-center gap-2 truncate">
                  <MapPin className="h-3.5 w-3.5 shrink-0 text-primary/70" />
                  <span className="truncate">{branch.address}</span>
                </div>
              )}
              {branch.phone && (
                <div className="flex items-center gap-2 truncate font-mono">
                  <Phone className="h-3.5 w-3.5 shrink-0 text-primary/70" />
                  <span className="truncate">{branch.phone}</span>
                </div>
              )}
              {branch.email && (
                <div className="flex items-center gap-2 truncate">
                  <Mail className="h-3.5 w-3.5 shrink-0 text-primary/70" />
                  <span className="truncate">{branch.email}</span>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2 pt-3 border-t border-border/40">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleEdit(branch)}
                className="flex-1 text-xs font-semibold"
              >
                <Pencil className="h-3.5 w-3.5 mr-1.5" /> Editar
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleToggle(branch)}
                className={`flex-1 text-xs font-semibold ${
                  branch.active ? 'text-danger hover:bg-danger/10' : 'text-emerald-600 hover:bg-emerald-500/10'
                }`}
              >
                {branch.active ? <ToggleOff className="h-4 w-4 mr-1.5" /> : <ToggleOn className="h-4 w-4 mr-1.5" />}
                {branch.active ? 'Desativar' : 'Ativar'}
              </Button>
            </div>
          </Card>
        ))}
      </PageGrid>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editingId ? 'Editar Filial' : 'Nova Filial'}>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <FormField label="Nome da Filial" htmlFor="branch-name" required>
            <Input
              id="branch-name"
              placeholder="Ex: Matriz Centro"
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
              className="h-10 text-xs"
            />
          </FormField>
          <FormField label="Endereço" htmlFor="branch-addr">
            <Input
              id="branch-addr"
              placeholder="Rua, número, bairro, cidade"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="h-10 text-xs"
            />
          </FormField>
          <FormGrid cols={2}>
            <FormField label="Telefone" htmlFor="branch-phone">
              <Input
                id="branch-phone"
                placeholder="(00) 0000-0000"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="h-10 text-xs"
              />
            </FormField>
            <FormField label="E-mail" htmlFor="branch-email">
              <Input
                id="branch-email"
                type="email"
                placeholder="email@filial.com"
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
            <Button type="submit" size="sm" className="font-semibold text-xs">
              Salvar
            </Button>
          </div>
        </form>
      </Modal>
    </Page>
  );
};

export default Branches;
