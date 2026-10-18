// apps/api/src/modules/users/services/DeleteUserService.ts

import { Role } from '@prisma/client';
import { IUserRepository } from '../repositories/IUserRepository';
import { UserActor } from '../dtos';
import { AppError } from '../../../shared/errors/AppError';

export class DeleteUserService {
  constructor(private userRepository: IUserRepository) {}

  async execute(id: string, companyId: string, actor: UserActor): Promise<void> {
    if (id === actor.id) {
      throw new AppError('Você não pode excluir o próprio usuário.', 403, 'SELF_DELETE_FORBIDDEN');
    }

    const userExists = await this.userRepository.findById(id, companyId);
    if (!userExists) {
      throw new AppError('User not found.', 404);
    }
    if (userExists.role === Role.ADMIN && actor.role !== Role.ADMIN) {
      throw new AppError('Apenas administradores podem excluir administradores.', 403, 'ADMIN_EDIT_FORBIDDEN');
    }

    await this.userRepository.delete(id, companyId);
  }
}
