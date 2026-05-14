// apps/api/src/modules/companies/controllers/ListCompanyController.ts

import { Request, Response } from 'express';
import { AppError } from '../../../shared/errors/AppError';
import { ListCompanyService } from '../services/ListCompanyService';

export class ListCompanyController {
  constructor(private listCompanyService: ListCompanyService) {}

  async handle(request: Request, response: Response): Promise<Response> {
    try {
      const companies = await this.listCompanyService.execute();

      return response.status(200).json(companies);
    } catch (error) {
      if (error instanceof AppError) {
        return response.status(error.statusCode).json({ message: error.message });
      }
      return response.status(500).json({ message: 'Internal server error' });
    }
  }
}
