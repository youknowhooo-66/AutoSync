import React, { useState } from 'react';
import { useServiceOrderFinance } from '../hooks/useServiceOrderFinance';
import { useAuth } from '@/modules/auth/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import {
  DollarSign,
  Calendar,
  Lock,
  CheckCircle2,
  AlertCircle,
  Coins,
  FileText,
  Clock
} from 'lucide-react';

interface Props {
  serviceOrderId: string;
  status: string;
  finishedAt?: string | null;
}

export function ServiceOrderFinanceSection({ serviceOrderId, status, finishedAt }: Props) {
  const { user } = useAuth();
  
  // Only enable the finance state query if the OS is in FINISHED/COMPLETED status
  const isFinished = status === 'FINISHED' || status === 'COMPLETED';
  
  const {
    financeState,
    isLoading,
    generateReceivable,
    isGenerating
  } = useServiceOrderFinance(isFinished ? serviceOrderId : '');

  const [dueDate, setDueDate] = useState('');
  const [validationError, setValidationError] = useState('');

  const isAuthorized = user?.role === 'ADMIN' || user?.role === 'MANAGER' || user?.role === 'FINANCIAL';

  // 1. If OS is not finished yet, show a pre-requisite alert
  if (!isFinished) {
    return (
      <div className="p-5 rounded-xl border border-border bg-card/50 flex items-start gap-4">
        <Clock className="w-5 h-5 text-indigo-400 mt-0.5 shrink-0" />
        <div className="flex flex-col gap-1">
          <h3 className="text-sm font-semibold text-slate-200">Faturamento da OS</h3>
          <p className="text-xs text-muted-foreground leading-relaxed">
            A Ordem de Serviço deve ser finalizada (status Concluída) para que a obrigação financeira seja gerada.
          </p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex justify-center p-8">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError('');

    if (!dueDate) {
      setValidationError('Selecione uma data de vencimento.');
      return;
    }

    // Basic date parsing and check
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dueDate);
    if (!match) {
      setValidationError('Formato de data inválido.');
      return;
    }

    const year = Number(match[1]);
    const month = Number(match[2]);
    const day = Number(match[3]);
    const selectedDate = new Date(Date.UTC(year, month - 1, day, 12));

    if (finishedAt) {
      const finishedDate = new Date(finishedAt);
      const finishedDateCivil = new Date(Date.UTC(
        finishedDate.getFullYear(),
        finishedDate.getMonth(),
        finishedDate.getDate(),
        12
      ));

      if (selectedDate.getTime() < finishedDateCivil.getTime()) {
        setValidationError('A data de vencimento não pode ser anterior à data de conclusão da OS.');
        return;
      }
    }

    try {
      await generateReceivable(dueDate);
      toast.success('Contas a receber gerado com sucesso!');
    } catch (err: any) {
      const errMsg = err.response?.data?.message || 'Erro ao gerar obrigação financeira.';
      toast.error(errMsg);
    }
  };

  const fState = financeState?.status;

  return (
    <div className="flex flex-col gap-5 p-5 rounded-xl border border-border bg-card/50">
      <div className="flex items-center justify-between border-b border-border/50 pb-3">
        <h3 className="text-sm font-semibold uppercase tracking-wider flex items-center gap-2">
          <Coins className="w-4 h-4 text-primary" />
          Faturamento & Financeiro
        </h3>
      </div>

      {/* 2. NOT_REQUIRED: Zero values */}
      {fState === 'NOT_REQUIRED' && (
        <div className="p-4 rounded-lg bg-slate-900 border border-slate-800 text-xs flex gap-3 items-start animate-in fade-in duration-300">
          <AlertCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
          <div className="flex flex-col gap-1">
            <span className="font-semibold text-slate-300">Sem cobrança necessária</span>
            <p className="text-slate-500">
              Esta Ordem de Serviço possui orçamento aprovado com valor líquido zerado (R$ 0,00). Nenhuma obrigação financeira a receber precisa ser registrada.
            </p>
          </div>
        </div>
      )}

      {/* 3. GENERATED: Accounts receivable already billed */}
      {fState === 'GENERATED' && (
        <div className="flex flex-col gap-4 p-4 rounded-lg border border-emerald-500/20 bg-emerald-500/5 shadow-lg shadow-emerald-500/2 animate-in fade-in duration-300">
          <div className="flex items-center gap-2 pb-2 border-b border-emerald-500/10">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            <span className="text-xs font-semibold text-emerald-400">Contas a Receber Gerado</span>
          </div>

          <div className="grid grid-cols-2 gap-4 text-xs text-slate-350">
            <div className="flex flex-col gap-0.5 p-2.5 rounded bg-emerald-950/20 border border-emerald-500/5">
              <span className="text-emerald-500/70 font-medium">Valor Gerado</span>
              <span className="text-sm font-bold text-slate-200">
                R$ {Number(financeState?.receivable?.amount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </span>
            </div>
            <div className="flex flex-col gap-0.5 p-2.5 rounded bg-emerald-950/20 border border-emerald-500/5">
              <span className="text-emerald-500/70 font-medium">Status do Título</span>
              <span className="text-sm font-bold text-slate-200">
                {financeState?.receivable?.status === 'PAID' ? 'Pago' : financeState?.receivable?.status === 'CANCELLED' ? 'Cancelado' : 'Pendente'}
              </span>
            </div>
            <div className="flex flex-col gap-0.5 p-2.5 rounded bg-emerald-950/20 border border-emerald-500/5">
              <span className="text-emerald-500/70 font-medium">Vencimento</span>
              <span className="text-sm font-bold text-slate-200">
                {financeState?.receivable?.dueDate ? new Date(financeState.receivable.dueDate).toLocaleDateString('pt-BR', { timeZone: 'UTC' }) : 'N/A'}
              </span>
            </div>
            <div className="flex flex-col gap-0.5 p-2.5 rounded bg-emerald-950/20 border border-emerald-500/5">
              <span className="text-emerald-500/70 font-medium font-mono">ID do Título</span>
              <span className="text-xs font-semibold text-slate-400 font-mono">
                #{financeState?.receivable?.id.substring(0, 8).toUpperCase()}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* 4. NOT_GENERATED: Billing form */}
      {fState === 'NOT_GENERATED' && (
        <div className="flex flex-col gap-4 animate-in fade-in duration-300">
          <div className="p-4 rounded-lg bg-indigo-500/5 border border-indigo-500/10 text-xs flex gap-3 items-start">
            <DollarSign className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
            <div className="flex flex-col gap-1">
              <span className="font-semibold text-indigo-400">Pronto para faturar</span>
              <p className="text-slate-350">
                A OS foi concluída com valor aprovado de <strong className="text-indigo-300">R$ {Number(financeState?.finalValue).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong>. Defina a data de vencimento para registrar o recebível.
              </p>
            </div>
          </div>

          {!isAuthorized ? (
            <div className="p-4 rounded-lg bg-slate-900 border border-slate-800 text-xs flex gap-3 items-start">
              <Lock className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
              <div className="flex flex-col gap-1">
                <span className="font-semibold text-slate-400">Acesso Restrito</span>
                <p className="text-slate-500">
                  Apenas usuários com perfil de Administrador, Gerente ou Financeiro podem gerar obrigações financeiras.
                </p>
              </div>
            </div>
          ) : (
            <form onSubmit={handleGenerate} className="flex flex-col gap-4">
              <div className="flex flex-col gap-2 max-w-sm">
                <label htmlFor="due-date" className="text-xs font-semibold text-slate-350 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  Data de Vencimento
                </label>
                <input
                  id="due-date"
                  type="date"
                  className="flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 placeholder:text-muted-foreground dark:bg-input/30"
                  value={dueDate}
                  onChange={(e) => {
                    setDueDate(e.target.value);
                    if (validationError) setValidationError('');
                  }}
                />
                {validationError && (
                  <span className="text-xs text-rose-400 font-medium">{validationError}</span>
                )}
              </div>

              <div className="flex justify-end mt-2">
                <Button
                  id="generate-receivable-btn"
                  type="submit"
                  disabled={isGenerating}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold shadow-md shadow-indigo-600/10 px-5 py-2.5 rounded-lg transition-all duration-200 flex items-center gap-2"
                >
                  {isGenerating ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <Coins className="w-4 h-4" />
                  )}
                  Gerar Título a Receber
                </Button>
              </div>
            </form>
          )}
        </div>
      )}
    </div>
  );
}
