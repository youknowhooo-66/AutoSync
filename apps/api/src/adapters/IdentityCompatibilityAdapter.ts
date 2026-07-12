import { AuthenticateUserService } from '../modules/auth/services/AuthenticateUserService';
import { CreateCompanyService } from '../modules/companies/services/CreateCompanyService';
import { UpdateCompanyService } from '../modules/companies/services/UpdateCompanyService';
import { CreateUserService } from '../modules/users/services/CreateUserService';
import { UpdateUserService } from '../modules/users/services/UpdateUserService';
import { PrismaUserRepository } from '../modules/users/repositories/PrismaUserRepository';
import { PrismaCompanyRepository } from '../modules/companies/repositories/PrismaCompanyRepository';
import { Role } from '@prisma/client';

export class IdentityCompatibilityAdapter {
  constructor(
    private authenticateUserService: AuthenticateUserService,
    private updateCompanyService: UpdateCompanyService,
    private registerCompanyService: CreateCompanyService,
    private updateUserService: UpdateUserService,
    private createUserService: CreateUserService
  ) {}

  authenticateUser = {
    execute: async (payload: { email: string; password?: string; companyId: string }) => {
      return this.authenticateUserService.execute(payload);
    }
  };

  updateCompany = {
    execute: async (payload: any) => {
      return this.updateCompanyService.execute({
        id: payload.companyId,
        ...payload
      });
    }
  };

  registerCompany = {
    execute: async (payload: any) => {
      return this.registerCompanyService.execute(payload);
    }
  };

  updateUser = {
    execute: async (payload: any) => {
      return this.updateUserService.execute({
        id: payload.userId,
        ...payload
      });
    }
  };

  createUser = {
    execute: async (payload: any) => {
      return this.createUserService.execute({
        role: Role.ATTENDANT,
        password: payload.password || '123456',
        ...payload
      });
    }
  };
}

export const createIdentityAdapter = () => {
  const userRepo = new PrismaUserRepository();
  const companyRepo = new PrismaCompanyRepository();
  return new IdentityCompatibilityAdapter(
    new AuthenticateUserService(userRepo),
    new UpdateCompanyService(companyRepo),
    new CreateCompanyService(companyRepo),
    new UpdateUserService(userRepo),
    new CreateUserService(userRepo)
  );
};
