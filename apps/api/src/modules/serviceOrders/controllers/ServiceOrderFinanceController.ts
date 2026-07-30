import { Request, Response } from 'express';
import { GetServiceOrderFinanceStateUseCase } from '../useCases/GetServiceOrderFinanceStateUseCase';
import { GenerateServiceOrderReceivableUseCase } from '../useCases/GenerateServiceOrderReceivableUseCase';
import { AppError } from '../../../shared/errors/AppError';
import { z } from 'zod';

const generateSchema = z.object({
  dueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato de data de vencimento inválido (esperado YYYY-MM-DD).'),
}).strict();

export class ServiceOrderFinanceController {
  async getState(req: Request, res: Response) {
    const serviceOrderId = String(req.params.serviceOrderId ?? req.params.id);
    const { companyId, branchId } = req.user;

    if (!companyId) {
      throw new AppError('Usuário não autenticado.', 401);
    }

    const useCase = new GetServiceOrderFinanceStateUseCase();
    const result = await useCase.execute({
      serviceOrderId,
      companyId,
      userBranchId: branchId,
    });

    return res.status(200).json({
      success: true,
      data: result,
    });
  }

  async generate(req: Request, res: Response) {
    const serviceOrderId = String(req.params.serviceOrderId ?? req.params.id);
    const { companyId, branchId, id: userId } = req.user;

    if (!companyId || !userId) {
      throw new AppError('Usuário não autenticado.', 401);
    }

    // Strict validation to block forged fields in request body
    const { dueDate } = generateSchema.parse(req.body);

    const useCase = new GenerateServiceOrderReceivableUseCase();
    const result = await useCase.execute({
      serviceOrderId,
      companyId,
      userBranchId: branchId,
      userId,
      dueDateStr: dueDate,
    });

    const status = result.created ? 201 : 200;
    const message = result.created
      ? 'Recebível gerado com sucesso.'
      : 'Recebível já existente (idempotente).';

    return res.status(status).json({
      success: true,
      message,
      data: {
        id: result.receivable.id,
        amount: result.receivable.amount.toString(),
        status: result.receivable.status,
        dueDate: result.receivable.dueDate ? result.receivable.dueDate.toISOString() : '',
        createdAt: result.receivable.createdAt.toISOString(),
      },
    });
  }
}
