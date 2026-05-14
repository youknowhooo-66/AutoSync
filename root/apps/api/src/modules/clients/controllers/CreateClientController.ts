// apps/api/src/modules/clients/controllers/CreateClientController.ts

import { Request, Response } from 'express';
import { AppError } from '../../../shared/errors/AppError';
import { CreateClientService } from '../services/CreateClientService'; // Import the service

export class CreateClientController {
  constructor(private createClientService: CreateClientService) {}

  async handle(request: Request, response: Response): Promise<Response> {
    const { companyId, name, email, phone, document, address, city, state, zipCode } = request.body;

    try {
      const client = await this.createClientService.execute({
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

      return response.status(201).json(client);
    } catch (error) {
      if (error instanceof AppError) {
        return response.status(error.statusCode).json({ message: error.message });
      }
      return response.status(500).json({ message: 'Internal server error' });
    }
  }
}
