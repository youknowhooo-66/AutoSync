// apps/api/src/modules/companies/controllers/UpdateCompanyController.ts

import { Request, Response } from 'express';
import { container } from '../../../container';

export class UpdateCompanyController {
  constructor() {}

  async handle(request: Request, response: Response): Promise<Response> {
    const { id } = request.params;
    const { name, document, address, phone, email, isActive } = request.body;

    const payload = {
      companyId: id,
      name: name,
      document: document,
    };
    const company = await container.useCases.identity.updateCompany.execute(payload);

    return response.json(company);
  }
}
