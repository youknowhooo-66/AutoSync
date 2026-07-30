import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';
import { toast } from 'sonner';
import Modal from '../components/Modal';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { Plus, Search, DollarSign, TrendingUp, TrendingDown, CheckCircle, RefreshCw, Eye, AlertCircle, FileText, Ban } from 'lucide-react';
import { Page, PageHeader, PageGrid, MetricCard, FormField, FormGrid } from '@/components/primitives';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DataTable } from '@/components/DataTable';
import type { ColumnDef } from '@tanstack/react-table';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Badge } from '@/components/ui/badge';
import { useBranch } from '../contexts/BranchContext';
import { usePermissions } from '../modules/auth/hooks/usePermissions';
import { formatCurrencyBRL, formatDate, normalizeMoney } from '@/utils/formatters';
import { extractErrorMessage } from '@/utils/errorHandler';
import { PageSkeleton } from '@/components/feedback/PageSkeleton';

export interface FinancialRecord {
  id: string;
  type: 'PAYABLE' | 'RECEIVABLE';
  category: string;
  description: string;
  amount: number | string;
  dueDate: string;
  paymentDate: string | null;
  status: 'PENDING' | 'PAID' | 'CANCELLED';
  branchId?: string;
  companyId?: string;
  createdAt?: string;
}

