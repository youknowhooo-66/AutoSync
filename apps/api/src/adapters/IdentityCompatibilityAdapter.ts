import { AuthenticateUserService } from '../modules/auth/services/AuthenticateUserService';
import { PrismaUserRepository } from '../modules/users/repositories/PrismaUserRepository';

export interface AuthenticateUserInput {
  email: string;
  password?: string;
  companyId?: string;
}

export class IdentityCompatibilityAdapter {
  constructor(private authenticateUserService: AuthenticateUserService) {}

  authenticateUser = {
    execute: async (payload: AuthenticateUserInput) => {
      return this.authenticateUserService.execute(payload);
    }
  };
}

export const createIdentityAdapter = () => {
  return new IdentityCompatibilityAdapter(new AuthenticateUserService(new PrismaUserRepository()));
};
