// apps/api/src/modules/companies/controllers/ListCompanyController.ts

import { Request, Response } from 'express';
import { ListCompanyService } from '../services/ListCompanyService';

export class ListCompanyController {
  constructor(private listCompanyService: ListCompanyService) {}

  async handle(request: Request, response: Response): Promise<Response> {
    const companies = await this.listCompanyService.execute();

    return response.json(companies);
  }
}
