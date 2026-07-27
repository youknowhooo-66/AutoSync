import React, { useState } from 'react';
import { useServiceOrderStockConsumption } from '../hooks/useServiceOrderStockConsumption';
import { useServiceOrderExecution } from '../hooks/useServiceOrderExecution';
import { useAuth } from '@/modules/auth/hooks/useAuth';
import { useServiceOrderApproval } from '../hooks/useServiceOrderApproval';
import type { ServiceOrderPartConsumption } from '../types/stockConsumption.types';

interface ServiceOrderStockConsumptionSectionProps {
  serviceOrderId: string;
}

export function ServiceOrderStockConsumptionSection({ serviceOrderId }: ServiceOrderStockConsumptionSectionProps) {
  const { user } = useAuth();
  const {
    partsConsumption,
    isLoading: isLoadingConsumption,
    consume,
    isConsuming
  } = useServiceOrderStockConsumption(serviceOrderId);

  const {
    execution,
    isLoading: isLoadingExecution
  } = useServiceOrderExecution(serviceOrderId);

  const { data: latestApproval, isLoading: isLoadingApproval } = useServiceOrderApproval(serviceOrderId);

  const [quantities, setQuantities] = useState<Record<string, string>>({});

  const isBudgetApproved = latestApproval?.status === 'APPROVED';
  const hasExecutionActive = execution.some((s: any) =>
    ['ASSIGNED', 'IN_PROGRESS', 'PAUSED'].includes(s.executionStatus)
  );

  const isLoading = isLoadingConsumption || isLoadingExecution || isLoadingApproval;

  if (isLoading) {
    return (
      <div className="flex justify-center p-8">
        <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  // Preconditions check
  if (!isBudgetApproved) {
    return (
      <div className="p-6 bg-slate-900/50 backdrop-blur-md rounded-xl border border-red-500/30 text-center shadow-xl">
        <h3 className="text-lg font-semibold text-red-400 mb-2">Consumo de Estoque Bloqueado</h3>
        <p className="text-sm text-slate-400">
          A saída de estoque física só é permitida após a aprovação formal do orçamento correspondente.
        </p>
      </div>
    );
  }

  if (!hasExecutionActive) {
    return (
      <div className="p-6 bg-slate-900/50 backdrop-blur-md rounded-xl border border-amber-500/30 text-center shadow-xl">
        <h3 className="text-lg font-semibold text-amber-400 mb-2">Aguardando Execução Técnica</h3>
        <p className="text-sm text-slate-400">
          A baixa física de peças exige que a execução da Ordem de Serviço tenha sido iniciada (ao menos um serviço atribuído ou em andamento).
        </p>
      </div>
    );
  }

  // Authorization check
  const isFinancial = user?.role === 'FINANCIAL';
  const isAttendant = user?.role === 'ATTENDANT';
  const isMechanic = user?.role === 'MECHANIC';

  // Mechanic can only consume if assigned to at least one service on this OS
  const isAssignedMechanic = isMechanic && execution.some((s: any) => s.technicianId === user?.id);
  const canConsume = !isFinancial && !isAttendant && (!isMechanic || isAssignedMechanic);

  const handleConsume = async (partId: string, item: ServiceOrderPartConsumption) => {
    const qtyStr = quantities[partId];
    const qty = Number(qtyStr);

    if (isNaN(qty) || qty <= 0) {
      alert('Por favor, informe uma quantidade válida maior que zero');
      return;
    }

    if (qty > item.remainingQuantity) {
      alert(`Quantidade excede a planejada restante (${item.remainingQuantity})`);
      return;
    }

    if (qty > item.availableStock) {
      alert(`Saldo físico insuficiente em estoque (${item.availableStock} disponíveis)`);
      return;
    }

    // Generate unique idempotency key
    const idempotencyKey = crypto.randomUUID ? crypto.randomUUID() : 'idemp-' + Math.random().toString(36).substr(2, 9);

    try {
      await consume({ partId, quantity: qty, idempotencyKey });
      setQuantities(prev => ({ ...prev, [partId]: '' }));
    } catch (err: any) {
      alert(err.response?.data?.message || 'Erro ao registrar consumo de estoque');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
          <span className="w-2 h-6 bg-emerald-500 rounded-full"></span>
          Consumo Físico de Peças (Estoque)
        </h2>
      </div>

      <div className="space-y-4">
        {partsConsumption.map((item: ServiceOrderPartConsumption) => {
          return (
            <div
              key={item.partId}
              className="p-5 bg-slate-900/60 backdrop-blur-sm rounded-xl border border-slate-800 hover:border-slate-700/80 transition-all duration-300"
            >
              <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 pb-3 border-b border-slate-850">
                <div>
                  <h4 className="text-base font-semibold text-slate-200">{item.name}</h4>
                  <p className="text-xs text-slate-400 font-mono">SKU: {item.sku}</p>
                </div>
                <div className="flex gap-3 text-xs">
                  <span className="bg-slate-800 text-slate-350 px-2 py-1 rounded">
                    Planejado: <strong>{item.plannedQuantity}</strong>
                  </span>
                  <span className="bg-emerald-950/30 text-emerald-400 px-2 py-1 rounded">
                    Consumido: <strong>{item.consumedQuantity}</strong>
                  </span>
                  <span className="bg-slate-800 text-indigo-400 px-2 py-1 rounded">
                    Restante: <strong>{item.remainingQuantity}</strong>
                  </span>
                </div>
              </div>

              {/* Local Warehouse Stock */}
              <div className="py-3 flex items-center justify-between text-xs border-b border-slate-850/40">
                <span className="text-slate-450">Estoque Local Disponível:</span>
                <span className={`font-semibold ${item.availableStock > 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {item.availableStock} un
                </span>
              </div>

              {/* Consumption history */}
              {item.movements.length > 0 && (
                <div className="py-3 text-xs text-slate-400 space-y-2">
                  <span className="font-semibold block text-slate-350">Histórico de Baixas:</span>
                  {item.movements.map(m => (
                    <div key={m.id} className="flex justify-between items-center bg-slate-950/40 p-2 rounded border border-slate-850">
                      <span>
                        Saída de <strong>{m.quantity}</strong> {m.quantity === 1 ? 'peça' : 'peças'} por <span className="text-slate-300">{m.performedByName}</span>
                      </span>
                      <span className="text-slate-500 font-mono text-[10px]">
                        {new Date(m.createdAt).toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {/* Consume Action Form */}
              {canConsume && item.remainingQuantity > 0 && (
                <div className="mt-4 flex items-center gap-3 justify-end">
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min={1}
                      max={Math.min(item.remainingQuantity, item.availableStock)}
                      placeholder="Qtd"
                      disabled={isConsuming || item.availableStock <= 0}
                      className="w-16 bg-slate-950 text-xs text-slate-300 border border-slate-850 rounded px-2 py-1.5 focus:border-emerald-500 focus:outline-none text-center"
                      value={quantities[item.partId] || ''}
                      onChange={e => setQuantities(prev => ({ ...prev, [item.partId]: e.target.value }))}
                    />
                    <button
                      onClick={() => handleConsume(item.partId, item)}
                      disabled={isConsuming || item.availableStock <= 0 || !quantities[item.partId]}
                      className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:hover:bg-emerald-600 text-slate-100 text-xs font-semibold px-4 py-1.5 rounded transition-all duration-200"
                    >
                      Confirmar Saída
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
