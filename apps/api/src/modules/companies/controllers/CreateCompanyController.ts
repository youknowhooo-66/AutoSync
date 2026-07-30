// apps/api/src/modules/companies/controllers/CreateCompanyController.ts

import { Request, Response } from 'express';
import { container } from '../../../container';

export class CreateCompanyController {
  constructor() {}

  async handle(request: Request, response: Response): Promise<Response> {
    const { name, document, address, phone, email, isActive } = request.body;

    const payload = {
      companyId: '',
      name: name || '',
      document: document || '',
    };
    const company = await container.useCases.identity.registerCompany.execute(payload);

    return response.status(201).json(company);
  }
}
