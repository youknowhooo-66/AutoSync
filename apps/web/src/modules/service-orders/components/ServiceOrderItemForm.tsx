import React, { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import type { ItemType } from '../types/serviceOrderItem.types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { PartSearchCombobox, type PartSearchItem } from './PartSearchCombobox';

// ── Schema ─────────────────────────────────────────────────────────────────────

const formSchema = z
  .object({
    type: z.enum(['PART', 'SERVICE']),
    /** Part ID from the catalog (required when type=PART) */
    partId: z.string().optional(),
    description: z.string().optional(),
    quantity: z.number().min(0.001, 'Quantidade deve ser positiva'),
    unitPrice: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.type === 'PART' && !data.partId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Selecione uma peça do catálogo',
        path: ['partId'],
      });
    }
    if (data.type === 'SERVICE' && (!data.description || data.description.length < 3)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Descrição do serviço é obrigatória',
        path: ['description'],
      });
    }
    if (
      data.type === 'SERVICE' &&
      (!data.unitPrice || parseFloat(data.unitPrice) <= 0)
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Valor do serviço é obrigatório',
        path: ['unitPrice'],
      });
    }
  });

type FormValues = z.infer<typeof formSchema>;

// ── Props ──────────────────────────────────────────────────────────────────────

interface ServiceOrderItemFormProps {
  onSubmit: (data: FormValues & { selectedPart?: PartSearchItem }) => void;
  onCancel: () => void;
  isLoading?: boolean;
  /** branchId to scope stock availability in the combobox */
  branchId?: string;
  /** Show "Register new part" link in the combobox (requires write capability) */
  canCreatePart?: boolean;
  onCreatePart?: () => void;
}

// ── Component ─────────────────────────────────────────────────────────────────

export function ServiceOrderItemForm({
  onSubmit,
  onCancel,
  isLoading,
  branchId,
  canCreatePart = false,
  onCreatePart,
}: ServiceOrderItemFormProps) {
  const [selectedPart, setSelectedPart] = useState<PartSearchItem | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { type: 'SERVICE', quantity: 1 },
  });

  const watchedType = watch('type');
  const watchedPartId = watch('partId');

  // When a part is selected in the Combobox, populate the reference price
  function handlePartSelect(part: PartSearchItem) {
    setSelectedPart(part);
    setValue('partId', part.id, { shouldValidate: true });
    // Price rule: salePrice (catalog list price) → averageCost (cost, fallback only).
    // The field is labeled "Preço Unitário (editável)" so the user can adjust it.
    const referencePrice = part.salePrice ?? part.averageCost;
    if (referencePrice) {
      setValue('unitPrice', parseFloat(referencePrice).toFixed(2));
    }
  }

  function handleFormSubmit(data: FormValues) {
    onSubmit({ ...data, selectedPart: selectedPart ?? undefined });
  }

  return (
    <form
      onSubmit={handleSubmit(handleFormSubmit)}
      className="space-y-4 border p-4 rounded-md bg-muted/20"
    >
      <h3 className="font-medium text-sm">Adicionar Item ou Serviço</h3>

      {/* Row 1: Type + Part/Service input */}
      <div className="grid grid-cols-2 gap-4">
        {/* Type selector */}
        <div className="space-y-2">
          <Label htmlFor="item-type-select">Tipo</Label>
          <Select
            value={watchedType}
            onValueChange={(v) =>
              setValue('type', v as ItemType, { shouldValidate: true })
            }
          >
            <SelectTrigger id="item-type-select">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="SERVICE">Serviço</SelectItem>
              <SelectItem value="PART">Peça (Planejada)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Part search or service description */}
        {watchedType === 'PART' ? (
          <div className="space-y-2">
            <Label htmlFor="part-search-combobox-trigger">Peça do Catálogo</Label>
            <PartSearchCombobox
              value={watchedPartId}
              onSelect={handlePartSelect}
              branchId={branchId}
              showCreateLink={canCreatePart}
              onCreatePart={onCreatePart}
            />
            {errors.partId && (
              <p className="text-red-500 text-xs">{errors.partId.message}</p>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            <Label htmlFor="service-description">Descrição do Serviço</Label>
            <Input
              id="service-description"
              {...register('description')}
              placeholder="Ex: Troca de óleo"
            />
            {errors.description && (
              <p className="text-red-500 text-xs">{errors.description.message}</p>
            )}
          </div>
        )}
      </div>

      {/* Row 2: Selected part info (shown when a part is selected) */}
      {watchedType === 'PART' && selectedPart && (
        <div className="rounded-md border bg-muted/30 px-3 py-2 text-xs text-muted-foreground space-y-0.5">
          <p>
            <span className="font-medium text-foreground">{selectedPart.name}</span>
            {selectedPart.brand && <span className="ml-1">— {selectedPart.brand}</span>}
          </p>
          <p>
            Disponível:{' '}
            <span className="font-mono text-foreground">
              {parseFloat(selectedPart.availableQuantity).toFixed(3)}
            </span>{' '}
            {selectedPart.unit ?? 'UN'}
            {selectedPart.location && (
              <span className="ml-2">📍 {selectedPart.location}</span>
            )}
          </p>
        </div>
      )}

      {/* Row 3: Quantity + Reference price */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="item-quantity">Quantidade</Label>
          <Input
            id="item-quantity"
            type="number"
            step="0.001"
            min="0.001"
            {...register('quantity', { valueAsNumber: true })}
          />
          {errors.quantity && (
            <p className="text-red-500 text-xs">{errors.quantity.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="item-unit-price">
            {watchedType === 'PART' ? 'Preço de Referência (Opcional)' : 'Valor Unitário'}
          </Label>
          <Input
            id="item-unit-price"
            type="number"
            step="0.01"
            min="0"
            {...register('unitPrice')}
            placeholder={watchedType === 'PART' ? 'Catálogo' : '0.00'}
          />
          {errors.unitPrice && (
            <p className="text-red-500 text-xs">{errors.unitPrice.message}</p>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? 'Salvando...' : 'Adicionar'}
        </Button>
      </div>
    </form>
  );
}
