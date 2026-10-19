import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PurchaseRequestStatusBadge } from './PurchaseRequestStatusBadge';
import type { PurchaseRequest } from '../types/procurement.types';
import { formatCurrencyBRL } from '../utils/procurementUtils';

interface Props {
  requests: PurchaseRequest[];
  onSelectRequest: (request: PurchaseRequest) => void;
}

export const PurchaseRequestMobileList: React.FC<Props> = ({ requests, onSelectRequest }) => {
  if (requests.length === 0) {
    return (
      <div className="block md:hidden p-6 text-center text-xs text-muted-foreground bg-card rounded-lg border">
        Nenhuma solicitação encontrada.
      </div>
    );
  }

  return (
    <div className="block md:hidden space-y-3">
      {requests.map((req) => (
        <Card key={req.id} className="p-4 space-y-2 border text-xs bg-card" onClick={() => onSelectRequest(req)}>
          <div className="flex items-start justify-between gap-2">
            <div>
              <span className="font-semibold text-foreground text-sm block">{req.provisionalName}</span>
              <span className="font-mono text-xs text-primary">OS #{req.serviceOrderId.substring(0, 8)}</span>
            </div>
            <PurchaseRequestStatusBadge status={req.status} />
          </div>

          <div className="grid grid-cols-2 gap-2 text-muted-foreground pt-1 border-t">
            <div>
              <span>Solicitado:</span> <span className="font-medium text-foreground">{req.requestedQuantity} un</span>
            </div>
            <div>
              <span>Valor:</span> <span className="font-medium text-foreground">{formatCurrencyBRL(req.unitPrice)}</span>
            </div>
            <div>
              <span>Mecânico:</span> <span className="font-medium text-foreground">{req.createdByUser?.name || 'Mecânico'}</span>
            </div>
            <div>
              <span>Data:</span> <span className="font-medium text-foreground">{new Date(req.createdAt).toLocaleDateString('pt-BR')}</span>
            </div>
          </div>

          <div className="pt-2 flex justify-end">
            <Button size="sm" variant="outline" className="h-7 text-xs w-full">
              Ver Detalhes
            </Button>
          </div>
        </Card>
      ))}
    </div>
  );
};
