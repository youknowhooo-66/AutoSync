// apps/api/src/modules/users/services/UpdateUserService.ts

import { IUserRepository, User } from '../repositories/IUserRepository';
import { UpdateUserDTO, UserRole } from '../dtos';
import { AppError } from '../../../shared/errors/AppError';
import * as bcrypt from 'bcryptjs'; // Import bcryptjs for password hashing

export class UpdateUserService {
  constructor(private userRepository: IUserRepository) {}

  async execute({ id, companyId, name, email, password, role, isActive }: UpdateUserDTO): Promise<User> {
    if (!id || !companyId) {
      throw new AppError('User ID and Company ID are required.');
    }

    const user = await this.userRepository.findById(id, companyId);

    if (!user) {
      throw new AppError('User not found.', 404);
    }

    if (email && email !== user.email) {
      const userExists = await this.userRepository.findByEmail(email, companyId);
      if (userExists && userExists.id !== id) {
        throw new AppError('User with this email already exists for this company.', 409);
      }
    }

    const hashedPassword = password ? await bcrypt.hash(password, 10) : undefined;

    const updatedUser = await this.userRepository.update({
      id,
      companyId,
      name: name || user.name,
      email: email || user.email,
      password: hashedPassword || user.password, // Use existing password if not updated
      role: role || user.role,
      isActive: isActive !== undefined ? isActive : user.isActive,
    });

    return updatedUser;
  }
}
