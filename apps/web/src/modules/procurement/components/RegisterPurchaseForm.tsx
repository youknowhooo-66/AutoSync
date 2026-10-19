import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { RefreshCw } from 'lucide-react';
import { extractErrorMessage } from '@/utils/errorHandler';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { registerPurchaseSchema } from '../schemas/procurementSchemas';
import { useProcurementMutations } from '../hooks/useProcurementMutations';
import { useCodeSuggestion } from '../hooks/useCodeSuggestion';
import { useSuppliers } from '../hooks/useSuppliers';
import type { PurchaseRequest } from '../types/procurement.types';
import { normalizeDecimalInput } from '../utils/procurementUtils';

interface Props {
  request: PurchaseRequest;
  onSuccess?: () => void;
}

interface FormValues {
  definitiveName: string;
  suggestedInternalCode: string;
  brand?: string;
  purchasedQuantity: string;
  unitPrice: string;
  supplierId: string;
  purchaseOrderRef?: string;
  expectedDeliveryAt?: string;
  financialNote?: string;
}

export const RegisterPurchaseForm: React.FC<Props> = ({ request, onSuccess }) => {
  const { registerPurchaseMutation } = useProcurementMutations();
  const { data: codeSuggestion, refetch: refetchCode, isLoading: isSuggestingCode } = useCodeSuggestion(request.id, true);
  const { data: suppliers = [], isLoading: isLoadingSuppliers } = useSuppliers();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(registerPurchaseSchema),
    defaultValues: {
      definitiveName: request.provisionalName || '',
      suggestedInternalCode: '',
      brand: '',
      purchasedQuantity: request.requestedQuantity || '1',
      unitPrice: '',
      supplierId: '',
      purchaseOrderRef: '',
      expectedDeliveryAt: request.expectedDeliveryAt || '',
      financialNote: '',
    },
  });

  const watchedCode = watch('suggestedInternalCode');
  const watchedSupplierId = watch('supplierId');

  useEffect(() => {
    if (codeSuggestion?.suggestedCode && !watchedCode) {
      setValue('suggestedInternalCode', codeSuggestion.suggestedCode.toUpperCase());
    }
  }, [codeSuggestion, watchedCode, setValue]);

  const handleRefreshSuggestion = async () => {
    const res = await refetchCode();
    if (res.data?.suggestedCode) {
      setValue('suggestedInternalCode', res.data.suggestedCode.toUpperCase());
      toast.info('Nova sugestão de código gerada!');
    }
  };

  const onSubmit = async (data: FormValues) => {
    try {
      const normalizedPrice = normalizeDecimalInput(data.unitPrice);
      const normalizedQty = normalizeDecimalInput(data.purchasedQuantity);

      await registerPurchaseMutation.mutateAsync({
        id: request.id,
        input: {
          ...data,
          suggestedInternalCode: data.suggestedInternalCode.toUpperCase(),
          unitPrice: normalizedPrice,
          purchasedQuantity: normalizedQty,
        },
      });

      toast.success('Compra registrada com sucesso!');
      if (onSuccess) onSuccess();
    } catch (err) {
      toast.error(extractErrorMessage(err, 'Erro ao registrar compra.'));
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 rounded-md border p-4 bg-muted/20">
      <h4 className="font-semibold text-sm text-foreground border-b pb-2">Registrar Compra de Peça</h4>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Nome definitivo */}
        <div className="space-y-2">
          <Label htmlFor="definitiveName">Nome definitivo da peça *</Label>
          <Input id="definitiveName" {...register('definitiveName')} />
          {errors.definitiveName && <p className="text-xs text-destructive">{errors.definitiveName.message}</p>}
        </div>

        {/* Código interno com sugestão */}
        <div className="space-y-2">
          <Label htmlFor="suggestedInternalCode">Código interno *</Label>
          <div className="flex gap-2">
            <Input
              id="suggestedInternalCode"
              className="font-mono uppercase"
              value={watchedCode || ''}
              onChange={(e) => setValue('suggestedInternalCode', e.target.value.toUpperCase())}
            />
            <Button
              type="button"
              variant="outline"
              size="icon"
              title="Gerar nova sugestão de código"
              onClick={handleRefreshSuggestion}
              disabled={isSuggestingCode}
            >
              <RefreshCw className={`w-4 h-4 ${isSuggestingCode ? 'animate-spin' : ''}`} />
            </Button>
          </div>
          {errors.suggestedInternalCode && (
            <p className="text-xs text-destructive">{errors.suggestedInternalCode.message}</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Marca */}
        <div className="space-y-2">
          <Label htmlFor="brand">Marca / Fabricante</Label>
          <Input id="brand" placeholder="Ex: Bosch" {...register('brand')} />
        </div>

        {/* Quantidade comprada */}
        <div className="space-y-2">
          <Label htmlFor="purchasedQuantity">Qtd. comprada *</Label>
          <Input id="purchasedQuantity" type="number" step="any" min="0.001" {...register('purchasedQuantity')} />
          {errors.purchasedQuantity && (
            <p className="text-xs text-destructive">{errors.purchasedQuantity.message}</p>
          )}
        </div>

        {/* Preço unitário */}
        <div className="space-y-2">
          <Label htmlFor="unitPrice">Preço unitário (R$) *</Label>
          <Input id="unitPrice" placeholder="Ex: 250,90" {...register('unitPrice')} />
          {errors.unitPrice && <p className="text-xs text-destructive">{errors.unitPrice.message}</p>}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Fornecedor */}
        <div className="space-y-2">
          <Label htmlFor="supplierId">Fornecedor *</Label>
          <Select value={watchedSupplierId} onValueChange={(val) => setValue('supplierId', val)}>
            <SelectTrigger id="supplierId">
              <SelectValue placeholder={isLoadingSuppliers ? 'Carregando fornecedores...' : 'Selecione o fornecedor'} />
            </SelectTrigger>
            <SelectContent>
              {suppliers.map((sup) => (
                <SelectItem key={sup.id} value={sup.id}>
                  {sup.name} {sup.cnpj ? `(${sup.cnpj})` : ''}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.supplierId && <p className="text-xs text-destructive">{errors.supplierId.message}</p>}
        </div>

        {/* Referência do pedido */}
        <div className="space-y-2">
          <Label htmlFor="purchaseOrderRef">Pedido / Comprovante</Label>
          <Input id="purchaseOrderRef" placeholder="Ex: NF-123456" {...register('purchaseOrderRef')} />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Previsão de entrega */}
        <div className="space-y-2">
          <Label htmlFor="expectedDeliveryAt">Previsão de entrega</Label>
          <Input id="expectedDeliveryAt" type="date" {...register('expectedDeliveryAt')} />
        </div>

        {/* Observação financeira */}
        <div className="space-y-2">
          <Label htmlFor="financialNote">Observação financeira</Label>
          <Input id="financialNote" placeholder="Ex: Pago via PIX. Entrega em 2 dias." {...register('financialNote')} />
        </div>
      </div>

      <div className="flex justify-end pt-2">
        <Button type="submit" disabled={isSubmitting || registerPurchaseMutation.isPending}>
          {registerPurchaseMutation.isPending ? 'Salvando compra...' : 'Salvar dados da compra'}
        </Button>
      </div>
    </form>
  );
};
