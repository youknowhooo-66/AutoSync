// apps/api/src/modules/companies/controllers/UpdateCompanyController.ts

import { Request, Response } from 'express';
import { AppError } from '../../../shared/errors/AppError';
import { UpdateCompanyService } from '../services/UpdateCompanyService';

export class UpdateCompanyController {
  constructor(private updateCompanyService: UpdateCompanyService) {}

  async handle(request: Request, response: Response): Promise<Response> {
    const { id } = request.params;
    const { name, document, address, phone, email, isActive } = request.body;

    try {
      const company = await this.updateCompanyService.execute({
        id,
        name,
        document,
        address,
        phone,
        email,
        isActive,
      });

      return response.status(200).json(company);
    } catch (error) {
      if (error instanceof AppError) {
        return response.status(error.statusCode).json({ message: error.message });
      }
      return response.status(500).json({ message: 'Internal server error' });
    }
  }
}
