import { Request, Response } from 'express';
import { CreateServiceOrderUseCase } from '../useCases/CreateServiceOrderUseCase';
import { StartServiceOrderUseCase } from '../useCases/StartServiceOrderUseCase';
import { CompleteServiceOrderUseCase } from '../useCases/CompleteServiceOrderUseCase';
import { CancelServiceOrderUseCase } from '../useCases/CancelServiceOrderUseCase';
import { ListServiceOrdersUseCase } from '../useCases/ListServiceOrdersUseCase';
import { ShowServiceOrderUseCase } from '../useCases/ShowServiceOrderUseCase';
import { UpdateServiceOrderStatusUseCase } from '../useCases/UpdateServiceOrderStatusUseCase';
import { AddItemsToServiceOrderUseCase } from '../useCases/AddItemsToServiceOrderUseCase';
import { createServiceOrderSchema } from '../validators/createSchema';
import { RegisterDiagnosisUseCase } from '../useCases/RegisterDiagnosisUseCase';
import { registerDiagnosisSchema } from '../validators/registerDiagnosisSchema';
import { addItemsSchema } from '../validators/addItemsSchema';
import { RemoveItemFromServiceOrderUseCase } from '../useCases/RemoveItemFromServiceOrderUseCase';

export class ServiceOrderController {
  async create(req: Request, res: Response) {
    const { companyId, id: userId } = req.user;
    const data = createServiceOrderSchema.parse(req.body);

    const useCase = new CreateServiceOrderUseCase();
    const result = await useCase.execute({
      clientId: data.clientId,
      vehicleId: data.vehicleId,
      branchId: data.branchId,
      mechanicId: data.mechanicId,
      notes: data.notes,
      parts: data.parts || [],
      services: data.services || [],
      companyId,
      userId,
    });
    return res.status(201).json({ 
      success: true, 
      message: 'Ordem de Serviço aberta com sucesso.',
      data: result 
    });
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

  async show(req: Request, res: Response) {
    const { id } = req.params;
    const { companyId } = req.user;
    const useCase = new ShowServiceOrderUseCase();
    const result = await useCase.execute(id as string, companyId as string);
    return res.json(result);
  }

  async cancel(req: Request, res: Response) {
    const { id } = req.params;
    const { companyId } = req.user;
    const useCase = new CancelServiceOrderUseCase();
    const result = await useCase.execute({ serviceOrderId: id, companyId } as any);
    return res.json({ success: true, data: result });
  }

  async updateStatus(req: Request, res: Response) {
    const { id } = req.params;
    const { status } = req.body;
    const { companyId } = req.user;
    if (!status) {
      return res.status(400).json({ message: 'Status is required.' });
    }
    const useCase = new UpdateServiceOrderStatusUseCase();
    const result = await useCase.execute(id as string, companyId as string, status);
    return res.json({ success: true, data: result });
  }

  async addItems(req: Request, res: Response) {
    const { id } = req.params;
    const { companyId, id: userId } = req.user;
    
    // Validate with Zod
    const parsedBody = addItemsSchema.parse(req.body);

    const useCase = new AddItemsToServiceOrderUseCase();
    const result = await useCase.execute({
      serviceOrderId: id as string,
      companyId: companyId as string,
      userId: userId as string,
      parts: parsedBody.parts,
      services: parsedBody.services,
    });
    return res.json({ success: true, data: result });
  }

  async removeItem(req: Request, res: Response) {
    const { id, itemId } = req.params;
    const { companyId } = req.user;
    const { type } = req.query; // 'PART' or 'SERVICE'

    if (type !== 'PART' && type !== 'SERVICE') {
      return res.status(400).json({ message: "Query parameter 'type' must be PART or SERVICE." });
    }

    const useCase = new RemoveItemFromServiceOrderUseCase();
    const result = await useCase.execute(id as string, companyId as string, itemId as string, type as 'PART' | 'SERVICE');
    
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

  async registerDiagnosis(req: Request, res: Response) {
    const { id } = req.params;
    const { companyId } = req.user;
    const data = registerDiagnosisSchema.parse(req.body);

    const useCase = new RegisterDiagnosisUseCase();
    const result = await useCase.execute({
      serviceOrderId: id as string,
      companyId,
      description: data.description,
    });

    return res.json({
      success: true,
      data: result,
    });
  }

  async generatePDF(req: Request, res: Response) {
    const { generateOSPDF } = await import('../../../controllers/PDFController');
    return generateOSPDF(req as any, res);
  }
}
