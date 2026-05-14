// apps/api/src/modules/clients/controllers/UpdateClientController.ts

import { Request, Response } from 'express';
import { UpdateClientService } from '../services/UpdateClientService';
import { updateClientSchema } from '../validators/updateSchema';

export class UpdateClientController {
  constructor(private updateClientService: UpdateClientService) {}

  async handle(request: Request, response: Response): Promise<Response> {
    const data = updateClientSchema.parse({
      ...request.body,
      id: request.params.id
    });
    
    const { companyId } = request.user;

    const client = await this.updateClientService.execute({
      ...data,
      companyId,
    });

    return response.json({
      success: true,
      data: client,
      message: 'Client updated successfully'
    });
  }
}
