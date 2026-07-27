/**
 * ServiceOrderCompletionPolicy
 *
 * Fonte única de verdade para os gates de conclusão da Ordem de Serviço.
 * Utilizada tanto pelo GetServiceOrderCompletionReadinessUseCase (consulta)
 * quanto pelo CompleteServiceOrderUseCase (transação final).
 *
 * @note O gate de diagnóstico é provisório (marcador em ServiceOrder.notes)
 * até a criação de uma entidade dedicada de diagnóstico técnico.
 */

import { Prisma } from '@prisma/client';

export type CompletionBlockerCode =
  | 'INVALID_SERVICE_ORDER_STATUS'
  | 'APPROVAL_NOT_APPROVED'
  | 'APPROVAL_SNAPSHOT_MISMATCH'
  | 'DIAGNOSIS_MISSING'
  | 'SERVICE_MISSING'
  | 'SERVICE_NOT_COMPLETED'
  | 'SERVICE_SNAPSHOT_MISMATCH'
  | 'UNAPPROVED_SERVICE_PRESENT'
  | 'PART_MISSING'
  | 'PART_NOT_FULLY_CONSUMED'
  | 'PART_SNAPSHOT_MISMATCH'
  | 'UNAPPROVED_PART_PRESENT'
  | 'MOVEMENT_LEDGER_MISMATCH';

export interface CompletionBlocker {
  code: CompletionBlockerCode;
  message: string;
  entityId?: string;
}

// OSService model uses: id, name, price, executionStatus
export type ServiceForCompletion = {
  id: string;
  name: string;
  price: Prisma.Decimal;
  executionStatus: string;
};

// OSPart model uses: id, partId, quantity, consumedQuantity, unitPrice
export type PartForCompletion = {
  id: string;
  partId: string | null;
  quantity: Prisma.Decimal;
  consumedQuantity: Prisma.Decimal;
  unitPrice: Prisma.Decimal;
};

export type ServiceOrderForCompletion = {
  id: string;
  status: string;
  notes: string | null;
  parts: PartForCompletion[];
  services: ServiceForCompletion[];
};

// Snapshot stores services as { id, description (= OSService.name), unitPrice (= OSService.price) }
// and parts as { id, partId, quantity, unitPrice }
export type ApprovalForCompletion = {
  id: string;
  status: string;
  version: number;
  snapshot: unknown;
};

export type InventoryMovementForCompletion = {
  osPartId: string | null;
  quantity: Prisma.Decimal;
  type: string;
};

const DIAGNOSIS_MARKER = '[DIAGNÓSTICO TÉCNICO]';
const MIN_COMPLETION_NOTES = 5;
const MAX_COMPLETION_NOTES = 2000;

export function validateCompletionNotes(notes: string | undefined | null): CompletionBlocker | null {
  if (!notes || notes.trim().length < MIN_COMPLETION_NOTES) {
    return {
      code: 'INVALID_SERVICE_ORDER_STATUS',
      message: `Observações de conclusão são obrigatórias (mínimo ${MIN_COMPLETION_NOTES} caracteres).`,
    };
  }
  if (notes.trim().length > MAX_COMPLETION_NOTES) {
    return {
      code: 'INVALID_SERVICE_ORDER_STATUS',
      message: `Observações de conclusão excedem o limite de ${MAX_COMPLETION_NOTES} caracteres.`,
    };
  }
  return null;
}

