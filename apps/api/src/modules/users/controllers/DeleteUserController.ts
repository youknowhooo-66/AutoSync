// apps/api/src/modules/users/controllers/DeleteUserController.ts

import { Request, Response } from 'express';
import { DeleteUserService } from '../services/DeleteUserService';

export class DeleteUserController {
  constructor(private deleteUserService: DeleteUserService) {}

  async handle(request: Request, response: Response): Promise<Response> {
    const { id } = request.params;
    const { companyId } = request;

    await this.deleteUserService.execute(id as string, companyId as string);

    return response.status(204).send();
  }
}
