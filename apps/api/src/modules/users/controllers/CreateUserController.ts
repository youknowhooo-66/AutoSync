// apps/api/src/modules/users/controllers/CreateUserController.ts

import { Request, Response } from 'express';
import { container } from '../../../container';

export class CreateUserController {
  constructor() {}

  async handle(request: Request, response: Response): Promise<Response> {
    const { name, email, password, role } = request.body;
    const { companyId } = request;

    const payload = {
      companyId,
      name,
      email,
    };
    const user = await container.useCases.identity.createUser.execute(payload);

    return response.status(201).json(user);
  }
}
