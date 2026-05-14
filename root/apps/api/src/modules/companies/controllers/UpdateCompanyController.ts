// apps/api/src/modules/companies/controllers/UpdateCompanyController.ts

import { Request, Response } from 'express';
import { UpdateCompanyService } from '../services/UpdateCompanyService';

export class UpdateCompanyController {
  constructor(private updateCompanyService: UpdateCompanyService) {}

  async handle(request: Request, response: Response): Promise<Response> {
    const { id } = request.params;
    const { name, document, address, phone, email, isActive } = request.body;

    const company = await this.updateCompanyService.execute({
      id,
      name,
      document,
      address,
      phone,
      email,
      isActive,
    });

    return response.json(company);
  }
}