export function evaluateCompletionBlockers(
  os: ServiceOrderForCompletion,
  latestApproval: ApprovalForCompletion | null,
  movements: InventoryMovementForCompletion[],
): CompletionBlocker[] {
  const blockers: CompletionBlocker[] = [];

  // Gate 1: Status must be IN_PROGRESS
  if (os.status !== 'IN_PROGRESS') {
    blockers.push({
      code: 'INVALID_SERVICE_ORDER_STATUS',
      message: `A OS deve estar em execução (IN_PROGRESS) para ser concluída. Status atual: ${os.status}.`,
    });
    // Remaining gates require IN_PROGRESS — return early
    return blockers;
  }

  // Gate 2: Latest approval version must be APPROVED
  if (!latestApproval) {
    blockers.push({
      code: 'APPROVAL_NOT_APPROVED',
      message: 'A OS não possui nenhum histórico de aprovação de orçamento.',
    });
    return blockers;
  }

  if (latestApproval.status !== 'APPROVED') {
    blockers.push({
      code: 'APPROVAL_NOT_APPROVED',
      message: `A versão mais recente do orçamento (v${latestApproval.version}) está com status "${latestApproval.status}". É necessário ter uma aprovação vigente.`,
      entityId: latestApproval.id,
    });
    return blockers;
  }

  const snapshot = latestApproval.snapshot as {
    parts?: Array<{
      id: string;
      partId: string;
      quantity: string;
      unitPrice: string;
    }>;
    services?: Array<{
      id: string;
      description: string; // maps to OSService.name
      unitPrice: string;   // maps to OSService.price
    }>;
  };

  const snapshotParts = snapshot?.parts ?? [];
  const snapshotServices = snapshot?.services ?? [];

  // Gate 3: Diagnosis (provisional via ServiceOrder.notes)
  // @note Provisional — awaiting dedicated diagnosis entity
  const diagIndex = os.notes?.indexOf(DIAGNOSIS_MARKER) ?? -1;
  const diagContent = diagIndex !== -1 ? os.notes!.slice(diagIndex + DIAGNOSIS_MARKER.length).trim() : '';
  if (diagIndex === -1 || diagContent.length === 0) {
    blockers.push({
      code: 'DIAGNOSIS_MISSING',
      message: 'É obrigatório registrar o diagnóstico técnico antes de concluir a OS.',
    });
  }

  // Gate 4: Services
  // 4a. Every service in the snapshot must be COMPLETED with matching name and price
  for (const snapSvc of snapshotServices) {
    const osSvc = os.services.find((s) => s.id === snapSvc.id);
    if (!osSvc) {
      blockers.push({
        code: 'SERVICE_MISSING',
        message: `O serviço do orçamento aprovado não foi encontrado na OS. ID: ${snapSvc.id}.`,
        entityId: snapSvc.id,
      });
      continue;
    }
    if (osSvc.executionStatus !== 'COMPLETED') {
      blockers.push({
        code: 'SERVICE_NOT_COMPLETED',
        message: `O serviço "${osSvc.name}" (${osSvc.id}) não foi concluído (status: ${osSvc.executionStatus}).`,
        entityId: osSvc.id,
      });
    }
    // Snapshot stores description (= osSvc.name) and unitPrice (= osSvc.price)
    const snapPrice = new Prisma.Decimal(snapSvc.unitPrice);
    if (snapSvc.description !== osSvc.name || !snapPrice.equals(osSvc.price)) {
      blockers.push({
        code: 'SERVICE_SNAPSHOT_MISMATCH',
        message: `Divergência entre os dados do serviço "${osSvc.name}" e o snapshot aprovado.`,
        entityId: osSvc.id,
      });
    }
  }

  // 4b. Services in OS not in snapshot
  for (const osSvc of os.services) {
    const inSnapshot = snapshotServices.some((s) => s.id === osSvc.id);
    if (!inSnapshot) {
      blockers.push({
        code: 'UNAPPROVED_SERVICE_PRESENT',
        message: `O serviço "${osSvc.name}" (${osSvc.id}) está na OS mas não consta no orçamento aprovado vigente.`,
        entityId: osSvc.id,
      });
    }
  }

  // Gate 5: Parts
  for (const snapPart of snapshotParts) {
    const osPart = os.parts.find((p) => p.id === snapPart.id);
    if (!osPart) {
      blockers.push({
        code: 'PART_MISSING',
        message: `A peça do orçamento aprovado não foi encontrada na OS. ID: ${snapPart.id}.`,
        entityId: snapPart.id,
      });
      continue;
    }

    // 5a. Full consumption required
    if (!osPart.consumedQuantity.equals(osPart.quantity)) {
      blockers.push({
        code: 'PART_NOT_FULLY_CONSUMED',
        message: `A peça ${osPart.id} tem quantidade planejada ${osPart.quantity} mas somente ${osPart.consumedQuantity} foram consumidas.`,
        entityId: osPart.id,
      });
    }

    // 5b. Snapshot divergence
    const snapQty = parseInt(snapPart.quantity, 10);
    const snapPrice = new Prisma.Decimal(snapPart.unitPrice);
    if (
      snapQty !== Number(osPart.quantity) ||
      !snapPrice.equals(osPart.unitPrice)
    ) {
      blockers.push({
        code: 'PART_SNAPSHOT_MISMATCH',
        message: `Divergência entre os dados da peça ${osPart.id} e o snapshot aprovado.`,
        entityId: osPart.id,
      });
    }
  }

  // 5c. Parts in OS absent from snapshot
  for (const osPart of os.parts) {
    const inSnapshot = snapshotParts.some((p) => p.id === osPart.id);
    if (!inSnapshot) {
      blockers.push({
        code: 'UNAPPROVED_PART_PRESENT',
        message: `A peça ${osPart.id} está na OS mas não consta no orçamento aprovado vigente.`,
        entityId: osPart.id,
      });
    }
  }

  // Gate 6: Ledger reconciliation
  // SUM(InventoryMovement.quantity WHERE osPartId=part.id AND type=OUT) = consumedQuantity
  for (const osPart of os.parts) {
    const ledgerSum = movements
      .filter((m) => m.osPartId === osPart.id && m.type === 'OUT')
      .reduce((sum, m) => sum + Number(m.quantity), 0);

    if (ledgerSum !== Number(osPart.consumedQuantity)) {
      blockers.push({
        code: 'MOVEMENT_LEDGER_MISMATCH',
        message: `Divergência no ledger da peça ${osPart.id}: consumedQuantity=${osPart.consumedQuantity}, movimentos OUT=${ledgerSum}.`,
        entityId: osPart.id,
      });
    }
  }

  return blockers;
}
