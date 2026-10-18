// apps/api/src/modules/users/controllers/DeleteUserController.ts

import { Request, Response } from 'express';
import { DeleteUserService } from '../services/DeleteUserService';
import { actorOf } from './CreateUserController';

export class DeleteUserController {
  constructor(private deleteUserService: DeleteUserService) {}

  async handle(request: Request, response: Response): Promise<Response> {
    await this.deleteUserService.execute(String(request.params.id), request.user.companyId, actorOf(request));

    return response.status(204).send();
  }
}
