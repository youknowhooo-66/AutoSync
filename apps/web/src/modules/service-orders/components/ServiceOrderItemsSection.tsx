import { useState } from 'react';
import { useCreateServiceOrderItem, useDeleteServiceOrderItem } from '../hooks/useServiceOrderItems';
import { ServiceOrderItemForm } from './ServiceOrderItemForm';
import { Button } from '@/components/ui/button';
import { Trash2, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { usePermissions } from '../../auth/hooks/usePermissions';

export function ServiceOrderItemsSection({ serviceOrder }: { serviceOrder: any }) {
  const [isAdding, setIsAdding] = useState(false);
  const createMutation = useCreateServiceOrderItem();
  const deleteMutation = useDeleteServiceOrderItem();
  const { can } = usePermissions();

  const canAdd = can('os.edit');
  const canRemove = can('os.edit');
  const isEditable = serviceOrder?.status === 'OPEN' || serviceOrder?.status === 'IN_PROGRESS' || serviceOrder?.status === 'AWAITING_PARTS';

  const handleAddSubmit = (data: any) => {
    const payload: any = { serviceOrderId: serviceOrder.id };
    if (data.type === 'PART') {
      if (!data.stockId) {
        toast.error('Não foi possível identificar o estoque desta peça na filial selecionada.');
        return;
      }
      payload.parts = [
        {
          stockId: data.stockId,
          quantity: Number(data.quantity),
          unitPrice: data.unitPrice ? String(data.unitPrice) : undefined,
        },
      ];
    } else {
      payload.services = [
        {
          description: data.description,
          quantity: Number(data.quantity),
          unitPrice: String(data.unitPrice),
        },
      ];
    }

    createMutation.mutate(payload, {
      onSuccess: () => setIsAdding(false),
    });
  };

  const handleRemove = (id: string, type: 'PART' | 'SERVICE') => {
    if (confirm('Tem certeza que deseja remover este item?')) {
      deleteMutation.mutate({ serviceOrderId: serviceOrder.id, itemId: id, type });
    }
  };

  return (
    <div className="space-y-4 mt-6">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold">Itens e Serviços</h2>
        {canAdd && isEditable && !isAdding && (
          <Button size="sm" data-testid="os-add-item-btn" onClick={() => setIsAdding(true)}>
            <Plus className="w-4 h-4 mr-2" /> Adicionar
          </Button>
        )}
      </div>

      {isAdding && (
        <ServiceOrderItemForm 
          serviceOrderId={serviceOrder?.id}
          branchId={serviceOrder?.branchId || serviceOrder?.branch?.id}
          onSubmit={handleAddSubmit} 
          onCancel={() => setIsAdding(false)} 
          isLoading={createMutation.isPending}
        />
      )}

      {/* Services Table */}
      {serviceOrder?.services && serviceOrder.services.length > 0 && (
        <div className="border rounded-md">
          <table className="w-full text-sm text-left">
            <thead className="bg-muted text-muted-foreground">
              <tr>
                <th className="p-3">Serviço</th>
                <th className="p-3">Valor</th>
                {canRemove && isEditable && <th className="p-3 w-10"></th>}
              </tr>
            </thead>
            <tbody>
              {serviceOrder.services.map((s: any) => (
                <tr key={s.id} className="border-t">
                  <td className="p-3">{s.name}</td>
                  <td className="p-3">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(s.price || 0))}</td>
                  {canRemove && isEditable && (
                    <td className="p-3 text-right">
                      <Button variant="ghost" size="icon" onClick={() => handleRemove(s.id, 'SERVICE')} disabled={deleteMutation.isPending}>
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </Button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Parts Table */}
      {serviceOrder?.parts && serviceOrder.parts.length > 0 && (
        <div className="border rounded-md mt-4">
          <table className="w-full text-sm text-left">
            <thead className="bg-muted text-muted-foreground">
              <tr>
                <th className="p-3">Peça (Necessidade Planejada)</th>
                <th className="p-3">Qtd</th>
                <th className="p-3">Valor Unit.</th>
                <th className="p-3">Total</th>
                {canRemove && isEditable && <th className="p-3 w-10"></th>}
              </tr>
            </thead>
            <tbody>
              {serviceOrder.parts.map((p: any) => (
                <tr key={p.id} data-testid={`os-item-row-${p.stockId || p.partId}`} className="border-t">
                  <td className="p-3">{p.part?.name || p.partId}</td>
                  <td className="p-3">{p.quantity}</td>
                  <td className="p-3">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(p.unitPrice || 0))}</td>
                  <td className="p-3">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(p.unitPrice || 0) * p.quantity)}</td>
                  {canRemove && isEditable && (
                    <td className="p-3 text-right">
                      <Button variant="ghost" size="icon" onClick={() => handleRemove(p.id, 'PART')} disabled={deleteMutation.isPending}>
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </Button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {(serviceOrder?.parts?.length === 0 && serviceOrder?.services?.length === 0) && (
        <div className="text-center p-6 border rounded-md text-muted-foreground">
          Nenhum item ou serviço adicionado.
        </div>
      )}

      {/* Totals Summary */}
      <div className="flex justify-end pt-4 border-t mt-6">
        <div className="w-64 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Total Serviços:</span>
            <span>{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(serviceOrder?.totalServices || 0))}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Total Peças:</span>
            <span>{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(serviceOrder?.totalParts || 0))}</span>
          </div>
          {Number(serviceOrder?.discount || 0) > 0 && (
            <div className="flex justify-between text-sm text-red-500">
              <span>Desconto:</span>
              <span>- {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(serviceOrder?.discount || 0))}</span>
            </div>
          )}
          <div className="flex justify-between text-base font-bold pt-2 border-t">
            <span>Total Final:</span>
            <span className="text-primary">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(serviceOrder?.finalValue || 0))}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
