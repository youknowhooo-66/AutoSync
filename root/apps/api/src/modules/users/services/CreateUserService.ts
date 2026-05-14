// apps/api/src/modules/users/services/CreateUserService.ts

import { IUserRepository, User } from '../repositories/IUserRepository';
import { CreateUserDTO, UserRole } from '../dtos';
import { AppError } from '../../../shared/errors/AppError';
import * as bcrypt from 'bcryptjs'; // Import bcryptjs for password hashing

export class CreateUserService {
  constructor(private userRepository: IUserRepository) {}

  async execute({ companyId, name, email, password, role }: CreateUserDTO): Promise<User> {
    if (!companyId) {
      throw new AppError('Company ID is required.');
    }
    if (!name) {
      throw new AppError('Name is required.');
    }
    if (!email) {
      throw new AppError('Email is required.');
    }
    if (!password) {
      throw new AppError('Password is required.');
    }
    if (!role) {
      throw new AppError('Role is required.');
    }

    const userExists = await this.userRepository.findByEmail(email, companyId);

    if (userExists) {
      throw new AppError('User with this email already exists for this company.', 409);
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await this.userRepository.create({
      companyId,
      name,
      email,
      password: hashedPassword,
      role,
    });

    return user;
  }
}
