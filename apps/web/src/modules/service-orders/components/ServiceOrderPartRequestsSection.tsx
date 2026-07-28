import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { usePurchaseRequests } from '@/modules/procurement/hooks/usePurchaseRequests';
import { PurchaseRequestStatusBadge } from '@/modules/procurement/components/PurchaseRequestStatusBadge';
import { InstallPartDialog } from '@/modules/procurement/components/InstallPartDialog';
import { PermissionGate } from '@/modules/auth/components/PermissionGate';
import type { PurchaseRequest } from '@/modules/procurement/types/procurement.types';
import { formatCurrencyBRL } from '@/modules/procurement/utils/procurementUtils';

interface Props {
  serviceOrderId: string;
}

export const ServiceOrderPartRequestsSection: React.FC<Props> = ({ serviceOrderId }) => {
  const { data: requests, isLoading } = usePurchaseRequests({ serviceOrderId });
  const [selectedForInstall, setSelectedForInstall] = useState<PurchaseRequest | null>(null);

  if (isLoading) {
    return <div className="text-xs text-muted-foreground py-2">Carregando solicitações de peças...</div>;
  }

  if (!requests || requests.length === 0) {
    return null;
  }

  return (
    <>
      <div className="space-y-3 pt-4 border-t">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-semibold text-foreground">Peças solicitadas para compra</h4>
          <span className="text-xs text-muted-foreground">{requests.length} solicitação(ões)</span>
        </div>

        <div className="space-y-3">
          {requests.map((req) => (
            <Card key={req.id} className="p-3 bg-muted/20 border text-xs space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h5 className="font-semibold text-foreground text-sm">
                    {req.provisionalName}
                    {req.part?.internalCode && (
                      <span className="ml-2 font-mono text-xs text-muted-foreground">({req.part.internalCode})</span>
                    )}
                  </h5>
                  <p className="text-muted-foreground text-xs mt-0.5">
                    Solicitado: <span className="font-medium text-foreground">{req.requestedQuantity} un</span>
                    {req.purchasedQuantity && (
                      <span className="ml-2">| Comprado: <span className="font-medium text-foreground">{req.purchasedQuantity} un</span></span>
                    )}
                    {req.unitPrice && (
                      <span className="ml-2">| Valor: <span className="font-medium text-foreground">{formatCurrencyBRL(req.unitPrice)}</span></span>
                    )}
                  </p>
                </div>
                <PurchaseRequestStatusBadge status={req.status} />
              </div>

              {req.mechanicNotes && (
                <p className="text-xs text-muted-foreground bg-background/50 p-2 rounded border">
                  <span className="font-medium">Obs. Mecânico:</span> {req.mechanicNotes}
                </p>
              )}

              {req.financialNote && (
                <p className="text-xs text-muted-foreground bg-blue-50/50 dark:bg-blue-950/20 p-2 rounded border border-blue-100 dark:border-blue-900">
                  <span className="font-medium text-blue-700 dark:text-blue-300">Obs. Financeiro:</span> {req.financialNote}
                </p>
              )}

              <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t text-[11px] text-muted-foreground">
                <div>
                  Solicitada em: {new Date(req.createdAt).toLocaleDateString('pt-BR')}
                  {req.expectedDeliveryAt && (
                    <span className="ml-2 font-medium text-amber-600 dark:text-amber-400">
                      Previsão: {new Date(req.expectedDeliveryAt).toLocaleDateString('pt-BR')}
                    </span>
                  )}
                </div>

                {req.status === 'READY_FOR_PICKUP' && (
                  <PermissionGate permission="procurement.part-requests.install">
                    <Button
                      size="sm"
                      className="h-7 text-xs bg-purple-600 hover:bg-purple-700 text-white"
                      onClick={() => setSelectedForInstall(req)}
                    >
                      Confirmar instalação
                    </Button>
                  </PermissionGate>
                )}
              </div>
            </Card>
          ))}
        </div>
      </div>

      <InstallPartDialog
        open={Boolean(selectedForInstall)}
        onOpenChange={(open) => {
          if (!open) setSelectedForInstall(null);
        }}
        request={selectedForInstall}
      />
    </>
  );
};
