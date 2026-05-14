import { Request, Response } from 'express';
import { CreateServiceOrderUseCase } from '../useCases/CreateServiceOrderUseCase';
import { StartServiceOrderUseCase } from '../useCases/StartServiceOrderUseCase';
import { CompleteServiceOrderUseCase } from '../useCases/CompleteServiceOrderUseCase';
import { CancelServiceOrderUseCase } from '../useCases/CancelServiceOrderUseCase';

export class ServiceOrderController {
  async create(req: Request, res: Response) {
    const { companyId, id: userId } = req.user;
    const useCase = new CreateServiceOrderUseCase();
    const result = await useCase.execute({ ...req.body, companyId });
    return res.status(201).json({ success: true, data: result });
  }

  async start(req: Request, res: Response) {
    const { id } = req.params;
    const { companyId } = req.user;
    const useCase = new StartServiceOrderUseCase();
    const result = await useCase.execute({ serviceOrderId: id, companyId });
    return res.json({ success: true, data: result });
  }

  async complete(req: Request, res: Response) {
    const { id } = req.params;
    const { companyId, id: userId } = req.user;
    const useCase = new CompleteServiceOrderUseCase();
    const result = await useCase.execute({ serviceOrderId: id, companyId, userId });
    return res.json({ success: true, data: result });
  }

  async cancel(req: Request, res: Response) {
    const { id } = req.params;
    const { companyId } = req.user;
    const useCase = new CancelServiceOrderUseCase();
    const result = await useCase.execute({ serviceOrderId: id, companyId });
    return res.json({ success: true, data: result });
  }
}
