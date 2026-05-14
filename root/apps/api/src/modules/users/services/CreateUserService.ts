// apps/api/src/modules/users/services/CreateUserService.ts

import { hash } from 'bcryptjs';
import { IUserRepository, User } from '../repositories/IUserRepository';
import { CreateUserDTO } from '../dtos';
import { AppError } from '../../../shared/errors/AppError';

export class CreateUserService {
  constructor(private userRepository: IUserRepository) {}

  async execute(data: CreateUserDTO): Promise<User> {
    const { companyId, email, password } = data;

    if (!companyId) {
      throw new AppError('Company ID is required.');
    }

    const userExists = await this.userRepository.findByEmail(email, companyId);

    if (userExists) {
      throw new AppError('User with this email already exists for this company.', 409);
    }

    if (!password) {
      throw new AppError('Password is required for user creation.');
    }

    const hashedPassword = await hash(password, 8);

    const user = await this.userRepository.create({
      ...data,
      password: hashedPassword,
    });

    // Remove password from response
    const userResponse = { ...user };
    delete userResponse.password;

    return userResponse;
  }
}
