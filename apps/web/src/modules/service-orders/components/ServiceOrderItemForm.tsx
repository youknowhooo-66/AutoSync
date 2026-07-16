import React, { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type { ItemType } from '../types/serviceOrderItem.types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
// Note: Assumes a StockSelector component exists or will be simple select. Let's use simple string input for stockId for now, or adapt to what we have.
import { useQuery } from '@tanstack/react-query';
import api from '@/services/api';

const formSchema = z.object({
  type: z.enum(['PART', 'SERVICE']),
  stockId: z.string().optional(),
  description: z.string().optional(),
  quantity: z.number().min(0.01, 'Quantity must be positive'),
  unitPrice: z.string().optional(),
}).superRefine((data, ctx) => {
  if (data.type === 'PART' && !data.stockId) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Selecione uma peça', path: ['stockId'] });
  }
  if (data.type === 'SERVICE' && (!data.description || data.description.length < 3)) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Descrição do serviço obrigatória', path: ['description'] });
  }
  if (data.type === 'SERVICE' && (!data.unitPrice || parseFloat(data.unitPrice) <= 0)) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Valor do serviço é obrigatório', path: ['unitPrice'] });
  }
});

type FormValues = z.infer<typeof formSchema>;

interface ServiceOrderItemFormProps {
  onSubmit: (data: FormValues) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export function ServiceOrderItemForm({ onSubmit, onCancel, isLoading }: ServiceOrderItemFormProps) {
  const [type, setType] = useState<ItemType>('SERVICE');
  
  // Minimal manual form state for UI speed, or we can use react-hook-form
  // Let's use react-hook-form standard if it's available. The prompt says "Use React Hook Form and Zod."
  // I'll import standard RHF
  return (
    <RHFForm type={type} setType={setType} onSubmit={onSubmit} onCancel={onCancel} isLoading={isLoading} />
  );
}

import { useForm as useRHF } from 'react-hook-form';

function RHFForm({ type, setType, onSubmit, onCancel, isLoading }: any) {
  const { data: stocks, isLoading: isLoadingStocks } = useQuery({
    queryKey: ['parts'],
    queryFn: async () => (await api.get('/inventory/parts')).data,
  });
  const { register, handleSubmit, setValue, watch, formState: { errors } } = useRHF<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { type: 'SERVICE', quantity: 1 }
  });

  // Watch type to re-render
  const watchedType = watch('type');
  React.useEffect(() => { setType(watchedType); }, [watchedType, setType]);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 border p-4 rounded-md bg-muted/20">
      <h3 className="font-medium text-sm">Adicionar Item ou Serviço</h3>
      
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Tipo</Label>
          <Select 
            value={watchedType} 
            onValueChange={(v) => setValue('type', v as ItemType, { shouldValidate: true })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="SERVICE">Serviço</SelectItem>
              <SelectItem value="PART">Peça (Planejada)</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        {watchedType === 'PART' ? (
          <div className="space-y-2">
            <Label>Peça no Estoque</Label>
            <Select 
              onValueChange={(v) => setValue('stockId', v, { shouldValidate: true })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione..." />
              </SelectTrigger>
              <SelectContent>
                {stocks?.map((s: any) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.name} (Catálogo: R$ {s.salePrice})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.stockId && <p className="text-red-500 text-xs">{errors.stockId.message}</p>}
          </div>
        ) : (
          <div className="space-y-2">
            <Label>Descrição do Serviço</Label>
            <Input {...register('description')} placeholder="Ex: Troca de óleo" />
            {errors.description && <p className="text-red-500 text-xs">{errors.description.message}</p>}
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Quantidade</Label>
          <Input 
            type="number" 
            step="0.01" 
            {...register('quantity', { valueAsNumber: true })} 
          />
          {errors.quantity && <p className="text-red-500 text-xs">{errors.quantity.message}</p>}
        </div>
        
        <div className="space-y-2">
          <Label>{watchedType === 'PART' ? 'Preço de Referência (Opcional)' : 'Valor Unitário'}</Label>
          <Input 
            type="number" 
            step="0.01" 
            {...register('unitPrice')} 
            placeholder={watchedType === 'PART' ? 'Catálogo' : '0.00'}
          />
          {errors.unitPrice && <p className="text-red-500 text-xs">{errors.unitPrice.message}</p>}
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onCancel}>Cancelar</Button>
        <Button type="submit" disabled={isLoading}>{isLoading ? 'Salvando...' : 'Adicionar'}</Button>
      </div>
    </form>
  );
}
