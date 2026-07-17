import { Prisma } from '@prisma/client';
import { AppError } from '../../../shared/errors/AppError';

export async function verifyExecutionPreconditions(tx: any, serviceOrderId: string, serviceId: string, companyId: string) {
  // 1. Fetch OS
  const os = await tx.serviceOrder.findFirst({
    where: { id: serviceOrderId, companyId }
  });

  if (!os) {
    throw new AppError('Ordem de Serviço não encontrada', 404);
  }

  if (os.status === 'FINISHED') {
    throw new AppError('A Ordem de Serviço já foi concluída e não permite mais alterações.', 400);
  }

  if (os.status === 'CANCELLED') {
    throw new AppError('A Ordem de Serviço foi cancelada e não permite mais alterações.', 400);
  }

  // 2. Fetch the service item
  const svc = await tx.oSService.findFirst({
    where: { id: serviceId, serviceOrderId }
  });

  if (!svc) {
    throw new AppError('Serviço não encontrado nesta Ordem de Serviço', 404);
  }

  // 3. Fetch the latest active APPROVED budget approval
  const latestApproval = await tx.serviceOrderApproval.findFirst({
    where: { serviceOrderId, companyId },
    orderBy: { version: 'desc' }
  });

  if (!latestApproval) {
    throw new AppError('Nenhum orçamento aprovado encontrado para esta OS', 400);
  }

  if (latestApproval.status !== 'APPROVED') {
    throw new AppError(`O orçamento atual possui status ${latestApproval.status}. A execução requer status APPROVED.`, 400);
  }

  // 4. Validate that the service exists in the snapshot and matches name and price
  const snapshot = latestApproval.snapshot as any;
  if (!snapshot || !snapshot.services) {
    throw new AppError('Snapshot de orçamento corrompido ou ausente', 400);
  }

  const approvedService = snapshot.services.find((s: any) => s.id === serviceId);
  if (!approvedService) {
    throw new AppError('Este serviço não consta no orçamento aprovado', 409);
  }

  // Compare description (name) and unitPrice (price)
  const approvedPrice = new Prisma.Decimal(approvedService.unitPrice);
  const currentPrice = new Prisma.Decimal(svc.price);

  if (approvedService.description !== svc.name || !approvedPrice.equals(currentPrice)) {
    throw new AppError('O serviço atual diverge dos detalhes aprovados no orçamento', 409);
  }

  return { os, svc, latestApproval };
}
