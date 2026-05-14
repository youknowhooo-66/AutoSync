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
      throw new AppError('Incorrect email/password combination.', 401);
    }

    if (!user.password || !password) {
      throw new AppError('Incorrect email/password combination.', 401);
    }

    const passwordMatched = await compare(password, user.password);

    if (!passwordMatched) {
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
        expiresIn,
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
