import { Request, Response } from 'express';
import { BusinessKPIService } from '../services/BusinessKPIService';

export class DashboardController {
  async getMetrics(req: Request, res: Response) {
    const { companyId } = req.user;
    const { branchId } = req.query;

    const service = new BusinessKPIService();
    const metrics = await service.getExecutiveMetrics(
      companyId, 
      branchId as string
    );

    return res.json(metrics);
  }
}
