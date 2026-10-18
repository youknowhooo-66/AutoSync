// apps/api/src/modules/companies/controllers/CurrentCompanyController.ts

import { Request, Response } from 'express';
import { prismaClient } from '../../../shared/database/prismaClient';
import { AppError } from '../../../shared/errors/AppError';
import { updateCompanySchema } from '../validators/updateCompanySchema';

/**
 * A tenant only ever sees and edits its own company. Creating or removing
 * companies is an operator task done outside the tenant API.
 */
export class CurrentCompanyController {
  async list(request: Request, response: Response): Promise<Response> {
    const company = await prismaClient.company.findUnique({ where: { id: request.user.companyId } });
    return response.json(company ? [company] : []);
  }

  async update(request: Request, response: Response): Promise<Response> {
    // Another tenant's id answers exactly like an unknown id.
    if (request.params.id !== request.user.companyId) {
      throw new AppError('Company not found.', 404);
    }

    const data = updateCompanySchema.parse(request.body);
    const company = await prismaClient.company.update({
      where: { id: request.user.companyId },
      data: { ...data, email: data.email === '' ? null : data.email },
    });
    return response.json(company);
  }
}
