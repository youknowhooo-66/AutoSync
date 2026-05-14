// apps/api/src/modules/users/controllers/UpdateUserController.ts

import { Request, Response } from 'express';
import { AppError } from '../../../shared/errors/AppError';
import { UpdateUserService } from '../services/UpdateUserService';
import { UserRole } from '../dtos';

export class UpdateUserController {
  constructor(private updateUserService: UpdateUserService) {}

  async handle(request: Request, response: Response): Promise<Response> {
    const { id } = request.params;
    const { companyId, name, email, password, role, isActive } = request.body;

    try {
      const user = await this.updateUserService.execute({
        id,
        companyId,
        name,
        email,
        password,
        role: role as UserRole, // Cast to enum
        isActive,
      });

      return response.status(200).json(user);
    } catch (error) {
      if (error instanceof AppError) {
        return response.status(error.statusCode).json({ message: error.message });
      }
      return response.status(500).json({ message: 'Internal server error' });
    }
  }
}
