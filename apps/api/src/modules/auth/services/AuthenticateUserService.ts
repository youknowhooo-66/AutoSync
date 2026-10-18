// apps/api/src/modules/auth/services/AuthenticateUserService.ts

import { sign } from 'jsonwebtoken';
import { IUserRepository } from '../../users/repositories/IUserRepository';
import { AuthenticateUserDTO } from '../dtos';
import { AppError } from '../../../shared/errors/AppError';
import authConfig from '../../../shared/config/auth';
import { hashPassword, needsRehash, verifyPassword } from '../../../shared/security/password';
import { prismaClient } from '../../../shared/database/prismaClient';
import { logger } from '../../../shared/logger';

interface IResponse {
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
    companyId: string;
    branchId: string | null;
  };
  token: string;
}

// One message for every failure, so the response never tells an attacker which part was wrong.
const INVALID_CREDENTIALS = 'Incorrect email/password combination.';

export class AuthenticateUserService {
  constructor(private userRepository: IUserRepository) {}

  async execute({ email, password, companyId }: AuthenticateUserDTO): Promise<IResponse> {
    const user = await this.userRepository.findByEmail(email, companyId);

    // verifyPassword always hashes, so an unknown email costs the same time as a wrong password.
    const passwordMatched = await verifyPassword(password ?? '', user?.password);

    if (!user || !passwordMatched || !password) {
      throw new AppError(INVALID_CREDENTIALS, 401);
    }
    if (!user.active) {
      logger.warn({ userId: user.id }, '[Auth] Login attempt on inactive user');
      throw new AppError(INVALID_CREDENTIALS, 401);
    }

    if (needsRehash(user.password)) {
      // Best effort: a failed upgrade must not block a valid login.
      await prismaClient.user
        .update({ where: { id: user.id }, data: { password: await hashPassword(password) } })
        .catch((err: Error) => logger.error({ userId: user.id, err: err.message }, '[Auth] Password rehash failed'));
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
        expiresIn: expiresIn as never,
      },
    );

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        companyId: user.companyId,
        branchId: user.branchId,
      },
      token,
    };
  }
}
