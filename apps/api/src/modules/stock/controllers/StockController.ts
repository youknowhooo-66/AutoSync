import { Request, Response } from 'express';
import { StockEntryUseCase } from '../useCases/StockEntryUseCase';
import { StockTransferUseCase } from '../useCases/StockTransferUseCase';
import { StockDashboardService } from '../services/StockDashboardService';

export class StockController {
  async entry(req: Request, res: Response) {
    const { companyId, id: userId } = req.user;
    const { branchId, partId, quantity, unitCost } = req.body;

    const useCase = new StockEntryUseCase();
    const result = await useCase.execute({
      companyId,
      branchId,
      partId,
      quantity,
      unitCost,
      userId
    } as any);

    return res.status(201).json({ success: true, data: result });
  }

  async createPart(req: Request, res: Response) {
    const { companyId, id: userId } = req.user;
    const { CreatePartUseCase } = await import('../useCases/CreatePartUseCase');
    const useCase = new CreatePartUseCase();
    const result = await useCase.execute({ ...req.body, companyId, userId });

    return res.status(201).json({ 
      success: true, 
      message: 'Peça cadastrada com sucesso.',
      data: result 
    });
  }

  async transfer(req: Request, res: Response) {
    const { companyId, id: userId } = req.user;
    const { partId, sourceBranchId, targetBranchId, fromBranchId, toBranchId, quantity } = req.body;

    const useCase = new StockTransferUseCase();
    const result = await useCase.execute({
      companyId,
      partId,
      sourceBranchId: sourceBranchId || fromBranchId,
      targetBranchId: targetBranchId || toBranchId,
      quantity,
      userId
    } as any);

    return res.status(200).json({ 
      success: true, 
      message: 'Transferência realizada com sucesso.',
      data: result 
    });
  }

  async dashboard(req: Request, res: Response) {
    const { companyId } = req.user;
    const { branchId } = req.query;

    const service = new StockDashboardService();
    const metrics = await service.getStockAnalytics(companyId, branchId as string);

    return res.json({ success: true, data: metrics });
  }

  async lowStock(req: Request, res: Response) {
    const { companyId } = req.user;
    const { branchId } = req.query;

    const service = new StockDashboardService();
    const items = await service.getLowStockList(companyId, branchId as string);

    return res.json(items);
  }

  async listParts(req: Request, res: Response) {
    const { companyId } = req.user;
    const { ListPartsService } = await import('../services/ListPartsService');
    const service = new ListPartsService();
    const parts = await service.execute(companyId);

    return res.json(parts);
  }

  async listSuppliers(req: Request, res: Response) {
    const { companyId } = req.user;
    const { prismaClient } = await import('../../../shared/database/prismaClient');
    
    const suppliers = await prismaClient.supplier.findMany({
      where: { companyId, deletedAt: null },
      include: { parts: { select: { id: true, name: true } } }
    });

    return res.json(suppliers);
  }

  async createSupplier(req: Request, res: Response) {
    const { companyId } = req.user;
    const { prismaClient } = await import('../../../shared/database/prismaClient');
    const { name, cnpj, phone, address, email } = req.body;

    if (!name) {
      return res.status(400).json({ message: 'Name is required' });
    }

    const supplier = await prismaClient.supplier.create({
      data: {
        companyId,
        name,
        cnpj,
        phone,
        address,
        email
      }
    });

    return res.status(201).json({ success: true, data: supplier });
  }

  async updateSupplier(req: Request, res: Response) {
    const { companyId } = req.user;
    const { id } = req.params;
    const { prismaClient } = await import('../../../shared/database/prismaClient');
    const { name, cnpj, phone, address, email } = req.body;

    const existing = await prismaClient.supplier.findFirst({
      where: { id: String(id), companyId: String(companyId), deletedAt: null }
    });

    if (!existing) {
      return res.status(404).json({ message: 'Supplier not found' });
    }

    const supplier = await prismaClient.supplier.update({
      where: { id: String(id) },
      data: {
        name,
        cnpj,
        phone,
        address,
        email
      }
    });

    return res.json({ success: true, data: supplier });
  }

  async topParts(req: Request, res: Response) {
    const { companyId } = req.user;
    const { prismaClient } = await import('../../../shared/database/prismaClient');
    
    // Aggregate top used parts from OS items
    // Since groupBy doesn't support nested where in some versions, we filter OSParts by serviceOrder's companyId
    const topParts = await prismaClient.oSPart.groupBy({
      by: ['partId'],
      where: {
        serviceOrder: {
          companyId
        }
      },
      _sum: { quantity: true },
      orderBy: {
        _sum: {
          quantity: 'desc'
        }
      },
      take: 5
    });

    const partsWithDetails = await Promise.all(topParts.map(async (tp: any) => {
      const part = await prismaClient.part.findUnique({ where: { id: tp.partId } });
      return {
        partId: tp.partId,
        name: part?.name || 'Unknown',
        internalCode: part?.internalCode || '',
        totalOut: tp._sum.quantity,
        totalRevenue: (tp._sum.quantity || 0) * (Number(part?.salePrice) || 0)
      };
    }));

    return res.json(partsWithDetails);
  }
}
