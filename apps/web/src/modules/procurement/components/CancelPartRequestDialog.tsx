import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { extractErrorMessage } from '@/utils/errorHandler';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { cancelPartRequestSchema } from '../schemas/procurementSchemas';
import { useProcurementMutations } from '../hooks/useProcurementMutations';
import { PurchaseRequest } from '../types/procurement.types';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  request: PurchaseRequest | null;
  onSuccess?: () => void;
}

interface FormValues {
  cancelReason: string;
}

export const CancelPartRequestDialog: React.FC<Props> = ({
  open,
  onOpenChange,
  request,
  onSuccess,
}) => {
  const { cancelRequestMutation } = useProcurementMutations();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(cancelPartRequestSchema),
    defaultValues: { cancelReason: '' },
  });

  if (!request) return null;

  const onSubmit = async (data: FormValues) => {
    try {
      await cancelRequestMutation.mutateAsync({
        id: request.id,
        input: { cancelReason: data.cancelReason },
      });

      toast.success(`Solicitação da peça "${request.provisionalName}" foi cancelada.`);
      reset();
      onOpenChange(false);
      if (onSuccess) onSuccess();
    } catch (err) {
      toast.error(extractErrorMessage(err, 'Erro ao cancelar solicitação.'));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[450px]" onOpenAutoFocus={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle className="text-destructive">Cancelar Solicitação de Peça</DialogTitle>
          <DialogDescription>
            {request.status === 'READY_FOR_PICKUP'
              ? 'A peça já foi recebida. Ao cancelar, a reserva para a OS será liberada e o saldo físico permanecerá no estoque.'
              : 'Informe o motivo do cancelamento. Esta ação será gravada no histórico.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="cancelReason">Motivo do cancelamento *</Label>
            <textarea
              id="cancelReason"
              rows={3}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              placeholder="Ex: Cliente desistiu do serviço."
              {...register('cancelReason')}
            />
            {errors.cancelReason && (
              <p className="text-xs text-destructive">{errors.cancelReason.message}</p>
            )}
          </div>

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting || cancelRequestMutation.isPending}
            >
              Voltar
            </Button>
            <Button
              type="submit"
              variant="destructive"
              disabled={isSubmitting || cancelRequestMutation.isPending}
            >
              {cancelRequestMutation.isPending ? 'Cancelando...' : 'Confirmar Cancelamento'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
