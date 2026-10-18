// apps/api/src/modules/users/controllers/CreateUserController.ts

import { Request, Response } from 'express';
import { Role } from '@prisma/client';
import { CreateUserService } from '../services/CreateUserService';
import { createUserSchema } from '../validators/createSchema';

export class CreateUserController {
  constructor(private createUserService: CreateUserService) {}

  async handle(request: Request, response: Response): Promise<Response> {
    const input = createUserSchema.parse(request.body);
    const user = await this.createUserService.execute(input, request.user.companyId, actorOf(request));

    return response.status(201).json(user);
  }
}

export function actorOf(request: Request) {
  return { id: request.user.id, role: request.user.role as Role };
}
