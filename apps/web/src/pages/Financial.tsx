import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { toast } from 'sonner';
import Modal from '../components/Modal';
import { Plus, Search, DollarSign, TrendingUp, TrendingDown, CheckCircle } from 'lucide-react';
import { Page, PageHeader, PageGrid, MetricCard, FormField, FormGrid } from '@/components/primitives';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DataTable } from '@/components/DataTable';
import type { ColumnDef } from '@tanstack/react-table';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Badge } from '@/components/ui/badge';

interface FinancialRecord {
  id: string;
  type: 'PAYABLE' | 'RECEIVABLE';
  category: string;
  description: string;
  amount: number;
  dueDate: string;
  paymentDate: string | null;
  status: 'PENDING' | 'PAID' | 'CANCELLED';
}

const Financial: React.FC = () => {
  const [records, setRecords] = useState<FinancialRecord[]>([]);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  // Form
  const [formType, setFormType] = useState<'PAYABLE' | 'RECEIVABLE'>('PAYABLE');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [dueDate, setDueDate] = useState('');

  useEffect(() => {
    fetchRecords();
  }, [filterType, filterStatus]);

  const fetchRecords = async () => {
    try {
      const params = new URLSearchParams();
      if (filterType) params.append('type', filterType);
      if (filterStatus) params.append('status', filterStatus);
      const response = await api.get(`/financial?${params}`);
      setRecords(response.data);
    } catch {
      toast.error('Erro ao buscar registros financeiros.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      await api.post('/financial', {
        branchId: user.branchId,
        type: formType,
        category,
        description,
        amount: parseFloat(amount),
        dueDate,
      });
      toast.success('Registro financeiro criado com sucesso!');
      setShowModal(false);
      resetForm();
      fetchRecords();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erro ao criar registro.');
    }
  };

  const handlePay = async (id: string) => {
    try {
      await api.patch(`/financial/${id}/pay`, { paymentDate: new Date().toISOString() });
      toast.success('Pagamento registrado!');
      fetchRecords();
    } catch {
      toast.error('Erro ao registrar pagamento.');
    }
  };

  const resetForm = () => {
    setFormType('PAYABLE');
    setCategory('');
    setDescription('');
    setAmount('');
    setDueDate('');
  };

  const totalReceivable = records
    .filter((r) => r.type === 'RECEIVABLE' && r.status === 'PENDING')
    .reduce((a, r) => a + Number(r.amount || 0), 0);
  const totalPayable = records
    .filter((r) => r.type === 'PAYABLE' && r.status === 'PENDING')
    .reduce((a, r) => a + Number(r.amount || 0), 0);
  const totalPaid = records
    .filter((r) => r.status === 'PAID')
    .reduce((a, r) => a + (r.type === 'RECEIVABLE' ? Number(r.amount || 0) : -Number(r.amount || 0)), 0);

  const filtered = records.filter(
    (r) =>
      r.category?.toLowerCase().includes(search.toLowerCase()) ||
      r.description?.toLowerCase().includes(search.toLowerCase())
  );

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
      cell: ({ row }) => <span className="font-medium text-foreground">{row.getValue('category')}</span>,
    },
    {
      accessorKey: 'description',
      header: 'Descrição',
      cell: ({ row }) => <span className="text-muted-foreground text-xs">{row.getValue('description') || '—'}</span>,
    },
    {
      accessorKey: 'amount',
      header: 'Valor (R$)',
      cell: ({ row }) => (
        <span className="font-mono font-bold text-foreground">
          {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(row.getValue('amount') || 0))}
        </span>
      ),
    },
    {
      accessorKey: 'dueDate',
      header: 'Vencimento',
      cell: ({ row }) => (
        <span className="font-mono text-muted-foreground text-xs">
          {new Date(row.getValue('dueDate')).toLocaleDateString('pt-BR')}
        </span>
      ),
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => <StatusBadge status={row.getValue('status')} />,
    },
    {
      id: 'actions',
      cell: ({ row }) => (
        <div className="flex justify-end">
          {row.original.status === 'PENDING' && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => handlePay(row.original.id)}
              className="text-xs font-semibold border-emerald-500/30 text-emerald-600 hover:bg-emerald-500/10"
            >
              <CheckCircle className="h-3.5 w-3.5 mr-1" /> Pagar
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <Page>
      <PageHeader
        title="Financeiro & Contas"
        description="Gestão de contas a pagar, contas a receber, conciliação e fluxo de caixa corporativo."
        actions={
          <Button onClick={() => setShowModal(true)} size="lg" className="shadow-xs font-semibold text-xs uppercase tracking-wider">
            <Plus className="mr-2 h-4 w-4" /> Novo Registro
          </Button>
        }
      />

      <PageGrid cols={3}>
        <MetricCard
          title="Contas a Receber (Pendente)"
          value={new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalReceivable)}
          variant="success"
          icon={<TrendingUp className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />}
        />
        <MetricCard
          title="Contas a Pagar (Pendente)"
          value={new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalPayable)}
          variant="danger"
          icon={<TrendingDown className="h-5 w-5 text-rose-600 dark:text-rose-400" />}
        />
        <MetricCard
          title="Saldo Líquido Realizado"
          value={new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalPaid)}
          variant="primary"
          icon={<DollarSign className="h-5 w-5 text-sky-600 dark:text-sky-400" />}
        />
      </PageGrid>

      <div className="bg-card p-4 rounded-xl border border-border shadow-xs flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Pesquisar por categoria ou descrição..."
            className="pl-9 h-10 text-xs"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="h-10 rounded-lg border border-input bg-background px-3 text-xs focus:ring-1 focus:ring-primary outline-none min-w-[140px]"
        >
          <option value="">Todos os tipos</option>
          <option value="PAYABLE">A Pagar</option>
          <option value="RECEIVABLE">A Receber</option>
        </select>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="h-10 rounded-lg border border-input bg-background px-3 text-xs focus:ring-1 focus:ring-primary outline-none min-w-[140px]"
        >
          <option value="">Todos os status</option>
          <option value="PENDING">Pendente</option>
          <option value="PAID">Pago</option>
          <option value="CANCELLED">Cancelado</option>
        </select>
      </div>

      <DataTable columns={columns} data={filtered} loading={loading} />

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Novo Registro Financeiro">
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <FormGrid cols={2}>
            <FormField label="Tipo" htmlFor="fin-type" required>
              <select
                id="fin-type"
                value={formType}
                onChange={(e) => setFormType(e.target.value as any)}
                required
                className="h-10 rounded-lg border border-input bg-background px-3 text-xs focus:ring-1 focus:ring-primary outline-none"
              >
                <option value="PAYABLE">A Pagar</option>
                <option value="RECEIVABLE">A Receber</option>
              </select>
            </FormField>
            <FormField label="Categoria" htmlFor="fin-cat" required>
              <Input
                id="fin-cat"
                placeholder="Ex: Peças, Aluguel..."
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
              placeholder="Detalhes adicionais do lançamento"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="h-10 text-xs"
            />
          </FormField>

          <FormGrid cols={2}>
            <FormField label="Valor (R$)" htmlFor="fin-amount" required>
              <Input
                id="fin-amount"
                type="number"
                step="0.01"
                min="0.01"
                placeholder="0,00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
                className="h-10 text-xs"
              />
            </FormField>
            <FormField label="Vencimento" htmlFor="fin-due" required>
              <Input
                id="fin-due"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                required
                className="h-10 text-xs"
              />
            </FormField>
          </FormGrid>

          <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-border/60">
            <Button type="button" variant="outline" size="sm" onClick={() => setShowModal(false)}>
              Cancelar
            </Button>
            <Button type="submit" size="sm" className="font-semibold text-xs">
              Salvar Lançamento
            </Button>
          </div>
        </form>
      </Modal>
    </Page>
  );
};

export default Financial;
