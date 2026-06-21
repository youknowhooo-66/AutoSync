// apps/api/src/modules/auth/controllers/AuthenticateUserController.ts

import { Request, Response } from 'express';
import { AuthenticateUserService } from '../services/AuthenticateUserService';
import { authenticateUserSchema } from '../validators/authSchema';

export class AuthenticateUserController {
  constructor(private authenticateUserService: AuthenticateUserService) {}

  async handle(request: Request, response: Response): Promise<Response> {
    const data = authenticateUserSchema.parse(request.body);

    const authResponse = await this.authenticateUserService.execute(data);
    return response.json(authResponse);
  }
}
