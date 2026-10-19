import { z } from 'zod';

export const createPartRequestSchema = z.object({
  serviceOrderId: z.string().min(1, 'Ordem de Serviço é obrigatória.'),
  provisionalName: z.string().min(1, 'Nome ou descrição da peça é obrigatório.'),
  requestedQuantity: z
    .string()
    .min(1, 'Quantidade é obrigatória.')
    .refine((val) => !isNaN(parseFloat(val)) && parseFloat(val) > 0, {
      message: 'Quantidade deve ser um número positivo.',
    }),
  mechanicNotes: z.string().optional(),
  priority: z.enum(['LOW', 'NORMAL', 'HIGH', 'URGENT']).default('NORMAL'),
  expectedDeliveryAt: z.string().optional(),
});

export const registerPurchaseSchema = z.object({
  definitiveName: z.string().min(1, 'Nome definitivo da peça é obrigatório.'),
  suggestedInternalCode: z.string().min(1, 'Código interno é obrigatório.'),
  brand: z.string().optional(),
  purchasedQuantity: z
    .string()
    .min(1, 'Quantidade comprada é obrigatória.')
    .refine((val) => !isNaN(parseFloat(val)) && parseFloat(val) > 0, {
      message: 'Quantidade deve ser um número positivo.',
    }),
  unitPrice: z
    .string()
    .min(1, 'Valor unitário é obrigatório.')
    .refine((val) => !isNaN(parseFloat(val.replace(',', '.'))) && parseFloat(val.replace(',', '.')) >= 0, {
      message: 'Preço unitário deve ser um número válido não negativo.',
    }),
  supplierId: z.string().min(1, 'Fornecedor é obrigatório.'),
  purchaseOrderRef: z.string().optional(),
  expectedDeliveryAt: z.string().optional(),
  financialNote: z.string().optional(),
});

export const receivePartSchema = z.object({
  receivedQuantity: z
    .string()
    .min(1, 'Quantidade recebida é obrigatória.')
    .refine((val) => !isNaN(parseFloat(val)) && parseFloat(val) > 0, {
      message: 'Quantidade recebida deve ser um número positivo.',
    }),
});

export const cancelPartRequestSchema = z.object({
  cancelReason: z.string().min(1, 'Motivo do cancelamento é obrigatório.'),
});
