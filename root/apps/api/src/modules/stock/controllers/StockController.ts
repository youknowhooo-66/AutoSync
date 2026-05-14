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
    });

    return res.status(201).json({ success: true, data: result });
  }

  async transfer(req: Request, res: Response) {
    const { companyId, id: userId } = req.user;
    const { partId, sourceBranchId, targetBranchId, quantity } = req.body;

    const useCase = new StockTransferUseCase();
    const result = await useCase.execute({
      companyId,
      partId,
      sourceBranchId,
      targetBranchId,
      quantity,
      userId
    });

    return res.status(201).json({ success: true, data: result });
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
      select: { id: true, name: true }
    });

    return res.json(suppliers);
  }
}
