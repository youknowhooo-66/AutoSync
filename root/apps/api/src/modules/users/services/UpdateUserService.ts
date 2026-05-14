// apps/api/src/modules/users/services/UpdateUserService.ts

import { hash } from 'bcryptjs';
import { IUserRepository, User } from '../repositories/IUserRepository';
import { UpdateUserDTO } from '../dtos';
import { AppError } from '../../../shared/errors/AppError';

export class UpdateUserService {
  constructor(private userRepository: IUserRepository) {}

  async execute(data: UpdateUserDTO): Promise<User> {
    const { id, companyId, password } = data;

    const userExists = await this.userRepository.findById(id, companyId);

    if (!userExists) {
      throw new AppError('User not found.', 404);
    }

    const updatedData = { ...data };

    if (password) {
      updatedData.password = await hash(password, 8);
    }

    const user = await this.userRepository.update(updatedData);

    const userResponse = { ...user };
    delete userResponse.password;

    return userResponse;
  }
}
