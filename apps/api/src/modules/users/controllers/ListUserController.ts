// apps/api/src/modules/users/controllers/ListUserController.ts

import { Request, Response } from 'express';
import { ListUserService } from '../services/ListUserService';

export class ListUserController {
  constructor(private listUserService: ListUserService) {}

  async handle(request: Request, response: Response): Promise<Response> {
    const { companyId } = request;

    const users = await this.listUserService.execute(companyId);

    return response.json(users);
  }
}
