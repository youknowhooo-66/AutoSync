// apps/api/src/modules/clients/controllers/UpdateClientController.ts

import { Request, Response } from 'express';
import { updateClientSchema } from '../validators/updateSchema';
import { container } from '../../../container';

export class UpdateClientController {
  constructor() {}

  async handle(request: Request, response: Response): Promise<Response> {
    const data = updateClientSchema.parse({
      ...request.body,
      id: request.params.id
    });
    
    const { companyId } = request.user;

    const client = await container.useCases.fleet.updateClient.execute({
      ...data,
      name: data.name || '',
      email: data.email || '',
      document: data.document || '',
      clientId: String(request.params.id),
      companyId: String(companyId),
    });

    return response.json({
      success: true,
      data: client,
      message: 'Client updated successfully'
    });
  }
}
