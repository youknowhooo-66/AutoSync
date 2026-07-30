// apps/api/src/modules/users/controllers/UpdateUserController.ts

import { Request, Response } from 'express';
import { container } from '../../../container';

export class UpdateUserController {
  constructor() {}

  async handle(request: Request, response: Response): Promise<Response> {
    const { id } = request.params;
    const { name, email, password, role } = request.body;
    const { companyId } = request;

    const payload = {
      userId: String(id),
      companyId: String(companyId),
      name: String(name),
      email: String(email),
      role: role as any,
      password: password ? String(password) : undefined,
    };
    const user = await container.useCases.identity.updateUser.execute(payload);

    return response.json(user);
  }
}
