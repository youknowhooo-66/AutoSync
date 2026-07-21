import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../services/api';
import Modal from '../components/Modal';
import { Search, History, Eye, RefreshCw, AlertCircle, Shield, Calendar } from 'lucide-react';
import { Page, PageHeader } from '@/components/primitives';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DataTable } from '@/components/DataTable';
import type { ColumnDef } from '@tanstack/react-table';
import { Badge } from '@/components/ui/badge';
import { useBranch } from '../contexts/BranchContext';
import { AuditDiff } from '@/components/audit/AuditDiff';
import { formatDateTime } from '@/utils/formatters';
import { extractErrorMessage } from '@/utils/errorHandler';
import { PageSkeleton } from '@/components/feedback/PageSkeleton';

export interface AuditLog {
  id: string;
  userId?: string;
  user?: { id: string; name?: string; email?: string } | null;
  action: string;
  resource: string;
  resourceId?: string | null;
  oldValue?: any;
  newValue?: any;
  ip?: string | null;
  createdAt: string;
}

const ACTION_COLORS: Record<string, { label: string; className: string }> = {
  CREATE: { label: 'Criação', className: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' },
  UPDATE: { label: 'Atualização', className: 'bg-amber-500/10 text-amber-600 border-amber-500/20' },
  DELETE: { label: 'Remoção', className: 'bg-rose-500/10 text-rose-600 border-rose-500/20' },
  STATUS_CHANGE: { label: 'Troca de Status', className: 'bg-purple-500/10 text-purple-600 border-purple-500/20' },
};

const Audit: React.FC = () => {
  const { activeBranch } = useBranch();

  const [search, setSearch] = useState('');
  const [resourceFilter, setResourceFilter] = useState('');
  const [actionFilter, setActionFilter] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

  // Query: Fetch Audit Logs
  const {
    data: logs = [],
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery<AuditLog[]>({
    queryKey: ['audit', activeBranch?.id, resourceFilter, startDate, endDate],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (resourceFilter) params.append('resource', resourceFilter);
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);

      const res = await api.get(`/audit?${params.toString()}`);
      return res.data;
    },
  });

  const filtered = logs.filter((log) => {
    const term = search.toLowerCase().trim();
    const matchesSearch =
      (log.user?.name || '').toLowerCase().includes(term) ||
      (log.user?.email || '').toLowerCase().includes(term) ||
      (log.resource || '').toLowerCase().includes(term) ||
      (log.action || '').toLowerCase().includes(term) ||
      (log.id || '').toLowerCase().includes(term);

    const matchesAction = !actionFilter || log.action === actionFilter;

    return matchesSearch && matchesAction;
  });

  const columns: ColumnDef<AuditLog>[] = [
    {
      accessorKey: 'createdAt',
      header: 'Data / Hora',
      cell: ({ row }) => (
        <span className="font-mono text-xs text-foreground whitespace-nowrap">
          {formatDateTime(row.getValue('createdAt'))}
        </span>
      ),
    },
    {
      id: 'actor',
      header: 'Ator da Ação',
      cell: ({ row }) => (
        <div className="flex items-center gap-2 min-w-0">
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-[10px] shrink-0">
            {row.original.user?.name ? row.original.user.name.substring(0, 2).toUpperCase() : 'SYS'}
          </div>
          <div className="flex flex-col min-w-0">
            <span className="font-semibold text-foreground text-xs truncate">
              {row.original.user?.name || 'Sistema / API'}
            </span>
            <span className="text-[10px] text-muted-foreground truncate">{row.original.user?.email || 'Automação'}</span>
          </div>
        </div>
      ),
    },
    {
      accessorKey: 'action',
      header: 'Ação',
      cell: ({ row }) => {
        const act = row.getValue('action') as string;
        const info = ACTION_COLORS[act] || { label: act, className: 'bg-surface-muted text-foreground' };
        return (
          <Badge variant="outline" className={`font-semibold text-[10px] ${info.className}`}>
            {info.label}
          </Badge>
        );
      },
    },
    {
      accessorKey: 'resource',
      header: 'Entidade / Domínio',
      cell: ({ row }) => (
        <Badge variant="outline" className="font-mono text-[10px] bg-surface-muted text-foreground">
          {row.getValue('resource')}
        </Badge>
      ),
    },
    {
      accessorKey: 'ip',
      header: 'Endereço IP',
      cell: ({ row }) => <span className="font-mono text-[11px] text-muted-foreground">{row.getValue('ip') || '—'}</span>,
    },
    {
      id: 'actions',
      cell: ({ row }) => (
        <div className="flex justify-end">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSelectedLog(row.original)}
            className="text-xs font-semibold text-primary hover:bg-primary/10"
          >
            <Eye className="h-3.5 w-3.5 mr-1" /> Inspecionar Diff
          </Button>
        </div>
      ),
    },
  ];

  if (isLoading) return <PageSkeleton />;

  return (
    <Page data-testid="audit-page">
      <PageHeader
        title="Auditoria, Governança & Logs de Auditoria"
        description="Rastreabilidade completa de ações operacionais, alterações de dados e auditoria do ERP."
        actions={
          <Button variant="outline" size="sm" onClick={() => refetch()} className="text-xs" title="Atualizar">
            <RefreshCw className="h-3.5 w-3.5 mr-1.5" /> Atualizar Logs
          </Button>
        }
      />

      {/* Toolbar & Filters */}
      <div className="bg-card p-4 rounded-xl border border-border shadow-xs flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Pesquisar por ator, ação ou domínio..."
            className="pl-9 h-10 text-xs"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <select
          aria-label="Filtrar por Entidade"
          value={resourceFilter}
          onChange={(e) => setResourceFilter(e.target.value)}
          className="h-10 rounded-lg border border-input bg-background px-3 text-xs focus:ring-1 focus:ring-primary outline-none"
        >
          <option value="">Todas as Entidades</option>
          <option value="SUPPLIER">Fornecedor</option>
          <option value="OS">Ordem de Serviço</option>
          <option value="FINANCIAL">Financeiro</option>
          <option value="BRANCH">Filial</option>
          <option value="USER">Usuário</option>
          <option value="STOCK">Estoque</option>
        </select>

        <select
          aria-label="Filtrar por Ação"
          value={actionFilter}
          onChange={(e) => setActionFilter(e.target.value)}
          className="h-10 rounded-lg border border-input bg-background px-3 text-xs focus:ring-1 focus:ring-primary outline-none"
        >
          <option value="">Todas as Ações</option>
          <option value="CREATE">Criação</option>
          <option value="UPDATE">Atualização</option>
          <option value="DELETE">Remoção</option>
          <option value="STATUS_CHANGE">Troca de Status</option>
        </select>

        <div className="flex items-center gap-2 text-xs">
          <Calendar className="h-4 w-4 text-muted-foreground shrink-0" />
          <Input
            type="date"
            aria-label="Data Inicial"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="h-10 text-xs w-[130px]"
          />
          <span className="text-muted-foreground">até</span>
          <Input
            type="date"
            aria-label="Data Final"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="h-10 text-xs w-[130px]"
          />
        </div>

        {(search || resourceFilter || actionFilter || startDate || endDate) && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setSearch('');
              setResourceFilter('');
              setActionFilter('');
              setStartDate('');
              setEndDate('');
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

      {/* Inspection Modal with AuditDiff */}
      <Modal
        isOpen={!!selectedLog}
        onClose={() => setSelectedLog(null)}
        title="Detalhamento & Diff de Auditoria"
        width="650px"
      >
        {selectedLog && (
          <div className="flex flex-col gap-4 p-1">
            <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl bg-surface-muted/60 border border-border/60">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary shrink-0">
                  <Shield className="h-5 w-5" />
                </div>
                <div className="flex flex-col">
                  <span className="font-semibold text-xs text-foreground">
                    Log #{selectedLog.id.substring(0, 8)}
                  </span>
                  <span className="text-[11px] text-muted-foreground">
                    Ator: {selectedLog.user?.name || 'Sistema'} ({selectedLog.user?.email || 'Automação'})
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="font-mono text-[10px]">
                  {selectedLog.resource}
                </Badge>
                <Badge
                  variant="outline"
                  className={`font-semibold text-[10px] ${
                    ACTION_COLORS[selectedLog.action]?.className || ''
                  }`}
                >
                  {ACTION_COLORS[selectedLog.action]?.label || selectedLog.action}
                </Badge>
              </div>
            </div>

            <AuditDiff before={selectedLog.oldValue} after={selectedLog.newValue} />

            <div className="flex justify-end pt-3 border-t border-border/60">
              <Button onClick={() => setSelectedLog(null)} size="sm" className="font-semibold text-xs">
                Fechar Inspeção
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </Page>
  );
};

export default Audit;
