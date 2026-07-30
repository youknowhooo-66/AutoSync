// apps/api/src/modules/auth/services/AuthenticateUserService.ts

import { compare } from 'bcryptjs';
import { sign } from 'jsonwebtoken';
import { IUserRepository } from '../../users/repositories/IUserRepository';
import { AuthenticateUserDTO } from '../dtos';
import { AppError } from '../../../shared/errors/AppError';
import authConfig from '../../../shared/config/auth';

interface IResponse {
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
    companyId: string;
  };
  token: string;
}

export class AuthenticateUserService {
  constructor(private userRepository: IUserRepository) {}

  async execute({ email, password, companyId }: AuthenticateUserDTO): Promise<IResponse> {
    const user = await this.userRepository.findByEmail(email, companyId);

    if (!user) {
      console.log('Auth Failure: User not found for email:', email);
      throw new AppError('Incorrect email/password combination.', 401);
    }

    if (!user.password || !password) {
      console.log('Auth Failure: Missing password in DB or Request');
      throw new AppError('Incorrect email/password combination.', 401);
    }

    const passwordMatched = await compare(password, user.password);

    if (!passwordMatched) {
      console.log('Auth Failure: Password mismatch for user:', email);
      throw new AppError('Incorrect email/password combination.', 401);
    }

    const { secret, expiresIn } = authConfig.jwt;

    const token = sign(
      {
        role: user.role,
        companyId: user.companyId,
      },
      secret,
      {
        subject: user.id,
        expiresIn: expiresIn as any,
      },
    );

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        companyId: user.companyId,
      },
      token,
    };
  }
}
