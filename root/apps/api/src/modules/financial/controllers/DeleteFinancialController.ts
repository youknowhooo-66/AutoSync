// apps/api/src/modules/financial/controllers/DeleteFinancialController.ts

import { Request, Response } from 'express';
import { DeleteFinancialService } from '../services/DeleteFinancialService';

export class DeleteFinancialController {
  constructor(private deleteFinancialService: DeleteFinancialService) {}

  async handle(request: Request, response: Response): Promise<Response> {
    const { id } = request.params;
    const { companyId } = request;

    await this.deleteFinancialService.execute(id, companyId);

    return response.status(204).send();
  }
}