const Financial: React.FC = () => {
  const queryClient = useQueryClient();
  const { activeBranch } = useBranch();
  const { can } = usePermissions();

  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<string>('');

  // Modals & Drawers
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<FinancialRecord | null>(null);
  const [payingRecord, setPayingRecord] = useState<FinancialRecord | null>(null);

  // Form State
  const [formType, setFormType] = useState<'PAYABLE' | 'RECEIVABLE'>('PAYABLE');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [dueDate, setDueDate] = useState('');

  const canManage = can('financial.manage') || can('invoice.receive_payment');

  // Listen for branch changes to invalidate query
  useEffect(() => {
    const handleBranchChange = () => {
      queryClient.invalidateQueries({ queryKey: ['financial'] });
    };
    window.addEventListener('autosync:branch-changed', handleBranchChange);
    return () => window.removeEventListener('autosync:branch-changed', handleBranchChange);
  }, [queryClient]);

  // Query: Fetch Financial Records
  const {
    data: records = [],
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery<FinancialRecord[]>({
    queryKey: ['financial', activeBranch?.id, filterType, filterStatus],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filterType) params.append('type', filterType);
      if (filterStatus) params.append('status', filterStatus);
      if (activeBranch?.id) params.append('branchId', activeBranch.id);
      const res = await api.get(`/financial?${params}`);
      return res.data;
    },
  });

  // Mutation: Create Financial Record
  const createMutation = useMutation({
    mutationFn: async (payload: { type: string; category: string; description: string; amount: number; dueDate: string }) => {
      const userStr = localStorage.getItem('user');
      const user = userStr ? JSON.parse(userStr) : {};
      const targetBranchId = activeBranch?.id || user?.branchId;
      const res = await api.post('/financial', {
        ...payload,
        branchId: targetBranchId,
      });
      return res.data;
    },
    onSuccess: () => {
      toast.success('Lançamento financeiro cadastrado com sucesso!');
      setShowCreateModal(false);
      resetForm();
      queryClient.invalidateQueries({ queryKey: ['financial'] });
    },
    onError: (err) => {
      toast.error(extractErrorMessage(err, 'Erro ao criar lançamento financeiro.'));
    },
  });

  // Mutation: Pay Record
  const payMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await api.patch(`/financial/${id}/pay`, {
        paymentDate: new Date().toISOString(),
      });
      return res.data;
    },
    onSuccess: () => {
      toast.success('Pagamento baixado com sucesso!');
      setPayingRecord(null);
      queryClient.invalidateQueries({ queryKey: ['financial'] });
    },
    onError: (err) => {
      toast.error(extractErrorMessage(err, 'Erro ao registrar pagamento.'));
    },
  });

  const resetForm = () => {
    setFormType('PAYABLE');
    setCategory('');
    setDescription('');
    setAmount('');
    setDueDate('');
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || parseFloat(amount) <= 0) {
      toast.error('Informe um valor monetário válido maior que zero.');
      return;
    }
    createMutation.mutate({
      type: formType,
      category: category.trim(),
      description: description.trim(),
      amount: parseFloat(amount),
      dueDate,
    });
  };

  // Calculations derived from real data
  const totalReceivablePending = records
    .filter((r) => r.type === 'RECEIVABLE' && r.status === 'PENDING')
    .reduce((a, r) => a + normalizeMoney(r.amount), 0);

  const totalPayablePending = records
    .filter((r) => r.type === 'PAYABLE' && r.status === 'PENDING')
    .reduce((a, r) => a + normalizeMoney(r.amount), 0);

  const totalNetRealized = records
    .filter((r) => r.status === 'PAID')
    .reduce((a, r) => a + (r.type === 'RECEIVABLE' ? normalizeMoney(r.amount) : -normalizeMoney(r.amount)), 0);

  const filtered = records.filter((r) => {
    const term = search.toLowerCase().trim();
    if (!term) return true;
    return (
      (r.category || '').toLowerCase().includes(term) ||
      (r.description || '').toLowerCase().includes(term) ||
      (r.id || '').toLowerCase().includes(term)
    );
  });

  const columns: ColumnDef<FinancialRecord>[] = [
    {
      accessorKey: 'type',
      header: 'Tipo',
      cell: ({ row }) => (
        <Badge
          variant="outline"
          className={`font-semibold text-[10px] ${
            row.getValue('type') === 'RECEIVABLE'
              ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
              : 'bg-rose-500/10 text-rose-600 border-rose-500/20'
          }`}
        >
          {row.getValue('type') === 'RECEIVABLE' ? 'A Receber' : 'A Pagar'}
        </Badge>
      ),
    },
    {
      accessorKey: 'category',
      header: 'Categoria',
      cell: ({ row }) => <span className="font-medium text-foreground text-xs">{row.getValue('category')}</span>,
    },
    {
      accessorKey: 'description',
      header: 'Descrição',
      cell: ({ row }) => (
        <span className="text-muted-foreground text-xs truncate max-w-[200px] block" title={row.getValue('description')}>
          {row.getValue('description') || '—'}
        </span>
      ),
    },
    {
      accessorKey: 'amount',
      header: 'Valor',
      cell: ({ row }) => (
        <span className="font-mono font-bold text-foreground text-xs">
          {formatCurrencyBRL(row.getValue('amount'))}
        </span>
      ),
    },
    {
      accessorKey: 'dueDate',
      header: 'Vencimento',
      cell: ({ row }) => <span className="font-mono text-muted-foreground text-xs">{formatDate(row.getValue('dueDate'))}</span>,
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => <StatusBadge status={row.getValue('status')} />,
    },
    {
      id: 'actions',
      cell: ({ row }) => (
        <div className="flex items-center justify-end gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSelectedRecord(row.original)}
            className="text-xs text-muted-foreground hover:text-foreground"
            title="Ver Detalhes"
          >
            <Eye className="h-3.5 w-3.5 mr-1" /> Detalhar
          </Button>

          {row.original.status === 'PENDING' && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => setPayingRecord(row.original)}
              disabled={!canManage}
              className={`text-xs font-semibold border-emerald-500/30 text-emerald-600 hover:bg-emerald-500/10 ${
                !canManage ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              <CheckCircle className="h-3.5 w-3.5 mr-1" /> Baixar
            </Button>
          )}
        </div>
      ),
    },
  ];

  if (isLoading) return <PageSkeleton />;

  return (
    <Page data-testid="financial-page">
      <PageHeader
        title="Financeiro & Conciliação Operacional"
        description={
          activeBranch
            ? `Controle de contas a pagar e receber para a unidade ${activeBranch.name}.`
            : 'Controle consolidado de lançamentos financeiros corporativos.'
        }
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              className="text-xs"
              title="Atualizar dados"
            >
              <RefreshCw className="h-3.5 w-3.5 mr-1.5" /> Atualizar
            </Button>
            <Button
              onClick={() => setShowCreateModal(true)}
              disabled={!canManage}
              size="lg"
              className={`shadow-xs font-semibold text-xs uppercase tracking-wider ${
                !canManage ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              <Plus className="mr-2 h-4 w-4" /> Novo Lançamento
            </Button>
          </div>
        }
      />

      {/* Metrics Section */}
      <PageGrid cols={3}>
        <MetricCard
          title="A Receber (Pendente)"
          value={formatCurrencyBRL(totalReceivablePending)}
          variant="success"
          icon={<TrendingUp className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />}
        />
        <MetricCard
          title="A Pagar (Pendente)"
          value={formatCurrencyBRL(totalPayablePending)}
          variant="danger"
          icon={<TrendingDown className="h-5 w-5 text-rose-600 dark:text-rose-400" />}
        />
        <MetricCard
          title="Saldo Realizado (Pago)"
          value={formatCurrencyBRL(totalNetRealized)}
          variant="primary"
          icon={<DollarSign className="h-5 w-5 text-sky-600 dark:text-sky-400" />}
        />
      </PageGrid>

      {/* Search & Filter Toolbar */}
      <div className="bg-card p-4 rounded-xl border border-border shadow-xs flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Buscar por categoria, descrição ou ID..."
            className="pl-9 h-10 text-xs"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          aria-label="Filtrar por Tipo"
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="h-10 rounded-lg border border-input bg-background px-3 text-xs focus:ring-1 focus:ring-primary outline-none min-w-[140px]"
        >
          <option value="">Todos os tipos</option>
          <option value="PAYABLE">A Pagar</option>
          <option value="RECEIVABLE">A Receber</option>
        </select>
        <select
          aria-label="Filtrar por Status"
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="h-10 rounded-lg border border-input bg-background px-3 text-xs focus:ring-1 focus:ring-primary outline-none min-w-[140px]"
        >
          <option value="">Todos os status</option>
          <option value="PENDING">Pendente</option>
          <option value="PAID">Pago</option>
          <option value="CANCELLED">Cancelado</option>
        </select>
        {(search || filterType || filterStatus) && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setSearch('');
              setFilterType('');
              setFilterStatus('');
            }}
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            Limpar Filtros
          </Button>
        )}
      </div>

      {isError && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 flex items-center gap-3">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <span className="text-xs font-semibold">{extractErrorMessage(error)}</span>
        </div>
      )}

      {/* Main Data Table */}
      <DataTable columns={columns} data={filtered} loading={isLoading} />

      {/* Modal: Create Financial Record */}
      <Modal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} title="Novo Lançamento Financeiro">
        <form onSubmit={handleCreateSubmit} className="flex flex-col gap-4">
          <FormGrid cols={2}>
            <FormField label="Tipo de Registro" htmlFor="fin-type" required>
              <select
                id="fin-type"
                aria-label="Tipo de Registro"
                value={formType}
                onChange={(e) => setFormType(e.target.value as any)}
                required
                className="h-10 rounded-lg border border-input bg-background px-3 text-xs focus:ring-1 focus:ring-primary outline-none"
              >
                <option value="PAYABLE">A Pagar (Despesa)</option>
                <option value="RECEIVABLE">A Receber (Receita)</option>
              </select>
            </FormField>
            <FormField label="Categoria" htmlFor="fin-cat" required>
              <Input
                id="fin-cat"
                placeholder="Ex: Peças, Aluguel, Serviços..."
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                required
                className="h-10 text-xs"
              />
            </FormField>
          </FormGrid>

          <FormField label="Descrição" htmlFor="fin-desc">
            <Input
              id="fin-desc"
              placeholder="Detalhes operacionais do lançamento"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="h-10 text-xs"
            />
          </FormField>

          <FormGrid cols={2}>
            <FormField label="Valor Monetário (R$)" htmlFor="fin-amount" required>
              <Input
                id="fin-amount"
                type="number"
                step="0.01"
                min="0.01"
                placeholder="0,00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
                className="h-10 text-xs font-mono"
              />
            </FormField>
            <FormField label="Data de Vencimento" htmlFor="fin-due" required>
              <Input
                id="fin-due"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                required
                className="h-10 text-xs font-mono"
              />
            </FormField>
          </FormGrid>

          <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-border/60">
            <Button type="button" variant="outline" size="sm" onClick={() => setShowCreateModal(false)}>
              Cancelar
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={createMutation.isPending}
              className="font-semibold text-xs"
            >
              {createMutation.isPending ? 'Salvando...' : 'Salvar Lançamento'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal: Detailed View Drawer */}
      <Modal
        isOpen={!!selectedRecord}
        onClose={() => setSelectedRecord(null)}
        title="Detalhamento do Lançamento Financeiro"
        width="600px"
      >
        {selectedRecord && (
          <div className="flex flex-col gap-4 p-1">
            <div className="flex items-center justify-between p-3 rounded-lg bg-surface-muted/60 border border-border/60">
              <div className="flex flex-col">
                <span className="text-[10px] uppercase font-bold text-muted-foreground">Identificador</span>
                <span className="text-xs font-mono font-bold text-foreground">{selectedRecord.id}</span>
              </div>
              <StatusBadge status={selectedRecord.status} />
            </div>

            <PageGrid cols={2}>
              <div className="p-3 rounded-lg border border-border/60 bg-card">
                <span className="text-[10px] uppercase font-bold text-muted-foreground block">Tipo</span>
                <span className="text-xs font-semibold text-foreground">
                  {selectedRecord.type === 'RECEIVABLE' ? 'A Receber (Receita)' : 'A Pagar (Despesa)'}
                </span>
              </div>
              <div className="p-3 rounded-lg border border-border/60 bg-card">
                <span className="text-[10px] uppercase font-bold text-muted-foreground block">Categoria</span>
                <span className="text-xs font-semibold text-foreground">{selectedRecord.category}</span>
              </div>
              <div className="p-3 rounded-lg border border-border/60 bg-card">
                <span className="text-[10px] uppercase font-bold text-muted-foreground block">Valor</span>
                <span className="text-sm font-mono font-bold text-primary">
                  {formatCurrencyBRL(selectedRecord.amount)}
                </span>
              </div>
              <div className="p-3 rounded-lg border border-border/60 bg-card">
                <span className="text-[10px] uppercase font-bold text-muted-foreground block">Data de Vencimento</span>
                <span className="text-xs font-mono text-foreground">{formatDate(selectedRecord.dueDate)}</span>
              </div>
            </PageGrid>

            {selectedRecord.description && (
              <div className="p-3 rounded-lg border border-border/60 bg-card flex flex-col gap-1">
                <span className="text-[10px] uppercase font-bold text-muted-foreground">Descrição</span>
                <p className="text-xs text-foreground leading-relaxed">{selectedRecord.description}</p>
              </div>
            )}

            {selectedRecord.paymentDate && (
              <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-300 flex items-center justify-between">
                <span className="text-xs font-semibold">Data do Pagamento Efetuado</span>
                <span className="text-xs font-mono font-bold">{formatDate(selectedRecord.paymentDate)}</span>
              </div>
            )}

            <div className="flex justify-end pt-3 border-t border-border/60">
              <Button onClick={() => setSelectedRecord(null)} size="sm" className="font-semibold text-xs">
                Fechar Detalhes
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Confirmation Dialog: Pay Record */}
      <ConfirmDialog
        isOpen={!!payingRecord}
        onClose={() => setPayingRecord(null)}
        onConfirm={() => payingRecord && payMutation.mutate(payingRecord.id)}
        title="Confirmar Baixa de Pagamento"
        description={`Deseja registrar o pagamento/recebimento do lançamento no valor de ${
          payingRecord ? formatCurrencyBRL(payingRecord.amount) : ''
        }? Esta ação atualizará o saldo da unidade.`}
        confirmText="Confirmar Baixa"
        cancelText="Cancelar"
        variant="primary"
        isLoading={payMutation.isPending}
      />
    </Page>
  );
};

export default Financial;
