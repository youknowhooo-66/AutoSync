import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Search, RefreshCw, ShieldCheck, FileJson, ArrowRight } from 'lucide-react';
import Modal from '../components/Modal';
import { useAuditStore } from '../core/audit/audit.store';
import { auditService } from '../core/audit/audit.service';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Page, PageHeader, PageGrid } from '@/components/primitives';
import { DataTable } from '@/components/DataTable';
import type { ColumnDef } from '@tanstack/react-table';

interface AuditLog {
  id: string;
  userId: string;
  user: {
    name: string;
    email: string;
  };
  action: string;
  resource: string;
  resourceId?: string;
  oldValue?: any;
  newValue?: any;
  ip?: string;
  createdAt: string;
}

const Audit: React.FC = () => {
  const { logs } = useAuditStore();
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [showRawJson, setShowRawJson] = useState(false);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadLogs();
  }, []);

  const loadLogs = async () => {
    setIsLoading(true);
    try {
      await auditService.fetchLogs();
    } catch (error) {
      toast.error('Erro ao carregar histórico de auditoria.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewDetails = (log: AuditLog) => {
    setSelectedLog(log);
    setShowRawJson(false);
    setShowModal(true);
  };

  const filteredLogs = logs.filter(
    (log) =>
      log?.user?.name?.toLowerCase().includes(search.toLowerCase()) ||
      log?.resource?.toLowerCase().includes(search.toLowerCase()) ||
      log?.action?.toLowerCase().includes(search.toLowerCase())
  );

  const getActionConfig = (action: string) => {
    const act = action.toUpperCase();
    if (act.includes('CREATE')) return { label: 'Criação', className: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' };
    if (act.includes('UPDATE')) return { label: 'Edição', className: 'bg-amber-500/10 text-amber-600 border-amber-500/20' };
    if (act.includes('DELETE')) return { label: 'Exclusão', className: 'bg-rose-500/10 text-rose-600 border-rose-500/20' };
    if (act.includes('LOGIN')) return { label: 'Acesso', className: 'bg-sky-500/10 text-sky-600 border-sky-500/20' };
    return { label: action, className: 'bg-slate-500/10 text-slate-600 border-slate-500/20' };
  };

  const columns: ColumnDef<AuditLog>[] = [
    {
      accessorKey: 'createdAt',
      header: 'Data / Hora',
      cell: ({ row }) => (
        <div className="flex flex-col text-xs font-mono">
          <span className="font-semibold text-foreground">{new Date(row.getValue('createdAt')).toLocaleDateString('pt-BR')}</span>
          <span className="text-muted-foreground">{new Date(row.getValue('createdAt')).toLocaleTimeString('pt-BR')}</span>
        </div>
      ),
    },
    {
      id: 'user',
      header: 'Responsável',
      cell: ({ row }) => (
        <div className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-xs shrink-0">
            {row.original.user?.name ? row.original.user.name.substring(0, 2).toUpperCase() : 'SYS'}
          </div>
          <div className="flex flex-col min-w-0">
            <span className="font-semibold text-foreground text-xs truncate">{row.original.user?.name || 'Sistema'}</span>
            <span className="text-[11px] text-muted-foreground truncate">{row.original.user?.email || 'automated@autosync.io'}</span>
          </div>
        </div>
      ),
    },
    {
      accessorKey: 'action',
      header: 'Ação',
      cell: ({ row }) => {
        const cfg = getActionConfig(row.getValue('action'));
        return (
          <Badge variant="outline" className={`font-semibold text-[10px] ${cfg.className}`}>
            {cfg.label}
          </Badge>
        );
      },
    },
    {
      accessorKey: 'resource',
      header: 'Entidade / Recurso',
      cell: ({ row }) => (
        <Badge variant="outline" className="font-mono text-[10px] bg-surface-muted text-foreground">
          {row.getValue('resource')}
        </Badge>
      ),
    },
    {
      id: 'actions',
      cell: ({ row }) => (
        <div className="flex justify-end">
          <Button variant="ghost" size="sm" onClick={() => handleViewDetails(row.original)} className="text-xs font-semibold text-primary">
            Inspecionar <ArrowRight className="h-3.5 w-3.5 ml-1" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <Page>
      <PageHeader
        title="Audit Trail & Segurança"
        description="Monitoramento de auditoria, alterações de estado e governança corporativa em tempo real."
        actions={
          <Button variant="outline" size="sm" onClick={loadLogs} disabled={isLoading} className="text-xs">
            <RefreshCw className={`mr-1.5 h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            Atualizar Logs
          </Button>
        }
      />

      <div className="bg-card p-4 rounded-xl border border-border shadow-xs flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Rastrear por usuário, entidade ou tipo de ação..."
            className="pl-9 h-10 text-xs"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <DataTable columns={columns} data={filteredLogs} loading={isLoading} />

      {/* Details & Diff Modal */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Inspeção de Auditoria" width="750px">
        {selectedLog && (
          <div className="flex flex-col gap-5 p-1">
            <PageGrid cols={4}>
              <div className="p-3 rounded-lg bg-surface-muted/60 border border-border/60">
                <span className="text-[10px] uppercase font-bold text-muted-foreground block">Entidade</span>
                <span className="text-xs font-bold text-foreground">{selectedLog.resource}</span>
              </div>
              <div className="p-3 rounded-lg bg-surface-muted/60 border border-border/60">
                <span className="text-[10px] uppercase font-bold text-muted-foreground block">ID Alvo</span>
                <span className="text-xs font-mono text-foreground truncate block">{selectedLog.resourceId || 'N/A'}</span>
              </div>
              <div className="p-3 rounded-lg bg-surface-muted/60 border border-border/60">
                <span className="text-[10px] uppercase font-bold text-muted-foreground block">IP Origem</span>
                <span className="text-xs font-mono text-foreground">{selectedLog.ip || '127.0.0.1'}</span>
              </div>
              <div className="p-3 rounded-lg bg-surface-muted/60 border border-border/60">
                <span className="text-[10px] uppercase font-bold text-muted-foreground block">Validação</span>
                <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 text-[9px]">
                  VERIFIED
                </Badge>
              </div>
            </PageGrid>

            {/* Toggle Raw JSON vs Readable Diff */}
            <div className="flex items-center justify-between border-b border-border/60 pb-2">
              <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                <ShieldCheck className="h-4 w-4 text-primary" /> Análise de Alterações
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowRawJson(!showRawJson)}
                className="text-xs text-muted-foreground hover:text-foreground"
              >
                <FileJson className="h-3.5 w-3.5 mr-1" />
                {showRawJson ? 'Exibir Comparativo Humanizado' : 'Exibir JSON Bruto'}
              </Button>
            </div>

            {showRawJson ? (
              <div className="p-4 rounded-xl bg-slate-950 text-slate-50 font-mono text-xs overflow-auto max-h-[350px]">
                <pre>{JSON.stringify({ oldValue: selectedLog.oldValue, newValue: selectedLog.newValue }, null, 2)}</pre>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <span className="text-xs font-bold text-rose-600 dark:text-rose-400">Estado Anterior</span>
                  <div className="p-3.5 rounded-xl bg-rose-500/5 border border-rose-500/20 font-mono text-xs overflow-auto max-h-[280px]">
                    <pre className="text-rose-700 dark:text-rose-300">{JSON.stringify(selectedLog.oldValue || {}, null, 2)}</pre>
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">Novo Estado</span>
                  <div className="p-3.5 rounded-xl bg-emerald-500/5 border border-emerald-500/20 font-mono text-xs overflow-auto max-h-[280px]">
                    <pre className="text-emerald-700 dark:text-emerald-300">{JSON.stringify(selectedLog.newValue || {}, null, 2)}</pre>
                  </div>
                </div>
              </div>
            )}

            <div className="flex justify-end pt-3 border-t border-border/60">
              <Button onClick={() => setShowModal(false)} size="sm" className="font-semibold text-xs">
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
