import React from 'react';
import { useForm } from 'react-hook-form';
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PurchaseRequest } from '../types/procurement.types';
import { useProcurementMutations } from '../hooks/useProcurementMutations';

interface InstallPartDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  request: PurchaseRequest | null;
  onSuccess?: () => void;
}

interface FormValues {
  installedQuantity: string;
}

export const InstallPartDialog: React.FC<InstallPartDialogProps> = ({
  open,
  onOpenChange,
  request,
  onSuccess,
}) => {
  const { installPartMutation } = useProcurementMutations();

  const {
    register,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm<FormValues>({
    values: {
      installedQuantity: request?.purchasedQuantity || request?.requestedQuantity || '1',
    },
  });

  if (!request) return null;

  const onSubmit = async (data: FormValues) => {
    try {
      await installPartMutation.mutateAsync({
        id: request.id,
        input: { installedQuantity: data.installedQuantity },
      });

      toast.success(`Instalação da peça "${request.provisionalName}" confirmada!`);
      onOpenChange(false);
      if (onSuccess) onSuccess();
    } catch (err) {
      toast.error(extractErrorMessage(err, 'Erro ao confirmar instalação da peça.'));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[450px]" onOpenAutoFocus={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle>Confirmar Instalação de Peça</DialogTitle>
          <DialogDescription>
            Confirme que a peça retirada do estoque foi efetivamente instalada no veículo do cliente.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-2">
          <div className="rounded-md bg-muted p-3 space-y-1 text-sm">
            <p><span className="font-semibold">Peça:</span> {request.provisionalName}</p>
            <p><span className="font-semibold">Quantidade solicitada:</span> {request.requestedQuantity}</p>
            {request.purchasedQuantity && (
              <p><span className="font-semibold">Quantidade disponível:</span> {request.purchasedQuantity}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="installedQuantity">Quantidade a instalar *</Label>
            <Input
              id="installedQuantity"
              type="number"
              step="any"
              min="0.001"
              {...register('installedQuantity', { required: true })}
            />
          </div>

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting || installPartMutation.isPending}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || installPartMutation.isPending}
            >
              {installPartMutation.isPending ? 'Confirmando...' : 'Confirmar Instalação'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
