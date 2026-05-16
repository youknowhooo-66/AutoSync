// apps/api/src/modules/users/services/DeleteUserService.ts

import { IUserRepository } from '../repositories/IUserRepository';
import { AppError } from '../../../shared/errors/AppError';

export class DeleteUserService {
  constructor(private userRepository: IUserRepository) {}

  async execute(id: string, companyId: string): Promise<void> {
    const userExists = await this.userRepository.findById(id, companyId);

    if (!userExists) {
      throw new AppError('User not found.', 404);
    }

    await this.userRepository.delete(id, companyId);
  }
}
