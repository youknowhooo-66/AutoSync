import React, { useState } from 'react';
import { useServiceOrderExecution } from '../hooks/useServiceOrderExecution';
import { useTechnicians } from '../hooks/useTechnicians';
import { useAuth } from '@/modules/auth/hooks/useAuth';
import { approvalService } from '../services/approvalService';
import { useQuery } from '@tanstack/react-query';
import type { ServiceExecutionStatus, OSServiceExecution } from '../types/execution.types';

interface ServiceOrderExecutionSectionProps {
  serviceOrderId: string;
}

export function ServiceOrderExecutionSection({ serviceOrderId }: ServiceOrderExecutionSectionProps) {
  const { user } = useAuth();
  const {
    execution,
    isLoading: isLoadingExecution,
    assign,
    start,
    pause,
    resume,
    complete
  } = useServiceOrderExecution(serviceOrderId);

  const { data: latestApproval, isLoading: isLoadingApproval } = useQuery({
    queryKey: ['latest-approval', serviceOrderId],
    queryFn: () => approvalService.getByServiceOrder(serviceOrderId),
    enabled: !!serviceOrderId
  });

  const isBudgetApproved = latestApproval?.status === 'APPROVED';
  const isLoading = isLoadingExecution || isLoadingApproval;

  const { data: technicians = [] } = useTechnicians();

  const [selectedTechs, setSelectedTechs] = useState<Record<string, string>>({});
  const [pauseReasons, setPauseReasons] = useState<Record<string, string>>({});
  const [completionNotes, setCompletionNotes] = useState<Record<string, string>>({});
  const [activeActions, setActiveActions] = useState<Record<string, 'PAUSE' | 'COMPLETE' | null>>({});

  if (!isBudgetApproved) {
    return (
      <div className="p-6 bg-slate-900/50 backdrop-blur-md rounded-xl border border-red-500/30 text-center shadow-xl shadow-red-950/20">
        <h3 className="text-lg font-semibold text-red-400 mb-2">Execução Bloqueada</h3>
        <p className="text-sm text-slate-400">
          A execução técnica dos serviços só pode ser iniciada após a aprovação formal do orçamento correspondente.
        </p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex justify-center p-8">
        <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const isAdminOrManager = user?.role === 'ADMIN' || user?.role === 'MANAGER';

  const getStatusBadge = (status: ServiceExecutionStatus) => {
    const styles: Record<ServiceExecutionStatus, string> = {
      PENDING: 'bg-slate-800 text-slate-400 border-slate-700/50',
      ASSIGNED: 'bg-violet-950/40 text-violet-400 border-violet-800/30',
      IN_PROGRESS: 'bg-sky-950/40 text-sky-400 border-sky-800/30',
      PAUSED: 'bg-amber-950/40 text-amber-400 border-amber-800/30',
      COMPLETED: 'bg-emerald-950/40 text-emerald-400 border-emerald-800/30',
      CANCELLED: 'bg-rose-950/40 text-rose-400 border-rose-800/30'
    };

    const labels: Record<ServiceExecutionStatus, string> = {
      PENDING: 'Pendente',
      ASSIGNED: 'Atribuído',
      IN_PROGRESS: 'Em Andamento',
      PAUSED: 'Pausado',
      COMPLETED: 'Concluído',
      CANCELLED: 'Cancelado'
    };

    return (
      <span className={`px-2.5 py-1 text-xs font-semibold rounded-full border ${styles[status]}`}>
        {labels[status]}
      </span>
    );
  };

  const handleAssign = async (serviceId: string) => {
    const techId = selectedTechs[serviceId];
    if (!techId) return;
    try {
      await assign({ serviceId, technicianId: techId });
    } catch (err: any) {
      alert(err.response?.data?.message || 'Falha ao atribuir técnico');
    }
  };

  const handleStart = async (serviceId: string) => {
    try {
      await start(serviceId);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Falha ao iniciar serviço');
    }
  };

  const handlePause = async (serviceId: string) => {
    const reason = pauseReasons[serviceId];
    if (!reason || reason.trim().length < 5) {
      alert('O motivo da pausa deve ter pelo menos 5 caracteres');
      return;
    }
    try {
      await pause({ serviceId, reason });
      setActiveActions(prev => ({ ...prev, [serviceId]: null }));
    } catch (err: any) {
      alert(err.response?.data?.message || 'Falha ao pausar serviço');
    }
  };

  const handleResume = async (serviceId: string) => {
    try {
      await resume(serviceId);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Falha ao retomar serviço');
    }
  };

  const handleComplete = async (serviceId: string) => {
    const notes = completionNotes[serviceId];
    try {
      await complete({ serviceId, notes });
      setActiveActions(prev => ({ ...prev, [serviceId]: null }));
    } catch (err: any) {
      alert(err.response?.data?.message || 'Falha ao concluir serviço');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
          <span className="w-2 h-6 bg-indigo-500 rounded-full"></span>
          Execução Técnica de Serviços
        </h2>
      </div>

      <div className="space-y-4">
        {execution.map((svc: OSServiceExecution) => {
          const isAssignedToCurrentUser = svc.technicianId === user?.id;
          const canAct = isAdminOrManager || isAssignedToCurrentUser;

          return (
            <div
              key={svc.id}
              className="p-5 bg-slate-900/60 backdrop-blur-sm rounded-xl border border-slate-800 hover:border-slate-700/80 transition-all duration-300"
            >
              <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 pb-3 border-b border-slate-850">
                <div>
                  <h4 className="text-base font-semibold text-slate-200">{svc.name}</h4>
                  <p className="text-xs text-indigo-400 font-medium">R$ {parseFloat(svc.price).toFixed(2)}</p>
                </div>
                <div>{getStatusBadge(svc.executionStatus)}</div>
              </div>

              {/* Transition history & technician */}
              <div className="py-3 text-xs text-slate-400 space-y-1.5">
                {svc.technician && (
                  <p className="flex items-center gap-2">
                    <span className="text-slate-500 font-medium">Técnico Responsável:</span>
                    <span className="text-slate-350 bg-slate-800/40 px-2 py-0.5 rounded border border-slate-700/30">
                      {svc.technician.name}
                    </span>
                  </p>
                )}

                {svc.assignedAt && (
                  <p>
                    Atribuído por <span className="text-slate-350">{svc.assignedBy?.name}</span> em{' '}
                    {new Date(svc.assignedAt).toLocaleString()}
                  </p>
                )}
                {svc.startedAt && (
                  <p>
                    Iniciado por <span className="text-slate-350">{svc.startedBy?.name}</span> em{' '}
                    {new Date(svc.startedAt).toLocaleString()}
                  </p>
                )}
                {svc.pausedAt && (
                  <p className="bg-amber-950/20 text-amber-300/90 p-2 rounded border border-amber-900/20">
                    Pausado por <span className="text-amber-200">{svc.pausedBy?.name}</span> em{' '}
                    {new Date(svc.pausedAt).toLocaleString()}
                    <br />
                    <span className="font-semibold">Motivo:</span> {svc.pauseReason}
                  </p>
                )}
                {svc.resumedAt && (
                  <p>
                    Retomado por <span className="text-slate-350">{svc.resumedBy?.name}</span> em{' '}
                    {new Date(svc.resumedAt).toLocaleString()}
                  </p>
                )}
                {svc.completedAt && (
                  <p className="bg-emerald-950/20 text-emerald-300/90 p-2 rounded border border-emerald-900/20">
                    Concluído por <span className="text-emerald-200">{svc.completedBy?.name}</span> em{' '}
                    {new Date(svc.completedAt).toLocaleString()}
                    {svc.completionNotes && (
                      <>
                        <br />
                        <span className="font-semibold">Notas:</span> {svc.completionNotes}
                      </>
                    )}
                  </p>
                )}
              </div>

              {/* Action area */}
              <div className="mt-3 flex flex-wrap gap-2 justify-end">
                {/* Technician Assignment */}
                {isAdminOrManager && (svc.executionStatus === 'PENDING' || svc.executionStatus === 'ASSIGNED') && (
                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <select
                      className="bg-slate-950 text-xs text-slate-300 border border-slate-800 rounded px-2.5 py-1.5 focus:border-indigo-500 focus:outline-none w-full sm:w-44"
                      value={selectedTechs[svc.id] || ''}
                      onChange={e => setSelectedTechs(prev => ({ ...prev, [svc.id]: e.target.value }))}
                    >
                      <option value="">Selecionar Técnico</option>
                      {technicians.map(tech => (
                        <option key={tech.id} value={tech.id}>
                          {tech.name}
                        </option>
                      ))}
                    </select>
                    <button
                      onClick={() => handleAssign(svc.id)}
                      disabled={!selectedTechs[svc.id]}
                      className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:hover:bg-indigo-600 text-slate-100 text-xs font-semibold px-3 py-1.5 rounded transition-colors duration-200"
                    >
                      Atribuir
                    </button>
                  </div>
                )}

                {/* Mechanic Actions */}
                {canAct && (
                  <>
                    {svc.executionStatus === 'ASSIGNED' && (
                      <button
                        onClick={() => handleStart(svc.id)}
                        className="bg-indigo-600 hover:bg-indigo-500 text-slate-100 text-xs font-semibold px-4 py-1.5 rounded transition-all duration-200"
                      >
                        Iniciar
                      </button>
                    )}

                    {svc.executionStatus === 'IN_PROGRESS' && activeActions[svc.id] === null && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => setActiveActions(prev => ({ ...prev, [svc.id]: 'PAUSE' }))}
                          className="bg-amber-600 hover:bg-amber-500 text-slate-100 text-xs font-semibold px-4 py-1.5 rounded transition-all duration-200"
                        >
                          Pausar
                        </button>
                        <button
                          onClick={() => setActiveActions(prev => ({ ...prev, [svc.id]: 'COMPLETE' }))}
                          className="bg-emerald-600 hover:bg-emerald-500 text-slate-100 text-xs font-semibold px-4 py-1.5 rounded transition-all duration-200"
                        >
                          Concluir
                        </button>
                      </div>
                    )}

                    {svc.executionStatus === 'PAUSED' && (
                      <button
                        onClick={() => handleResume(svc.id)}
                        className="bg-indigo-600 hover:bg-indigo-500 text-slate-100 text-xs font-semibold px-4 py-1.5 rounded transition-all duration-200"
                      >
                        Retomar
                      </button>
                    )}

                    {/* Inline Pause Form */}
                    {activeActions[svc.id] === 'PAUSE' && (
                      <div className="w-full space-y-2 mt-2 bg-slate-950/60 p-3 rounded border border-amber-900/30">
                        <label className="block text-xs font-semibold text-amber-400">Motivo da Pausa</label>
                        <textarea
                          placeholder="Ex: Aguardando peça de reposição do distribuidor"
                          rows={2}
                          className="w-full bg-slate-900 text-xs text-slate-300 border border-slate-800 rounded p-2 focus:border-amber-500 focus:outline-none"
                          value={pauseReasons[svc.id] || ''}
                          onChange={e => setPauseReasons(prev => ({ ...prev, [svc.id]: e.target.value }))}
                        />
                        <div className="flex justify-end gap-2 text-xs">
                          <button
                            onClick={() => setActiveActions(prev => ({ ...prev, [svc.id]: null }))}
                            className="bg-slate-800 hover:bg-slate-700 text-slate-350 px-3 py-1.5 rounded"
                          >
                            Cancelar
                          </button>
                          <button
                            onClick={() => handlePause(svc.id)}
                            className="bg-amber-600 hover:bg-amber-500 text-slate-100 font-semibold px-3 py-1.5 rounded"
                          >
                            Confirmar Pausa
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Inline Complete Form */}
                    {activeActions[svc.id] === 'COMPLETE' && (
                      <div className="w-full space-y-2 mt-2 bg-slate-950/60 p-3 rounded border border-emerald-900/30">
                        <label className="block text-xs font-semibold text-emerald-400">Observações de Conclusão</label>
                        <textarea
                          placeholder="Ex: Troca de óleo executada com sucesso, filtro de óleo substituído."
                          rows={2}
                          className="w-full bg-slate-900 text-xs text-slate-300 border border-slate-800 rounded p-2 focus:border-emerald-500 focus:outline-none"
                          value={completionNotes[svc.id] || ''}
                          onChange={e => setCompletionNotes(prev => ({ ...prev, [svc.id]: e.target.value }))}
                        />
                        <div className="flex justify-end gap-2 text-xs">
                          <button
                            onClick={() => setActiveActions(prev => ({ ...prev, [svc.id]: null }))}
                            className="bg-slate-800 hover:bg-slate-700 text-slate-350 px-3 py-1.5 rounded"
                          >
                            Cancelar
                          </button>
                          <button
                            onClick={() => handleComplete(svc.id)}
                            className="bg-emerald-600 hover:bg-emerald-500 text-slate-100 font-semibold px-3 py-1.5 rounded"
                          >
                            Confirmar Conclusão
                          </button>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
