import React, { useState } from 'react';
import { usePermissions } from '../../auth/hooks/usePermissions';
import {
  useServiceOrderApproval,
  useRequestApproval,
  useApproveServiceOrder,
  useRejectServiceOrder,
  useInvalidateApproval
} from '../hooks/useServiceOrderApproval';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ShieldAlert, CheckCircle, XCircle, AlertTriangle, FileText, Ban } from 'lucide-react';

interface Props {
  serviceOrder: {
    id: string;
    status: string;
    totalParts: number | string;
    totalServices: number | string;
    discount: number | string;
    finalValue: number | string;
  };
}

function toNumber(value: unknown): number {
  if (value === null || value === undefined) return 0;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function formatCurrency(value: unknown): string {
  return toNumber(value).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });
}

function formatDate(value: unknown): string {
  if (!value) return 'Não informado';

  const date = new Date(String(value));

  if (Number.isNaN(date.getTime())) {
    return 'Não informado';
  }

  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(date);
}

export function ServiceOrderApprovalSection({ serviceOrder }: Props) {
  const { can } = usePermissions();
  const { data: approval, isLoading } = useServiceOrderApproval(serviceOrder.id);
  const requestMutation = useRequestApproval();
  const approveMutation = useApproveServiceOrder();
  const rejectMutation = useRejectServiceOrder();
  const invalidateMutation = useInvalidateApproval();

  const [rejectReason, setRejectReason] = useState('');
  const [invalidateReason, setInvalidateReason] = useState('');
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [showInvalidateForm, setShowInvalidateForm] = useState(false);

  if (isLoading) {
    return <div className="p-4 text-center text-sm text-muted-foreground">Carregando aprovações...</div>;
  }

  if (!can('os.approval_view')) {
    return null;
  }

  const handleRequest = () => {
    requestMutation.mutate(serviceOrder.id);
  };

  const handleApprove = () => {
    if (!approval) return;
    approveMutation.mutate({
      serviceOrderId: serviceOrder.id,
      approvalId: approval.id
    });
  };

  const handleReject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!approval || rejectReason.trim().length < 5) return;
    rejectMutation.mutate({
      serviceOrderId: serviceOrder.id,
      approvalId: approval.id,
      reason: rejectReason
    }, {
      onSuccess: () => {
        setRejectReason('');
        setShowRejectForm(false);
      }
    });
  };

  const handleInvalidate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!approval || invalidateReason.trim().length < 5) return;
    invalidateMutation.mutate({
      serviceOrderId: serviceOrder.id,
      approvalId: approval.id,
      reason: invalidateReason
    }, {
      onSuccess: () => {
        setInvalidateReason('');
        setShowInvalidateForm(false);
      }
    });
  };

  const statusColors: Record<string, string> = {
    PENDING: 'bg-yellow-500/20 text-yellow-500 border-yellow-500/30',
    APPROVED: 'bg-green-500/20 text-green-500 border-green-500/30',
    REJECTED: 'bg-red-500/20 text-red-500 border-red-500/30',
    INVALIDATED: 'bg-gray-500/20 text-gray-400 border-gray-500/30'
  };

  const partsVal = toNumber(approval?.totalParts);
  const servicesVal = toNumber(approval?.totalServices);
  const finalVal = toNumber(approval?.finalValue);
  const hasValidSnapshot = approval ? (finalVal > 0 && Number.isFinite(partsVal) && Number.isFinite(servicesVal)) : false;

  return (
    <Card className="border border-border/40 bg-card/60 backdrop-blur-xs shadow-md mt-6">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
        <CardTitle className="text-lg font-semibold flex items-center gap-2 text-foreground">
          <FileText className="w-5 h-5 text-primary" />
          Aprovação do Orçamento
        </CardTitle>
        {approval && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground font-medium">
              Versão {approval.version}
            </span>
            <Badge variant="outline" className={`${statusColors[approval.status]} font-semibold`}>
              {approval.status}
            </Badge>
          </div>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {approval ? (
          <div className="space-y-4">
            {/* Show decision info */}
            <div className="text-sm space-y-1 bg-muted/40 p-3 rounded-lg border border-border/20">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Solicitado em:</span>
                <span className="text-foreground">{formatDate(approval.requestedAt)}</span>
              </div>

              {approval.status === 'APPROVED' && approval.approvedAt && (
                <div className="flex justify-between text-green-500 font-medium">
                  <span>Aprovado em:</span>
                  <span>{formatDate(approval.approvedAt)}</span>
                </div>
              )}

              {approval.status === 'REJECTED' && approval.rejectedAt && (
                <div className="space-y-1">
                  <div className="flex justify-between text-red-500 font-medium">
                    <span>Rejeitado em:</span>
                    <span>{formatDate(approval.rejectedAt)}</span>
                  </div>
                  {approval.rejectionReason && (
                    <div className="bg-red-500/10 text-red-500 p-2 rounded mt-1 border border-red-500/20">
                      <strong>Motivo:</strong> {approval.rejectionReason}
                    </div>
                  )}
                </div>
              )}

              {approval.status === 'INVALIDATED' && approval.invalidatedAt && (
                <div className="space-y-1">
                  <div className="flex justify-between text-muted-foreground font-medium">
                    <span>Invalidado em:</span>
                    <span>{formatDate(approval.invalidatedAt)}</span>
                  </div>
                  {approval.invalidationReason && (
                    <div className="bg-muted text-muted-foreground p-2 rounded mt-1 border border-border/30">
                      <strong>Motivo:</strong> {approval.invalidationReason}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Snapshot imutável */}
            <div className="border border-border/30 rounded-lg overflow-hidden bg-card/40">
              <div className="bg-muted/60 p-2 text-xs font-semibold uppercase tracking-wider border-b border-border/30 text-foreground">
                Resumo do Snapshot Aprovado/Pendente
              </div>
              <div className="p-3 space-y-2 text-sm text-foreground">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Peças:</span>
                  <span className="font-mono">{formatCurrency(approval.totalParts)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Serviços:</span>
                  <span className="font-mono">{formatCurrency(approval.totalServices)}</span>
                </div>
                {toNumber(approval.discount) > 0 && (
                  <div className="flex justify-between text-red-500">
                    <span>Desconto:</span>
                    <span className="font-mono">- {formatCurrency(approval.discount)}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold border-t border-border/20 pt-2 text-base">
                  <span>Total Final:</span>
                  <span className="font-mono text-primary">{formatCurrency(approval.finalValue)}</span>
                </div>
              </div>
            </div>

            {/* Warning when snapshot is invalid */}
            {!hasValidSnapshot && (
              <div className="bg-red-500/10 text-red-500 p-3 rounded-lg border border-red-500/20 text-xs font-semibold">
                Atenção: Os valores do orçamento são inválidos. A aprovação foi desabilitada.
              </div>
            )}

            {/* Actions for PENDING */}
            {approval.status === 'PENDING' && (
              <div className="space-y-3">
                {can('os.approval_decide') && !showRejectForm && !showInvalidateForm && (
                  <div className="flex gap-2">
                    <Button
                      onClick={handleApprove}
                      disabled={approveMutation.isPending || !hasValidSnapshot}
                      className="flex-1 bg-green-600 hover:bg-green-700 text-white font-medium disabled:opacity-50"
                    >
                      Aprovar Orçamento
                    </Button>
                    <Button
                      onClick={() => setShowRejectForm(true)}
                      variant="destructive"
                      disabled={!hasValidSnapshot}
                      className="flex-1"
                    >
                      Rejeitar Orçamento
                    </Button>
                  </div>
                )}

                {can('os.approval_decide') && showRejectForm && (
                  <form onSubmit={handleReject} className="space-y-2 border border-red-500/20 bg-red-500/5 p-3 rounded-lg">
                    <Label htmlFor="rejectReason" className="text-red-500">Motivo da Rejeição (mínimo 5 caracteres)</Label>
                    <Input
                      id="rejectReason"
                      placeholder="Ex: Cliente achou o valor das peças elevado..."
                      value={rejectReason}
                      onChange={(e) => setRejectReason(e.target.value)}
                      required
                    />
                    <div className="flex gap-2 justify-end">
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={() => {
                          setShowRejectForm(false);
                          setRejectReason('');
                        }}
                      >
                        Cancelar
                      </Button>
                      <Button
                        type="submit"
                        variant="destructive"
                        disabled={rejectReason.trim().length < 5 || rejectMutation.isPending}
                      >
                        Confirmar Rejeição
                      </Button>
                    </div>
                  </form>
                )}

                {/* Anyone who can request can invalidate/cancel pending to unlock editing */}
                {can('os.approval_request') && !showInvalidateForm && (
                  <Button
                    onClick={() => setShowInvalidateForm(true)}
                    variant="outline"
                    className="w-full border-dashed"
                  >
                    Cancelar Solicitação (Liberar Edição)
                  </Button>
                )}
              </div>
            )}

            {/* Actions for APPROVED */}
            {approval.status === 'APPROVED' && can('os.approval_decide') && (
              <div className="space-y-3">
                {!showInvalidateForm ? (
                  <Button
                    onClick={() => setShowInvalidateForm(true)}
                    variant="outline"
                    className="w-full border-red-500/30 text-red-500 hover:bg-red-500/10 hover:text-red-600 font-medium"
                  >
                    Invalidar Aprovação (Reabrir Orçamento)
                  </Button>
                ) : (
                  <form onSubmit={handleInvalidate} className="space-y-2 border border-border bg-muted/30 p-3 rounded-lg">
                    <Label htmlFor="invalidateReason" className="text-foreground">Motivo da Invalidação (mínimo 5 caracteres)</Label>
                    <Input
                      id="invalidateReason"
                      placeholder="Ex: Modificação nos itens solicitada pelo mecânico..."
                      value={invalidateReason}
                      onChange={(e) => setInvalidateReason(e.target.value)}
                      required
                    />
                    <div className="flex gap-2 justify-end">
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={() => {
                          setShowInvalidateForm(false);
                          setInvalidateReason('');
                        }}
                      >
                        Cancelar
                      </Button>
                      <Button
                        type="submit"
                        variant="destructive"
                        disabled={invalidateReason.trim().length < 5 || invalidateMutation.isPending}
                      >
                        Invalidar e Destravar OS
                      </Button>
                    </div>
                  </form>
                )}
              </div>
            )}

            {/* Handle INVALIDATED or REJECTED: Allow requesting a new version */}
            {(approval.status === 'REJECTED' || approval.status === 'INVALIDATED') && can('os.approval_request') && (
              <Button
                onClick={handleRequest}
                disabled={requestMutation.isPending}
                className="w-full"
              >
                Solicitar Nova Aprovação (Versão {approval.version + 1})
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex gap-3 p-4 rounded-lg bg-muted/40 border border-border/30">
              <ShieldAlert className="w-5 h-5 text-yellow-500 shrink-0 mt-0.5" />
              <div>
                <h4 className="font-semibold text-sm">Orçamento em Preparação</h4>
                <p className="text-muted-foreground text-xs mt-1">
                  Adicione peças e serviços planejados. Uma vez enviado para aprovação, a edição ficará travada.
                </p>
              </div>
            </div>

            {can('os.approval_request') && (
              <Button
                onClick={handleRequest}
                disabled={requestMutation.isPending || (Number(serviceOrder.totalParts) === 0 && Number(serviceOrder.totalServices) === 0)}
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
              >
                Solicitar Aprovação do Orçamento
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
