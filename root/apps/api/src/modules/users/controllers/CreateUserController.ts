// apps/api/src/modules/users/controllers/CreateUserController.ts

import { Request, Response } from 'express';
import { CreateUserService } from '../services/CreateUserService';

export class CreateUserController {
  constructor(private createUserService: CreateUserService) {}

  async handle(request: Request, response: Response): Promise<Response> {
    const { name, email, password, role } = request.body;
    const { companyId } = request;

    const user = await this.createUserService.execute({
      companyId,
      name,
      email,
      password,
      role,
    });

    return response.status(201).json(user);
  }
}
