// apps/api/src/modules/serviceOrders/controllers/DeleteServiceOrderController.ts

import { Request, Response } from 'express';
import { DeleteServiceOrderService } from '../services/DeleteServiceOrderService';

export class DeleteServiceOrderController {
  constructor(private deleteServiceOrderService: DeleteServiceOrderService) {}

  async handle(request: Request, response: Response): Promise<Response> {
    const { id } = request.params;
    const { companyId } = request;

    await this.deleteServiceOrderService.execute(id, companyId);

    return response.status(204).send();
  }
}
