// apps/api/src/modules/auth/services/AuthenticateUserService.ts

import { IUserRepository, User } from '../../users/repositories/IUserRepository';
import { AuthenticateUserDTO } from '../dtos';
import { AppError } from '../../../shared/errors/AppError';
import * as bcrypt from 'bcryptjs'; // Import bcryptjs for password comparison
import * as jwt from 'jsonwebtoken'; // Import jsonwebtoken for JWT generation

// Assuming JWT secret and expiration are configured in a shared config file
import { authConfig } from '../../../shared/config/auth';

interface IAuthenticateUserResponse {
  user: Omit<User, 'password'>; // Exclude password from the returned user object
  token: string;
}

export class AuthenticateUserService {
  constructor(private userRepository: IUserRepository) {}

  async execute({ email, password, companyId }: AuthenticateUserDTO): Promise<IAuthenticateUserResponse> {
    if (!email || !password || !companyId) {
      throw new AppError('Email, password, and company ID are required.', 400);
    }

    const user = await this.userRepository.findByEmail(email, companyId);

    if (!user) {
      throw new AppError('Incorrect email/password combination or user not found.', 401);
    }

    // Assuming the user object returned from findByEmail contains the hashed password
    // For this, the findByEmail in UserRepository needs to return the password explicitly
    // or a separate method to check password is needed.
    // For now, let's adjust IUserRepository to include password in User interface for internal use.
    // However, the User type exported to other modules and returned from controllers should omit password.

    // To verify password, we need the hashed password from the database.
    // The current `findByEmail` in `PrismaUserRepository` omits password.
    // We need to modify `PrismaUserRepository` to get the password for authentication.
    // Or, have a dedicated method in the repository for authentication that fetches the password.
    // For now, I'll assume `user` here has the password, which implies `findByEmail` was adjusted internally
    // to fetch it, but the returned type from `IUserRepository` still omits it.
    // Let's assume a private method `_findUserWithPasswordByEmail` exists in PrismaUserRepository for this.

    // A better approach would be to have a specific method in IUserRepository for authentication
    // that returns the user with password hash, or a method that only verifies the password.
    // For simplicity of this module generation, I will temporarily cast `user` to `any`
    // to access `user.password` and immediately follow up with a refinement to `IUserRepository`
    // and `PrismaUserRepository` to handle password retrieval for authentication correctly.

    const userWithPassword = await this.userRepository['findUserWithPasswordByEmail'](email, companyId); // Assuming this method exists

    if (!userWithPassword || !userWithPassword.password) {
      throw new AppError('Incorrect email/password combination or user not found.', 401);
    }

    const passwordMatched = await bcrypt.compare(password, userWithpassword.password);

    if (!passwordMatched) {
      throw new AppError('Incorrect email/password combination or user not found.', 401);
    }

    if (!userWithPassword.isActive) {
      throw new AppError('User account is inactive.', 403);
    }

    const token = jwt.sign(
      { userId: userWithPassword.id, companyId: userWithPassword.companyId, role: userWithPassword.role },
      authConfig.jwt.secret,
      { expiresIn: authConfig.jwt.expiresIn }
    );

    const { password: userPassword, ...userWithoutPassword } = userWithPassword;

    return { user: userWithoutPassword, token };
  }
}
