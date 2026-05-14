// apps/api/src/modules/companies/controllers/DeleteCompanyController.ts

import { Request, Response } from 'express';
import { DeleteCompanyService } from '../services/DeleteCompanyService';

export class DeleteCompanyController {
  constructor(private deleteCompanyService: DeleteCompanyService) {}

  async handle(request: Request, response: Response): Promise<Response> {
    const { id } = request.params;

    await this.deleteCompanyService.execute(id);

    return response.status(204).send();
  }
}
