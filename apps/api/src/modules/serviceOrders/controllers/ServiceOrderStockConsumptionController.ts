import { Request, Response } from 'express';
import { GetPartsConsumptionUseCase } from '../useCases/GetPartsConsumptionUseCase';
import { ConsumeStockUseCase } from '../useCases/ConsumeStockUseCase';
import { AppError } from '../../../shared/errors/AppError';

export class ServiceOrderStockConsumptionController {
  async getPartsConsumption(req: Request, res: Response) {
    const serviceOrderId = String(req.params.serviceOrderId);
    const companyId = req.user?.companyId;

    if (!companyId) {
      throw new AppError('Usuário não autenticado', 401);
    }

    const useCase = new GetPartsConsumptionUseCase();
    const result = await useCase.execute(serviceOrderId, String(companyId));

    return res.status(200).json({
      status: 'success',
      data: result
    });
  }

  async consume(req: Request, res: Response) {
    const serviceOrderId = String(req.params.serviceOrderId);
    const partId = String(req.params.partId);
    const { quantity } = req.body;
    const rawKey = req.headers['idempotency-key'] || req.headers['Idempotency-Key'] || '';
    const idempotencyKey = String(Array.isArray(rawKey) ? rawKey[0] : rawKey);
    const companyId = req.user?.companyId;
    const userId = req.user?.id;
    const userRole = req.user?.role;

    if (!companyId || !userId || !userRole) {
      throw new AppError('Usuário não autenticado', 401);
    }

    if (!idempotencyKey) {
      throw new AppError('O cabeçalho Idempotency-Key é obrigatório para esta operação', 400);
    }

    const useCase = new ConsumeStockUseCase();
    const result = await useCase.execute({
      serviceOrderId,
      osPartId: partId,
      quantity: Number(quantity),
      companyId: String(companyId),
      userId: String(userId),
      userRole: String(userRole),
      idempotencyKey
    });

    return res.status(200).json({
      status: 'success',
      data: result
    });
  }
}
