import { prismaClient } from '../database/prismaClient';
import { AppError } from '../errors/AppError';

type TenantOwnedModel = 'branch' | 'client' | 'vehicle' | 'part' | 'supplier';

const LABELS: Record<TenantOwnedModel, string> = {
  branch: 'Filial',
  client: 'Cliente',
  vehicle: 'Veículo',
  part: 'Peça',
  supplier: 'Fornecedor',
};

async function exists(model: TenantOwnedModel, id: string, companyId: string): Promise<boolean> {
  const where = { id, companyId };
  const select = { id: true } as const;
  switch (model) {
    case 'branch':
      return !!(await prismaClient.branch.findFirst({ where, select }));
    case 'client':
      return !!(await prismaClient.client.findFirst({ where, select }));
    case 'vehicle':
      return !!(await prismaClient.vehicle.findFirst({ where, select }));
    case 'part':
      return !!(await prismaClient.part.findFirst({ where, select }));
    case 'supplier':
      return !!(await prismaClient.supplier.findFirst({ where, select }));
  }
}

/**
 * Ids that arrive in the body (partId, branchId, clientId, ...) must belong to the
 * caller's company. Answering 404 instead of 403 keeps other tenants' ids opaque.
 *
 * Stopgap until composite (id, companyId) foreign keys enforce this in the database.
 */
export async function assertTenantOwnership(
  model: TenantOwnedModel,
  id: string | null | undefined,
  companyId: string,
): Promise<void> {
  if (!id) return;
  if (!(await exists(model, id, companyId))) {
    throw new AppError(`${LABELS[model]} não encontrado(a).`, 404, `${model.toUpperCase()}_NOT_FOUND`);
  }
}
