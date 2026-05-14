// apps/api/src/modules/clients/controllers/DeleteClientController.ts

import { Request, Response } from 'express';
import { AppError } from '../../../shared/errors/AppError';
import { DeleteClientService } from '../services/DeleteClientService'; // Import the service

export class DeleteClientController {
  constructor(private deleteClientService: DeleteClientService) {}

  async handle(request: Request, response: Response): Promise<Response> {
    const { id } = request.params;
    const { companyId } = request.body; // Assuming companyId comes from body or context

    try {
      await this.deleteClientService.execute(id, companyId);

      return response.status(204).send(); // No content for successful deletion
    } catch (error) {
      if (error instanceof AppError) {
        return response.status(error.statusCode).json({ message: error.message });
      }
      return response.status(500).json({ message: 'Internal server error' });
    }
  }
}
