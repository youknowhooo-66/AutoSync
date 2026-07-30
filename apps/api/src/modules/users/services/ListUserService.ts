// apps/api/src/modules/users/services/ListUserService.ts

import { IUserRepository, User } from '../repositories/IUserRepository';
import { AppError } from '../../../shared/errors/AppError';

export class ListUserService {
  constructor(private userRepository: IUserRepository) {}

  async execute(companyId: string): Promise<User[]> {
    if (!companyId) {
      throw new AppError('Company ID is required.');
    }

    const users = await this.userRepository.findManyByCompany(companyId);

    return users.map(user => {
      const userResponse = { ...user };
      delete (userResponse as any).password;
      return userResponse;
    });
  }
}
