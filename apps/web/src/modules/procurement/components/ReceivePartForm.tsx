import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { extractErrorMessage } from '@/utils/errorHandler';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { receivePartSchema } from '../schemas/procurementSchemas';
import { useProcurementMutations } from '../hooks/useProcurementMutations';
import type { PurchaseRequest } from '../types/procurement.types';
import { formatCurrencyBRL } from '../utils/procurementUtils';

interface Props {
  request: PurchaseRequest;
  onSuccess?: () => void;
}

interface FormValues {
  receivedQuantity: string;
}

export const ReceivePartForm: React.FC<Props> = ({ request, onSuccess }) => {
  const { receivePartMutation } = useProcurementMutations();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(receivePartSchema),
    defaultValues: {
      receivedQuantity: request.purchasedQuantity || request.requestedQuantity || '1',
    },
  });

  const onSubmit = async (data: FormValues) => {
    try {
      const requestedNum = parseFloat(request.requestedQuantity || request.quantity);
      const receivedNum = parseFloat(data.receivedQuantity);

      if (receivedNum < requestedNum) {
        toast.error(`A quantidade recebida (${receivedNum}) é inferior à quantidade solicitada para a OS (${requestedNum}).`);
        return;
      }

      await receivePartMutation.mutateAsync({
        id: request.id,
        input: {
          receivedQuantity: data.receivedQuantity,
        },
      });

      toast.success('Recebimento físico confirmado e estoque atualizado!');
      if (onSuccess) onSuccess();
    } catch (err) {
      toast.error(extractErrorMessage(err, 'Erro ao confirmar recebimento físico.'));
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 rounded-md border p-4 bg-muted/20">
      <h4 className="font-semibold text-sm text-foreground border-b pb-2">Confirmar Recebimento Físico no Estoque</h4>

      {/* Somente Leitura com dados da compra registrados pelo financeiro */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs bg-background/60 p-3 rounded border">
        <div>
          <span className="text-muted-foreground block">Peça / Descrição</span>
          <span className="font-semibold">{request.provisionalName}</span>
        </div>
        <div>
          <span className="text-muted-foreground block">Código Interno</span>
          <span className="font-mono font-medium">{request.part?.internalCode || 'A definir'}</span>
        </div>
        <div>
          <span className="text-muted-foreground block">Fornecedor</span>
          <span className="font-medium">{request.supplier?.name || 'Não informado'}</span>
        </div>
        <div>
          <span className="text-muted-foreground block">Valor Unitário</span>
          <span className="font-medium">{formatCurrencyBRL(request.unitPrice)}</span>
        </div>
        <div>
          <span className="text-muted-foreground block">Qtd. Solicitada OS</span>
          <span className="font-medium text-amber-600 dark:text-amber-400">{request.requestedQuantity} un</span>
        </div>
        <div>
          <span className="text-muted-foreground block">Qtd. Comprada</span>
          <span className="font-medium">{request.purchasedQuantity || request.requestedQuantity} un</span>
        </div>
      </div>

      <div className="space-y-2 max-w-xs">
        <Label htmlFor="receivedQuantity">Quantidade física recebida *</Label>
        <Input
          id="receivedQuantity"
          type="number"
          step="any"
          min={request.requestedQuantity || '0.001'}
          {...register('receivedQuantity')}
        />
        {errors.receivedQuantity && (
          <p className="text-xs text-destructive">{errors.receivedQuantity.message}</p>
        )}
        <p className="text-[11px] text-muted-foreground">
          Deve ser no mínimo igual a <span className="font-medium">{request.requestedQuantity} un</span> para atender à OS.
        </p>
      </div>

      <div className="flex justify-end pt-2 border-t">
        <Button
          type="submit"
          className="bg-emerald-600 hover:bg-emerald-700 text-white"
          disabled={isSubmitting || receivePartMutation.isPending}
        >
          {receivePartMutation.isPending ? 'Confirmando...' : 'Confirmar Recebimento Físico'}
        </Button>
      </div>
    </form>
  );
};
