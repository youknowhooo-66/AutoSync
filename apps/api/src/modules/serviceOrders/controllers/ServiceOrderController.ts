import { Request, Response } from 'express';
import { CreateServiceOrderUseCase } from '../useCases/CreateServiceOrderUseCase';
import { StartServiceOrderUseCase } from '../useCases/StartServiceOrderUseCase';
import { CompleteServiceOrderUseCase } from '../useCases/CompleteServiceOrderUseCase';
import { CancelServiceOrderUseCase } from '../useCases/CancelServiceOrderUseCase';
import { ListServiceOrdersUseCase } from '../useCases/ListServiceOrdersUseCase';

export class ServiceOrderController {
  async create(req: Request, res: Response) {
    const { companyId, id: userId } = req.user;
    const useCase = new CreateServiceOrderUseCase();
    const result = await useCase.execute({ ...req.body, companyId } as any);
    return res.status(201).json({ success: true, data: result });
  }

  async start(req: Request, res: Response) {
    const { id } = req.params;
    const { companyId } = req.user;
    const useCase = new StartServiceOrderUseCase();
    const result = await useCase.execute({ serviceOrderId: id, companyId } as any);
    return res.json({ success: true, data: result });
  }

  async complete(req: Request, res: Response) {
    const { id } = req.params;
    const { companyId, id: userId } = req.user;
    const useCase = new CompleteServiceOrderUseCase();
    const result = await useCase.execute({ serviceOrderId: id, companyId, userId } as any);
    return res.json({ success: true, data: result });
  }

  async index(req: Request, res: Response) {
    const { companyId } = req.user;
    const useCase = new ListServiceOrdersUseCase();
    const result = await useCase.execute(companyId);
    return res.json(result);
  }

  async cancel(req: Request, res: Response) {
    const { id } = req.params;
    const { companyId } = req.user;
    const useCase = new CancelServiceOrderUseCase();
    const result = await useCase.execute({ serviceOrderId: id, companyId } as any);
    return res.json({ success: true, data: result });
  }

  async topServices(req: Request, res: Response) {
    const { companyId } = req.user;
    const { prismaClient } = await import('../../../shared/database/prismaClient');
    
    const topServices = await prismaClient.oSService.groupBy({
      by: ['name'],
      where: {
        serviceOrder: {
          companyId
        }
      },
      _count: { name: true },
      _sum: { price: true },
      orderBy: {
        _count: {
          name: 'desc'
        }
      },
      take: 5
    });

    const servicesWithDetails = topServices.map((ts: any) => ({
      name: ts.name,
      count: ts._count.name,
      totalRevenue: Number(ts._sum.price) || 0
    }));

    return res.json(servicesWithDetails);
  }
}
