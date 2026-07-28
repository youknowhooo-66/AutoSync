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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { createPartRequestSchema } from '../schemas/procurementSchemas';
import { useProcurementMutations } from '../hooks/useProcurementMutations';
import { PurchaseRequestPriority } from '../types/procurement.types';

interface CreatePartRequestDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  serviceOrderId: string;
  onSuccess?: () => void;
}

interface FormValues {
  provisionalName: string;
  requestedQuantity: string;
  mechanicNotes?: string;
  priority: PurchaseRequestPriority;
  expectedDeliveryAt?: string;
}

export const CreatePartRequestDialog: React.FC<CreatePartRequestDialogProps> = ({
  open,
  onOpenChange,
  serviceOrderId,
  onSuccess,
}) => {
  const { createRequestMutation } = useProcurementMutations();

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(
      createPartRequestSchema.omit({ serviceOrderId: true })
    ),
    defaultValues: {
      provisionalName: '',
      requestedQuantity: '1',
      mechanicNotes: '',
      priority: 'NORMAL',
      expectedDeliveryAt: '',
    },
  });

  const watchedPriority = watch('priority');

  const onSubmitForm = async (data: FormValues) => {
    try {
      await createRequestMutation.mutateAsync({
        serviceOrderId,
        provisionalName: data.provisionalName,
        requestedQuantity: data.requestedQuantity,
        mechanicNotes: data.mechanicNotes || undefined,
        priority: data.priority,
        expectedDeliveryAt: data.expectedDeliveryAt || undefined,
      });

      toast.success('Solicitação de peça enviada com sucesso!');
      reset();
      onOpenChange(false);
      if (onSuccess) onSuccess();
    } catch (err) {
      toast.error(extractErrorMessage(err, 'Erro ao enviar solicitação de peça.'));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]" onOpenAutoFocus={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle>Solicitar peça para compra</DialogTitle>
          <DialogDescription>
            Informe como a peça é conhecida e acrescente detalhes que ajudem o financeiro a localizar o item correto.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmitForm)} className="space-y-4 py-2">
          {/* Nome ou descrição livre */}
          <div className="space-y-2">
            <Label htmlFor="provisionalName">Nome ou descrição da peça *</Label>
            <Input
              id="provisionalName"
              placeholder="Ex: Coxim superior do motor lado direito"
              {...register('provisionalName')}
            />
            {errors.provisionalName && (
              <p className="text-xs text-destructive">{errors.provisionalName.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Quantidade */}
            <div className="space-y-2">
              <Label htmlFor="requestedQuantity">Quantidade *</Label>
              <Input
                id="requestedQuantity"
                type="number"
                step="any"
                min="0.001"
                placeholder="1"
                {...register('requestedQuantity')}
              />
              {errors.requestedQuantity && (
                <p className="text-xs text-destructive">{errors.requestedQuantity.message}</p>
              )}
            </div>

            {/* Prioridade */}
            <div className="space-y-2">
              <Label htmlFor="priority">Prioridade</Label>
              <Select
                value={watchedPriority}
                onValueChange={(val) => setValue('priority', val as PurchaseRequestPriority)}
              >
                <SelectTrigger id="priority">
                  <SelectValue placeholder="Selecione a prioridade" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="LOW">Baixa</SelectItem>
                  <SelectItem value="NORMAL">Normal</SelectItem>
                  <SelectItem value="HIGH">Alta</SelectItem>
                  <SelectItem value="URGENT">Urgente</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Data limite / recomendada */}
          <div className="space-y-2">
            <Label htmlFor="expectedDeliveryAt">Necessária até (opcional)</Label>
            <Input id="expectedDeliveryAt" type="date" {...register('expectedDeliveryAt')} />
          </div>

          {/* Observação técnica */}
          <div className="space-y-2">
            <Label htmlFor="mechanicNotes">Observação técnica</Label>
            <textarea
              id="mechanicNotes"
              rows={3}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              placeholder="Ex: Confirmar número do chassi com o cliente antes de pedir."
              {...register('mechanicNotes')}
            />
          </div>

          <DialogFooter className="pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting || createRequestMutation.isPending}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || createRequestMutation.isPending}
            >
              {createRequestMutation.isPending ? 'Enviando...' : 'Enviar solicitação'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
