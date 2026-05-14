// apps/api/src/modules/companies/controllers/CreateCompanyController.ts

import { Request, Response } from 'express';
import { CreateCompanyService } from '../services/CreateCompanyService';

export class CreateCompanyController {
  constructor(private createCompanyService: CreateCompanyService) {}

  async handle(request: Request, response: Response): Promise<Response> {
    const { name, document, address, phone, email, isActive } = request.body;

    const company = await this.createCompanyService.execute({
      name,
      document,
      address,
      phone,
      email,
      isActive,
    });

    return response.status(201).json(company);
  }
}
