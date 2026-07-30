// apps/api/src/modules/auth/controllers/AuthenticateUserController.ts

import { Request, Response } from 'express';
import { authenticateUserSchema } from '../validators/authSchema';
import { container } from '../../../container';

export class AuthenticateUserController {
  async handle(request: Request, response: Response): Promise<Response> {
    const data = authenticateUserSchema.parse(request.body);

    const mappedData = {
      email: data.email,
      password: data.password,
      ...(data.companyId ? { companyId: data.companyId } : {}),
    };

    const authResponse = await container.useCases.identity.authenticateUser.execute(mappedData);
    return response.json(authResponse);
  }
}
