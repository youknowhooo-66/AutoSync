import { Request, Response } from 'express';
import { GetServiceOrderCompletionReadinessUseCase } from '../useCases/GetServiceOrderCompletionReadinessUseCase';
import { CompleteServiceOrderUseCase } from '../useCases/CompleteServiceOrderUseCase';
import { AppError } from '../../../shared/errors/AppError';
import { z } from 'zod';

const completeSchema = z.object({
  completionNotes: z.string().min(5, 'Observações de conclusão são obrigatórias (mínimo 5 caracteres).').max(2000),
});

export class ServiceOrderCompletionController {
  async readiness(req: Request, res: Response) {
    const serviceOrderId = req.params.serviceOrderId ?? req.params.id;
    const companyId = req.user?.companyId;

    if (!companyId) {
      throw new AppError('Usuário não autenticado.', 401);
    }

    const useCase = new GetServiceOrderCompletionReadinessUseCase();
    const result = await useCase.execute(String(serviceOrderId), String(companyId));

    return res.status(200).json({
      success: true,
      data: result,
    });
  }

  async complete(req: Request, res: Response) {
    const serviceOrderId = req.params.serviceOrderId ?? req.params.id;
    const { companyId, id: userId, branchId } = req.user;

    if (!companyId || !userId) {
      throw new AppError('Usuário não autenticado.', 401);
    }

    if (!branchId) {
      throw new AppError('Usuário não possui filial associada.', 400);
    }

    const { completionNotes } = completeSchema.parse(req.body);

    const useCase = new CompleteServiceOrderUseCase();
    const result = await useCase.execute({
      serviceOrderId: String(serviceOrderId),
      companyId: String(companyId),
      branchId: String(branchId),
      userId: String(userId),
      completionNotes,
    });

    return res.status(200).json({
      success: true,
      message: 'Ordem de Serviço concluída com sucesso.',
      data: result,
    });
  }
}
