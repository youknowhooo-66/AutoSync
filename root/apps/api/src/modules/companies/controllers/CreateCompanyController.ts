// apps/api/src/modules/companies/controllers/CreateCompanyController.ts

import { Request, Response } from 'express';
import { AppError } from '../../../shared/errors/AppError';
import { CreateCompanyService } from '../services/CreateCompanyService';

export class CreateCompanyController {
  constructor(private createCompanyService: CreateCompanyService) {}

  async handle(request: Request, response: Response): Promise<Response> {
    const { name, document, address, phone, email, isActive } = request.body;

    try {
      const company = await this.createCompanyService.execute({
        name,
        document,
        address,
        phone,
        email,
        isActive,
      });

      return response.status(201).json(company);
    } catch (error) {
      if (error instanceof AppError) {
        return response.status(error.statusCode).json({ message: error.message });
      }
      return response.status(500).json({ message: 'Internal server error' });
    }
  }
}
