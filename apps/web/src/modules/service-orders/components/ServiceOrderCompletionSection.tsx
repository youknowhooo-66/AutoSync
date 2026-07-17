import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useServiceOrderCompletion } from '../hooks/useServiceOrderCompletion';
import { useAuth } from '@/modules/auth/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import {
  CheckCircle2,
  AlertTriangle,
  ClipboardCheck,
  XCircle,
  Clock,
  Lock,
  MessageSquare
} from 'lucide-react';
import type { CompletionBlockerCode } from '../types/completion.types';

interface Props {
  serviceOrderId: string;
  status: string;
  finishedAt?: string | null;
  finishedBy?: { name: string } | null;
  completionNotes?: string | null;
}

const BLOCKER_LABELS: Record<CompletionBlockerCode, string> = {
  INVALID_SERVICE_ORDER_STATUS: 'Status inválido para conclusão',
  APPROVAL_NOT_APPROVED: 'Orçamento aprovado vigente não encontrado',
  APPROVAL_SNAPSHOT_MISMATCH: 'Divergência de versão do snapshot de orçamento',
  DIAGNOSIS_MISSING: 'Diagnóstico técnico obrigatório não registrado',
  SERVICE_MISSING: 'Serviço planejado ausente na Ordem de Serviço',
  SERVICE_NOT_COMPLETED: 'Serviço pendente de conclusão técnica',
  SERVICE_SNAPSHOT_MISMATCH: 'Divergência entre o serviço e o snapshot aprovado',
  UNAPPROVED_SERVICE_PRESENT: 'Serviço não aprovado presente na OS',
  PART_MISSING: 'Peça planejada ausente na Ordem de Serviço',
  PART_NOT_FULLY_CONSUMED: 'Baixa/consumo físico de peças incompleto',
  PART_SNAPSHOT_MISMATCH: 'Divergência entre a peça e o snapshot aprovado',
  UNAPPROVED_PART_PRESENT: 'Peça não aprovada presente na OS',
  MOVEMENT_LEDGER_MISMATCH: 'Divergência na reconciliação do ledger de estoque',
};

