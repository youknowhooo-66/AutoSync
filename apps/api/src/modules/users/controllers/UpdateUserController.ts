// apps/api/src/modules/users/controllers/UpdateUserController.ts

import { Request, Response } from 'express';
import { UpdateUserService } from '../services/UpdateUserService';

export class UpdateUserController {
  constructor(private updateUserService: UpdateUserService) {}

  async handle(request: Request, response: Response): Promise<Response> {
    const { id } = request.params;
    const { name, email, password, role } = request.body;
    const { companyId } = request;

    const user = await this.updateUserService.execute({
      id,
      companyId,
      name,
      email,
      password,
      role,
    } as any);

    return response.json(user);
  }
}
