import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { 
  MdHistory, 
  MdSearch, 
  MdInfo, 
  MdRefresh, 
  MdOutlineShield, 
  MdFilterList,
  MdArrowForwardIos,
  MdTerminal
} from 'react-icons/md';
import Modal from '../components/Modal';
import { useAuditStore } from '../core/audit/audit.store';
import { auditService } from '../core/audit/audit.service';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

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
    setShowModal(true);
  };

  const filteredLogs = logs.filter(log =>
    log?.user?.name?.toLowerCase().includes(search.toLowerCase()) ||
    log?.resource?.toLowerCase().includes(search.toLowerCase()) ||
    log?.action?.toLowerCase().includes(search.toLowerCase())
  );

  const getActionConfig = (action: string) => {
    const act = action.toUpperCase();
    if (act.includes('CREATE')) return { color: '#10b981', label: 'Criação' };
    if (act.includes('UPDATE')) return { color: '#f59e0b', label: 'Edição' };
    if (act.includes('DELETE')) return { color: '#ef4444', label: 'Exclusão' };
    if (act.includes('LOGIN')) return { color: '#3b82f6', label: 'Acesso' };
    if (act.includes('STATUS')) return { color: '#8b5cf6', label: 'Status' };
    return { color: 'var(--text-secondary)', label: action };
  };

  return (
    <div className="flex flex-col gap-8 animate-in fade-in duration-700">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2 text-primary">
            <MdOutlineShield size={18} />
            <span className="text-xs font-bold uppercase tracking-widest">Segurança & Rastreabilidade</span>
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight">Audit Trail</h1>
          <p className="text-muted-foreground max-w-md">Monitore todas as mutações de estado e ações administrativas em tempo real.</p>
        </div>
        
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={loadLogs} disabled={isLoading} className="rounded-xl border-border/40 bg-card/30 backdrop-blur-sm">
            <MdRefresh className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
          <Button variant="secondary" size="sm" className="rounded-xl">
            <MdFilterList className="mr-2 h-4 w-4" />
            Filtros Avançados
          </Button>
        </div>
      </div>

      {/* Search & Stats Bar */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        <div className="lg:col-span-3 relative group">
          <MdSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" size={20} />
          <input
            type="text"
            placeholder="Rastrear por usuário, recurso (OS, CLIENT, STOCK) ou tipo de ação..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-14 pl-12 pr-4 rounded-2xl bg-card/40 border border-border/50 backdrop-blur-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm"
          />
        </div>
        <div className="bg-primary/5 rounded-2xl border border-primary/10 p-4 flex flex-col justify-center">
          <span className="text-[10px] uppercase font-bold text-primary tracking-wider">Total de Registros</span>
          <span className="text-2xl font-black text-primary">{filteredLogs.length}</span>
        </div>
      </div>

      {/* Logs Table */}
      <div className="rounded-2xl border border-border/50 bg-card/30 backdrop-blur-sm overflow-hidden shadow-2xl shadow-black/20">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-border/40 bg-muted/20">
                <th className="text-left py-4 px-6 text-xs font-bold uppercase tracking-wider text-muted-foreground">Timestamp</th>
                <th className="text-left py-4 px-6 text-xs font-bold uppercase tracking-wider text-muted-foreground">Responsável</th>
                <th className="text-left py-4 px-6 text-xs font-bold uppercase tracking-wider text-muted-foreground">Ação</th>
                <th className="text-left py-4 px-6 text-xs font-bold uppercase tracking-wider text-muted-foreground">Entidade</th>
                <th className="text-right py-4 px-6 text-xs font-bold uppercase tracking-wider text-muted-foreground"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/20">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan={5} className="py-8 px-6"><div className="h-4 bg-muted/40 rounded w-full" /></td>
                  </tr>
                ))
              ) : filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-20 text-center">
                    <MdHistory size={48} className="mx-auto text-muted-foreground/20 mb-4" />
                    <p className="text-muted-foreground font-medium">Nenhuma atividade registrada no período.</p>
                  </td>
                </tr>
              ) : filteredLogs.map((log) => {
                const config = getActionConfig(log.action);
                return (
                  <tr key={log.id} className="hover:bg-primary/5 transition-colors group cursor-pointer" onClick={() => handleViewDetails(log)}>
                    <td className="py-4 px-6 text-xs font-mono text-muted-foreground">
                      {new Date(log.createdAt).toLocaleDateString('pt-BR')} <br/>
                      <span className="opacity-60">{new Date(log.createdAt).toLocaleTimeString('pt-BR')}</span>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-secondary flex items-center justify-center text-[10px] font-bold">
                          {log?.user?.name?.substring(0, 2).toUpperCase() || 'SYS'}
                        </div>
                        <div className="flex flex-col">
                          <span className="text-sm font-semibold text-foreground leading-tight">{log?.user?.name || 'Sistema'}</span>
                          <span className="text-[10px] text-muted-foreground">{log?.user?.email || 'automated@autosync.io'}</span>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: config.color }} />
                        <span className="text-xs font-bold uppercase" style={{ color: config.color }}>{config.label}</span>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <Badge variant="outline" className="font-mono text-[10px] bg-muted/30 border-border/30">
                        {log.resource}
                      </Badge>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <MdArrowForwardIos size={14} className="ml-auto text-muted-foreground group-hover:text-primary transition-all group-hover:translate-x-1" />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Details Modal */}
      <Modal 
        isOpen={showModal} 
        onClose={() => setShowModal(false)} 
        title="Inspeção de Payload" 
        width="700px"
      >
        {selectedLog && (
          <div className="flex flex-col gap-6 p-2">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-3 rounded-xl bg-muted/30 border border-border/40">
                <span className="text-[10px] uppercase font-bold text-muted-foreground block mb-1">Entidade</span>
                <span className="text-sm font-bold">{selectedLog.resource}</span>
              </div>
              <div className="p-3 rounded-xl bg-muted/30 border border-border/40">
                <span className="text-[10px] uppercase font-bold text-muted-foreground block mb-1">ID Alvo</span>
                <span className="text-sm font-mono truncate block" title={selectedLog.resourceId}>{selectedLog.resourceId || 'N/A'}</span>
              </div>
              <div className="p-3 rounded-xl bg-muted/30 border border-border/40">
                <span className="text-[10px] uppercase font-bold text-muted-foreground block mb-1">Origem IP</span>
                <span className="text-sm font-mono">{selectedLog.ip || '127.0.0.1'}</span>
              </div>
              <div className="p-3 rounded-xl bg-muted/30 border border-border/40">
                <span className="text-[10px] uppercase font-bold text-muted-foreground block mb-1">Status</span>
                <Badge className="bg-green-500/10 text-green-500 border-green-500/20 text-[9px]">VERIFIED</Badge>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-2 text-muted-foreground">
                <MdTerminal size={16} />
                <span className="text-xs font-bold uppercase tracking-wider">Análise de Diferenças</span>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <span className="text-[10px] uppercase font-bold text-red-400 ml-1">Estado Anterior</span>
                  <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800 font-mono text-[11px] overflow-auto max-h-[300px]">
                    <pre className="text-red-400/80">{JSON.stringify(selectedLog.oldValue || {}, null, 2)}</pre>
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <span className="text-[10px] uppercase font-bold text-green-400 ml-1">Novo Estado</span>
                  <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800 font-mono text-[11px] overflow-auto max-h-[300px]">
                    <pre className="text-green-400/80">{JSON.stringify(selectedLog.newValue || {}, null, 2)}</pre>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="mt-2 flex justify-end">
              <Button onClick={() => setShowModal(false)} className="rounded-xl">Fechar Detalhes</Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Audit;
