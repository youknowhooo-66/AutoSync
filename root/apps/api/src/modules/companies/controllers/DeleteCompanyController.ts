// apps/api/src/modules/companies/controllers/DeleteCompanyController.ts

import { Request, Response } from 'express';
import { AppError } from '../../../shared/errors/AppError';
import { DeleteCompanyService } from '../services/DeleteCompanyService';

export class DeleteCompanyController {
  constructor(private deleteCompanyService: DeleteCompanyService) {}

  async handle(request: Request, response: Response): Promise<Response> {
    const { id } = request.params;

    try {
      await this.deleteCompanyService.execute(id);

      return response.status(204).send();
    } catch (error) {
      if (error instanceof AppError) {
        return response.status(error.statusCode).json({ message: error.message });
      }
      return response.status(500).json({ message: 'Internal server error' });
    }
  }
}
