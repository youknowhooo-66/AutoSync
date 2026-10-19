import { Prisma, PurchaseRequestStatus } from '@prisma/client';
import { AppError } from '../../../shared/errors/AppError';

/**
 * Locks the purchase request row for the rest of the transaction and checks that its
 * status is still the one the caller read before opening the transaction. Two
 * concurrent transitions (e.g. install and cancel) then run one after the other, and
 * the second fails with 409 instead of both writing stock and reservation changes.
 */
export async function lockPurchaseRequestStatus(
  tx: Prisma.TransactionClient,
  purchaseRequestId: string,
  expectedStatus: PurchaseRequestStatus,
): Promise<void> {
  const rows = await tx.$queryRaw<{ status: PurchaseRequestStatus }[]>`
    SELECT status FROM "PurchaseRequest" WHERE id = ${purchaseRequestId} FOR UPDATE
  `;

  if (rows.length === 0 || rows[0].status !== expectedStatus) {
    throw new AppError(
      'A solicitação foi alterada por outro usuário. Atualize a página e tente novamente.',
      409,
      'PURCHASE_REQUEST_STATUS_CHANGED',
    );
  }
}
