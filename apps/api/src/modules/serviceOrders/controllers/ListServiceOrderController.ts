// apps/api/src/modules/serviceOrders/controllers/ListServiceOrderController.ts

import { Request, Response } from 'express';
import { ListServiceOrderService } from '../services/ListServiceOrderService';

export class ListServiceOrderController {
  constructor(private listServiceOrderService: ListServiceOrderService) {}

  async handle(request: Request, response: Response): Promise<Response> {
    const { companyId } = request;

    const serviceOrders = await this.listServiceOrderService.execute(companyId);

    return response.json(serviceOrders);
  }
}
