import { AuthenticateUserService } from '../modules/auth/services/AuthenticateUserService';
import { CreateCompanyService } from '../modules/companies/services/CreateCompanyService';
import { UpdateCompanyService } from '../modules/companies/services/UpdateCompanyService';
import { CreateUserService } from '../modules/users/services/CreateUserService';
import { UpdateUserService } from '../modules/users/services/UpdateUserService';
import { PrismaUserRepository } from '../modules/users/repositories/PrismaUserRepository';
import { PrismaCompanyRepository } from '../modules/companies/repositories/PrismaCompanyRepository';
import { Role } from '@prisma/client';

export interface AuthenticateUserInput {
  email: string;
  password?: string;
  companyId?: string;
}

export interface UpdateCompanyInput {
  companyId: string;
  name: string;
  document?: string;
  address?: string;
  phone?: string;
  email?: string;
  isActive?: boolean;
}

export interface RegisterCompanyInput {
  name: string;
  document: string;
  address?: string;
  phone?: string;
  email?: string;
}

export interface UpdateUserInput {
  userId: string;
  companyId: string;
  name: string;
  email: string;
  password?: string;
  role: Role;
  branchId?: string;
}

export interface CreateUserInput {
  companyId: string;
  name: string;
  email: string;
  password?: string;
  role?: Role;
  branchId?: string;
}

export class IdentityCompatibilityAdapter {
  constructor(
    private authenticateUserService: AuthenticateUserService,
    private updateCompanyService: UpdateCompanyService,
    private registerCompanyService: CreateCompanyService,
    private updateUserService: UpdateUserService,
    private createUserService: CreateUserService
  ) {}

  authenticateUser = {
    execute: async (payload: AuthenticateUserInput) => {
      return this.authenticateUserService.execute(payload);
    }
  };

  updateCompany = {
    execute: async (payload: UpdateCompanyInput) => {
      return this.updateCompanyService.execute({
        id: payload.companyId,
        ...payload
      });
    }
  };

  registerCompany = {
    execute: async (payload: RegisterCompanyInput) => {
      return this.registerCompanyService.execute(payload);
    }
  };

  updateUser = {
    execute: async (payload: UpdateUserInput) => {
      return this.updateUserService.execute({
        id: payload.userId,
        ...payload,
        role: payload.role as any
      });
    }
  };

  createUser = {
    execute: async (payload: CreateUserInput) => {
      return this.createUserService.execute({
        ...payload,
        role: payload.role as any || Role.ATTENDANT
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
