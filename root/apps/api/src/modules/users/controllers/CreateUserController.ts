// apps/api/src/modules/users/controllers/CreateUserController.ts

import { Request, Response } from 'express';
import { AppError } from '../../../shared/errors/AppError';
import { CreateUserService } from '../services/CreateUserService';
import { UserRole } from '../dtos';

export class CreateUserController {
  constructor(private createUserService: CreateUserService) {}

  async handle(request: Request, response: Response): Promise<Response> {
    const { companyId, name, email, password, role } = request.body;

    try {
      const user = await this.createUserService.execute({
        companyId,
        name,
        email,
        password,
        role: role as UserRole, // Cast to enum
      });

      return response.status(201).json(user);
    } catch (error) {
      if (error instanceof AppError) {
        return response.status(error.statusCode).json({ message: error.message });
      }
      return response.status(500).json({ message: 'Internal server error' });
    }
  }
}
