// apps/api/src/modules/clients/controllers/CreateClientController.ts

import { Request, Response } from 'express';
import { CreateClientService } from '../services/CreateClientService';
import { createClientSchema } from '../validators/createSchema';

export class CreateClientController {
  constructor(private createClientService: CreateClientService) {}

  async handle(request: Request, response: Response): Promise<Response> {
    const data = createClientSchema.parse(request.body);
    const { companyId } = request.user;

    const client = await this.createClientService.execute({
      ...data,
      document: data.document || '',
      companyId, email: data.email || "", phone: data.phone || "", address: data.address || "", city: data.city || "", state: data.state || "", zipCode: data.zipCode || "",
    });

    return response.status(201).json({
      success: true,
      data: client,
      message: 'Cliente cadastrado com sucesso.'
    });
  }
}
