import React from 'react';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { PurchaseRequestStatusBadge } from './PurchaseRequestStatusBadge';
import type { PurchaseRequest } from '../types/procurement.types';
import { formatCurrencyBRL } from '../utils/procurementUtils';

interface Props {
  requests: PurchaseRequest[];
  onSelectRequest: (request: PurchaseRequest) => void;
}

export const PurchaseRequestTable: React.FC<Props> = ({ requests, onSelectRequest }) => {
  if (requests.length === 0) {
    return (
      <div className="p-8 text-center text-xs text-muted-foreground bg-card rounded-lg border">
        Nenhuma solicitação de peça encontrada com os filtros selecionados.
      </div>
    );
  }

  return (
    <div className="hidden md:block bg-card rounded-lg border overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="text-xs">
            <TableHead>Solicitação / Peça</TableHead>
            <TableHead>OS</TableHead>
            <TableHead>Mecânico</TableHead>
            <TableHead>Qtd.</TableHead>
            <TableHead>Valor</TableHead>
            <TableHead>Prioridade</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Data</TableHead>
            <TableHead className="text-right">Ação</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {requests.map((req) => (
            <TableRow key={req.id} className="text-xs hover:bg-muted/40 cursor-pointer" onClick={() => onSelectRequest(req)}>
              <TableCell className="font-medium">
                <div>
                  <span className="font-semibold text-foreground">{req.provisionalName}</span>
                  {req.part?.internalCode && (
                    <span className="block font-mono text-[11px] text-muted-foreground">({req.part.internalCode})</span>
                  )}
                </div>
              </TableCell>

              <TableCell className="font-mono text-primary">
                OS #{req.serviceOrderId.substring(0, 8)}
              </TableCell>

              <TableCell>{req.createdByUser?.name || 'Mecânico'}</TableCell>

              <TableCell>{req.purchasedQuantity || req.requestedQuantity} un</TableCell>

              <TableCell>{formatCurrencyBRL(req.unitPrice)}</TableCell>

              <TableCell>
                <span className={`font-semibold ${
                  req.priority === 'URGENT' ? 'text-red-600 dark:text-red-400' :
                  req.priority === 'HIGH' ? 'text-amber-600 dark:text-amber-400' : 'text-muted-foreground'
                }`}>
                  {req.priority}
                </span>
              </TableCell>

              <TableCell>
                <PurchaseRequestStatusBadge status={req.status} />
              </TableCell>

              <TableCell className="text-muted-foreground">
                {new Date(req.createdAt).toLocaleDateString('pt-BR')}
              </TableCell>

              <TableCell className="text-right">
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 text-xs"
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectRequest(req);
                  }}
                >
                  Ver detalhes
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};