export function ServiceOrderCompletionSection({
  serviceOrderId,
  status,
  finishedAt,
  finishedBy,
  completionNotes
}: Props) {
  const { user } = useAuth();
  const {
    readiness,
    isLoadingReadiness,
    complete,
    isCompleting
  } = useServiceOrderCompletion(serviceOrderId);

  const [notes, setNotes] = useState('');
  const [validationError, setValidationError] = useState('');

  const isFinished = status === 'FINISHED' || status === 'COMPLETED';
  const isCanceled = status === 'CANCELED' || status === 'CANCELLED';

  // 1. Finalized OS Card
  if (isFinished) {
    return (
      <div className="flex flex-col gap-4 p-5 rounded-xl border border-emerald-500/20 bg-emerald-500/5 shadow-lg shadow-emerald-500/2 animate-in fade-in duration-300">
        <div className="flex items-center gap-3 border-b border-emerald-500/10 pb-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-500" />
          <h3 className="text-sm font-semibold uppercase tracking-wider text-emerald-400">
            Ordem de Serviço Concluída
          </h3>
        </div>
        <div className="grid grid-cols-2 gap-4 text-xs text-slate-300">
          <div className="flex flex-col gap-1 p-3 rounded-lg bg-emerald-950/20 border border-emerald-500/10">
            <span className="font-semibold text-emerald-500/70">Data de Encerramento</span>
            <span>{finishedAt ? new Date(finishedAt).toLocaleString('pt-BR') : 'N/A'}</span>
          </div>
          <div className="flex flex-col gap-1 p-3 rounded-lg bg-emerald-950/20 border border-emerald-500/10">
            <span className="font-semibold text-emerald-500/70">Encerreado por</span>
            <span>{finishedBy?.name || 'Administrador'}</span>
          </div>
        </div>
        {completionNotes && (
          <div className="flex flex-col gap-1.5 p-3 rounded-lg bg-emerald-950/20 border border-emerald-500/10 text-xs">
            <span className="font-semibold text-emerald-500/70 flex items-center gap-1">
              <MessageSquare className="w-3.5 h-3.5" />
              Parecer Técnico de Conclusão
            </span>
            <p className="text-slate-200 whitespace-pre-wrap">{completionNotes}</p>
          </div>
        )}
      </div>
    );
  }

  // 2. Canceled OS Card
  if (isCanceled) {
    return (
      <div className="p-6 bg-slate-900/50 backdrop-blur-md rounded-xl border border-red-500/30 text-center shadow-xl">
        <h3 className="text-lg font-semibold text-red-400 mb-2">Ordem de Serviço Cancelada</h3>
        <p className="text-sm text-slate-400">
          Esta Ordem de Serviço foi cancelada e não permite novos processos ou conclusões.
        </p>
      </div>
    );
  }

  // 3. Draft/Open OS waiting for Work to start
  if (status === 'OPEN' || status === 'DIAGNOSIS') {
    return (
      <div className="p-5 rounded-xl border border-border bg-card/50 flex items-start gap-4">
        <Clock className="w-5 h-5 text-indigo-400 mt-0.5 shrink-0" />
        <div className="flex flex-col gap-1">
          <h3 className="text-sm font-semibold text-slate-200">Aguardando Execução</h3>
          <p className="text-xs text-muted-foreground leading-relaxed">
            A OS deve ser colocada em andamento (status Em Execução) após o diagnóstico técnico para que as validações de encerramento sejam processadas.
          </p>
        </div>
      </div>
    );
  }

  // 4. In Progress OS - Check readiness gates
  if (isLoadingReadiness) {
    return (
      <div className="flex justify-center p-8">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const isReady = readiness?.ready;
  const blockers = readiness?.blockers || [];

  const isManagerOrAdmin = user?.role === 'ADMIN' || user?.role === 'MANAGER';

  const handleCompleteOS = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError('');

    if (!notes || notes.trim().length < 5) {
      setValidationError('As observações devem conter no mínimo 5 caracteres.');
      return;
    }

    if (notes.trim().length > 2000) {
      setValidationError('As observações excedem o limite de 2000 caracteres.');
      return;
    }

    try {
      await complete(notes);
      toast.success('Ordem de Serviço finalizada com sucesso!');
      setNotes('');
    } catch (err: any) {
      const errMsg = err.response?.data?.message || 'Erro ao finalizar a Ordem de Serviço';
      toast.error(errMsg);
    }
  };

  return (
    <div className="flex flex-col gap-5 p-5 rounded-xl border border-border bg-card/50">
      <div className="flex items-center justify-between border-b border-border/50 pb-3">
        <h3 className="text-sm font-semibold uppercase tracking-wider flex items-center gap-2">
          <ClipboardCheck className="w-4 h-4 text-primary" />
          Encerramento da Ordem de Serviço
        </h3>
      </div>

      {!isReady ? (
        <div className="flex flex-col gap-4">
          <div className="p-4 rounded-lg bg-amber-500/5 border border-amber-500/20 text-xs flex gap-3 items-start">
            <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
            <div className="flex flex-col gap-1">
              <span className="font-semibold text-amber-400">Restrições Pendentes</span>
              <p className="text-slate-300 leading-relaxed">
                Para fechar esta Ordem de Serviço, resolva todas as pendências abaixo:
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            {blockers.map((blocker, idx) => (
              <div
                key={idx}
                className="flex items-start gap-2.5 p-3 rounded-lg bg-background border border-border/50 text-xs"
              >
                <XCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                <div className="flex flex-col gap-0.5">
                  <span className="font-semibold text-slate-200">
                    {BLOCKER_LABELS[blocker.code] || blocker.code}
                  </span>
                  <p className="text-muted-foreground">{blocker.message}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-4 animate-in fade-in duration-300">
          <div className="p-4 rounded-lg bg-emerald-500/5 border border-emerald-500/20 text-xs flex gap-3 items-start">
            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
            <div className="flex flex-col gap-1">
              <span className="font-semibold text-emerald-400">Todos os gates atendidos</span>
              <p className="text-slate-350">
                Peças totalmente consumidas, execução técnica finalizada e diagnóstico registrado. A OS está pronta para encerramento.
              </p>
            </div>
          </div>

          {!isManagerOrAdmin ? (
            <div className="p-4 rounded-lg bg-slate-900 border border-slate-800 text-xs flex gap-3 items-start">
              <Lock className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
              <div className="flex flex-col gap-1">
                <span className="font-semibold text-slate-400">Acesso Restrito</span>
                <p className="text-slate-500">
                  Apenas usuários com perfil de Administrador ou Gerente podem realizar a conclusão desta OS.
                </p>
              </div>
            </div>
          ) : (
            <form onSubmit={handleCompleteOS} className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <label htmlFor="completion-notes" className="text-xs font-semibold text-slate-300">
                  Parecer Técnico de Conclusão <span className="text-rose-500">*</span>
                </label>
                <textarea
                  id="completion-notes"
                  placeholder="Escreva um detalhamento técnico das ações realizadas para justificar o encerramento do serviço..."
                  className="flex min-h-[100px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 placeholder:text-muted-foreground resize-none dark:bg-input/30"
                  value={notes}
                  onChange={(e) => {
                    setNotes(e.target.value);
                    if (validationError) setValidationError('');
                  }}
                />
                {validationError && (
                  <span className="text-xs text-rose-400 font-medium">{validationError}</span>
                )}
              </div>

              <div className="flex justify-end mt-1">
                <Button
                  id="complete-os-btn"
                  type="submit"
                  disabled={isCompleting}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold shadow-md shadow-indigo-600/10 px-5 py-2.5 rounded-lg transition-all duration-200 flex items-center gap-2"
                >
                  {isCompleting ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <CheckCircle2 className="w-4 h-4" />
                  )}
                  Encerrar Ordem de Serviço
                </Button>
              </div>
            </form>
          )}
        </div>
      )}
    </div>
  );
}
