// apps/api/src/modules/users/controllers/UpdateUserController.ts

import { Request, Response } from 'express';
import { UpdateUserService } from '../services/UpdateUserService';
import { updateUserSchema } from '../validators/createSchema';
import { actorOf } from './CreateUserController';

export class UpdateUserController {
  constructor(private updateUserService: UpdateUserService) {}

  async handle(request: Request, response: Response): Promise<Response> {
    const input = updateUserSchema.parse(request.body);
    const user = await this.updateUserService.execute(String(request.params.id), input, request.user.companyId, actorOf(request));

    return response.json(user);
  }
}
