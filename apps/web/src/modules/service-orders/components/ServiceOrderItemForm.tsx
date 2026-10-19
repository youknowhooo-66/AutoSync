import React, { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { toast } from 'sonner';
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
import { CreatePartRequestDialog } from '@/modules/procurement/components/CreatePartRequestDialog';

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
  onSubmit: (data: FormValues & { stockId?: string; selectedPart?: PartSearchItem }) => void;
  onCancel: () => void;
  isLoading?: boolean;
  /** branchId to scope stock availability in the combobox */
  branchId?: string;
  /** serviceOrderId linked to requested part */
  serviceOrderId?: string;
}

// ── Component ─────────────────────────────────────────────────────────────────

export function ServiceOrderItemForm({
  onSubmit,
  onCancel,
  isLoading,
  branchId,
  serviceOrderId = '',
}: ServiceOrderItemFormProps) {
  const createPartTriggerRef = React.useRef<HTMLButtonElement>(null);
  const [selectedPart, setSelectedPart] = useState<PartSearchItem | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    setError,
    watch,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { type: 'PART', quantity: 1 },
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
    if (data.type === 'PART') {
      const stockId = selectedPart?.stockId;
      if (!stockId) {
        toast.error('A peça selecionada não possui vínculo de estoque com esta filial.');
        return;
      }
      const avail = parseFloat(selectedPart?.availableQuantity || '0');
      if (data.quantity > avail) {
        const formattedAvail = Number.isInteger(avail) ? avail.toString() : avail.toFixed(3).replace(/\.?0+$/, '');
        const formattedQty = Number.isInteger(data.quantity) ? data.quantity.toString() : data.quantity.toString();
        const unitStr = selectedPart?.unit ?? 'UN';
        setError('quantity', {
          type: 'manual',
          message: `A quantidade solicitada (${formattedQty}) excede o saldo disponível (${formattedAvail} ${unitStr})`,
        });
        return;
      }
      onSubmit({ ...data, stockId, selectedPart: selectedPart ?? undefined });
      return;
    }
    onSubmit({ ...data });
  }

  return (
    <>
      <form
        onSubmit={handleSubmit(handleFormSubmit, (errs) => toast.error('Formulário inválido: ' + JSON.stringify(errs)))}
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
              selectedPart={selectedPart}
              onSelect={handlePartSelect}
              branchId={branchId}
              showCreateLink={true}
              onCreatePart={() => setShowCreateModal(true)}
            />
            <div className="flex justify-between items-center text-xs pt-1">
              <span className="text-muted-foreground">Não encontrou no estoque ou é uma peça nova?</span>
              <Button
                ref={createPartTriggerRef}
                type="button"
                variant="link"
                data-testid="create-new-part-link"
                className="h-auto p-0 text-xs text-primary font-medium"
                onClick={() => setShowCreateModal(true)}
              >
                + Solicitar Peça para Compra
              </Button>
            </div>
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
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancelar
          </Button>
        )}
        <Button id="add-item-submit-button" type="submit" disabled={isLoading}>
          {isLoading ? 'Salvando...' : 'Adicionar'}
        </Button>
      </div>
    </form>

    {/* Quick Part Registration Dialog */}
    <CreatePartRequestDialog
      open={showCreateModal}
      onOpenChange={setShowCreateModal}
      serviceOrderId={serviceOrderId}
    />
  </>
);
}
