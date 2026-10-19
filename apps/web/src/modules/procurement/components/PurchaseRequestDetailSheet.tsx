import React, { useState } from 'react';
import { toast } from 'sonner';
import { extractErrorMessage } from '@/utils/errorHandler';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { PurchaseRequestStatusBadge } from './PurchaseRequestStatusBadge';
import { RegisterPurchaseForm } from './RegisterPurchaseForm';
import { ReceivePartForm } from './ReceivePartForm';
import { InstallPartDialog } from './InstallPartDialog';
import { CancelPartRequestDialog } from './CancelPartRequestDialog';
import { PermissionGate } from '@/modules/auth/components/PermissionGate';
import { usePurchaseRequest } from '../hooks/usePurchaseRequest';
import { useProcurementMutations } from '../hooks/useProcurementMutations';
import { formatCurrencyBRL } from '../utils/procurementUtils';

interface Props {
  requestId: string | null;
  onClose: () => void;
}

export const PurchaseRequestDetailSheet: React.FC<Props> = ({ requestId, onClose }) => {
  const { data: request, isLoading } = usePurchaseRequest(requestId || undefined);
  const { startProgressMutation } = useProcurementMutations();

  const [showInstallDialog, setShowInstallDialog] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [activeTabAction, setActiveTabAction] = useState<'PURCHASE' | 'RECEIVE' | null>(null);

  if (!requestId) return null;

  const handleStartProgress = async () => {
    try {
      await startProgressMutation.mutateAsync(requestId);
      toast.success('Atendimento da solicitação iniciado!');
    } catch (err) {
      toast.error(extractErrorMessage(err, 'Erro ao iniciar atendimento.'));
    }
  };

  return (
    <>
      <Sheet open={Boolean(requestId)} onOpenChange={(open) => !open && onClose()}>
        <SheetContent side="right" className="w-full sm:max-w-xl lg:max-w-2xl overflow-y-auto p-6 flex flex-col gap-6">
          {isLoading || !request ? (
            <div className="flex items-center justify-center h-40 text-xs text-muted-foreground">
              Carregando detalhes da solicitação...
            </div>
          ) : (
            <>
              {/* Header */}
              <SheetHeader className="space-y-2 border-b pb-4">
                <div className="flex items-center justify-between gap-2">
                  <SheetTitle className="text-xl font-bold flex items-center gap-2">
                    Solicitação de Peça
                    <PurchaseRequestStatusBadge status={request.status} />
                  </SheetTitle>
                </div>
                <SheetDescription className="text-xs">
                  Criada em {new Date(request.createdAt).toLocaleString('pt-BR')}
                </SheetDescription>
              </SheetHeader>

              {/* Top Quick Actions Bar */}
              <div className="flex flex-wrap items-center gap-2 pb-2 border-b">
                {request.status === 'REQUESTED' && (
                  <PermissionGate permission="procurement.part-requests.start">
                    <Button
                      size="sm"
                      onClick={handleStartProgress}
                      disabled={startProgressMutation.isPending}
                    >
                      {startProgressMutation.isPending ? 'Iniciando...' : 'Iniciar Atendimento'}
                    </Button>
                  </PermissionGate>
                )}

                {request.status === 'IN_PROGRESS' && (
                  <>
                    <PermissionGate permission="procurement.part-requests.purchase">
                      <Button
                        size="sm"
                        variant={activeTabAction === 'PURCHASE' ? 'default' : 'outline'}
                        onClick={() => setActiveTabAction(activeTabAction === 'PURCHASE' ? null : 'PURCHASE')}
                      >
                        {request.purchasedAt ? 'Editar Compra' : 'Registrar Compra'}
                      </Button>
                    </PermissionGate>

                    <PermissionGate permission="procurement.part-requests.receive">
                      <Button
                        size="sm"
                        variant={activeTabAction === 'RECEIVE' ? 'default' : 'outline'}
                        className="border-emerald-600 text-emerald-700 hover:bg-emerald-50 dark:text-emerald-300"
                        onClick={() => setActiveTabAction(activeTabAction === 'RECEIVE' ? null : 'RECEIVE')}
                      >
                        Confirmar Recebimento Físico
                      </Button>
                    </PermissionGate>
                  </>
                )}

                {request.status === 'READY_FOR_PICKUP' && (
                  <PermissionGate permission="procurement.part-requests.install">
                    <Button
                      size="sm"
                      className="bg-purple-600 hover:bg-purple-700 text-white"
                      onClick={() => setShowInstallDialog(true)}
                    >
                      Confirmar Instalação
                    </Button>
                  </PermissionGate>
                )}

                {request.status !== 'INSTALLED' && request.status !== 'CANCELED' && (
                  <PermissionGate permission="procurement.part-requests.cancel">
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-destructive border-destructive/30 hover:bg-destructive/10"
                      onClick={() => setShowCancelDialog(true)}
                    >
                      Cancelar
                    </Button>
                  </PermissionGate>
                )}
              </div>

              {/* Conditional Active Action Forms */}
              {activeTabAction === 'PURCHASE' && request.status === 'IN_PROGRESS' && (
                <RegisterPurchaseForm
                  request={request}
                  onSuccess={() => setActiveTabAction(null)}
                />
              )}

              {activeTabAction === 'RECEIVE' && request.status === 'IN_PROGRESS' && (
                <ReceivePartForm
                  request={request}
                  onSuccess={() => setActiveTabAction(null)}
                />
              )}

              {/* Section 1: Origem */}
              <div className="space-y-2 border-b pb-4">
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Origem</h4>
                <div className="grid grid-cols-2 gap-3 text-xs bg-muted/20 p-3 rounded">
                  <div>
                    <span className="text-muted-foreground block">Ordem de Serviço</span>
                    <span className="font-semibold text-primary">OS #{request.serviceOrderId.substring(0, 8)}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block">Mecânico Solicitante</span>
                    <span className="font-semibold">{request.createdByUser?.name || request.createdBy}</span>
                  </div>
                </div>
              </div>

              {/* Section 2: Dados da Solicitação */}
              <div className="space-y-2 border-b pb-4">
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Solicitação do Mecânico</h4>
                <div className="space-y-2 text-xs">
                  <div className="grid grid-cols-2 gap-3 bg-muted/20 p-3 rounded">
                    <div>
                      <span className="text-muted-foreground block">Peça Provisória</span>
                      <span className="font-semibold text-sm">{request.provisionalName}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block">Quantidade Solicitada</span>
                      <span className="font-semibold text-sm">{request.requestedQuantity} un</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block">Prioridade</span>
                      <span className="font-semibold">{request.priority}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block">Necessária até</span>
                      <span className="font-semibold">
                        {request.expectedDeliveryAt
                          ? new Date(request.expectedDeliveryAt).toLocaleDateString('pt-BR')
                          : 'Não informada'}
                      </span>
                    </div>
                  </div>

                  {request.mechanicNotes && (
                    <div className="p-3 bg-muted/30 rounded border">
                      <span className="font-semibold block text-muted-foreground text-[11px] mb-1">Observação Técnica:</span>
                      <p>{request.mechanicNotes}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Section 3: Dados da Compra */}
              {request.purchasedAt && (
                <div className="space-y-2 border-b pb-4">
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Dados da Compra (Financeiro)</h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-xs bg-muted/20 p-3 rounded">
                    <div>
                      <span className="text-muted-foreground block">Peça Definitiva</span>
                      <span className="font-semibold">{request.part?.name || request.provisionalName}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block">Código Interno</span>
                      <span className="font-mono font-semibold">{request.part?.internalCode || 'N/A'}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block">Fornecedor</span>
                      <span className="font-semibold">{request.supplier?.name || 'N/A'}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block">Qtd. Comprada</span>
                      <span className="font-semibold">{request.purchasedQuantity} un</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block">Valor Unitário</span>
                      <span className="font-semibold">{formatCurrencyBRL(request.unitPrice)}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block">Ref. Pedido</span>
                      <span className="font-semibold">{request.purchaseOrderRef || 'N/A'}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Section 4: Histórico / Events Timeline */}
              <div className="space-y-3">
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Histórico de Eventos</h4>
                {request.events && request.events.length > 0 ? (
                  <div className="space-y-2 text-xs">
                    {request.events.map((evt) => (
                      <div key={evt.id} className="p-2.5 rounded border bg-background flex flex-col gap-1">
                        <div className="flex items-center justify-between font-medium">
                          <span>{evt.type}</span>
                          <span className="text-[11px] text-muted-foreground">
                            {new Date(evt.occurredAt).toLocaleString('pt-BR')}
                          </span>
                        </div>
                        {evt.actor && (
                          <span className="text-[11px] text-muted-foreground">
                            Por: {evt.actor.name} ({evt.actor.role})
                          </span>
                        )}
                        {evt.notes && <p className="text-muted-foreground italic mt-0.5">{evt.notes}</p>}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground italic">Nenhum evento gravado no histórico.</p>
                )}
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      <InstallPartDialog
        open={showInstallDialog}
        onOpenChange={setShowInstallDialog}
        request={request || null}
      />

      <CancelPartRequestDialog
        open={showCancelDialog}
        onOpenChange={setShowCancelDialog}
        request={request || null}
      />
    </>
  );
};
