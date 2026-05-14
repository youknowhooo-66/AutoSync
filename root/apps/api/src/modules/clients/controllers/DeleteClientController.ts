// apps/api/src/modules/clients/controllers/DeleteClientController.ts

import { Request, Response } from 'express';
import { DeleteClientService } from '../services/DeleteClientService';

export class DeleteClientController {
  constructor(private deleteClientService: DeleteClientService) {}

  async handle(request: Request, response: Response): Promise<Response> {
    const { id } = request.params;
    const { companyId } = request.user;

    await this.deleteClientService.execute(id, companyId);

    return response.json({
      success: true,
      message: 'Client deleted successfully'
    });
  }
}
