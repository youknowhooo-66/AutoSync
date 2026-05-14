// apps/api/src/modules/clients/controllers/UpdateClientController.ts

import { Request, Response } from 'express';
import { AppError } from '../../../shared/errors/AppError';
import { UpdateClientService } from '../services/UpdateClientService'; // Import the service

export class UpdateClientController {
  constructor(private updateClientService: UpdateClientService) {}

  async handle(request: Request, response: Response): Promise<Response> {
    const { id } = request.params;
    const { companyId, name, email, phone, document, address, city, state, zipCode } = request.body;

    try {
      const client = await this.updateClientService.execute({
        id,
        companyId,
        name,
        email,
        phone,
        document,
        address,
        city,
        state,
        zipCode,
      });

      return response.status(200).json(client);
    } catch (error) {
      if (error instanceof AppError) {
        return response.status(error.statusCode).json({ message: error.message });
      }
      return response.status(500).json({ message: 'Internal server error' });
    }
  }
}
