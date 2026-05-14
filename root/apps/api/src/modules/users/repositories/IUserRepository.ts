// apps/api/src/modules/users/repositories/IUserRepository.ts

import { CreateUserDTO, UpdateUserDTO, UserRole } from '../dtos';

export interface User {
  id: string;
  companyId: string;
  name: string;
  email: string;
  password?: string;
  role: UserRole;
  createdAt: Date;
  updatedAt: Date;
}

export interface IUserRepository {
  create(data: CreateUserDTO): Promise<User>;
  findById(id: string, companyId: string): Promise<User | null>;
  findByEmail(email: string, companyId: string): Promise<User | null>;
  findManyByCompany(companyId: string): Promise<User[]>;
  update(data: UpdateUserDTO): Promise<User>;
  delete(id: string, companyId: string): Promise<void>;
}
