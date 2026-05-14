// apps/api/src/modules/users/repositories/IUserRepository.ts

import { CreateUserDTO, UpdateUserDTO, UserRole } from '../dtos';

export interface User {
  id: string;
  companyId: string;
  name: string;
  email: string;
  // password?: string; // Should not be returned from repository unless explicit need
  role: UserRole;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// User interface that explicitly includes the password for internal use (e.g., authentication)
export interface UserWithPassword extends User {
  password?: string; // This will be present when fetched for auth
}

export interface IUserRepository {
  create(data: CreateUserDTO): Promise<User>;
  findById(id: string, companyId: string): Promise<User | null>;
  findByEmail(email: string, companyId: string): Promise<User | null>;
  findByEmailWithPassword(email: string, companyId: string): Promise<UserWithPassword | null>;
  findManyByCompany(companyId: string): Promise<User[]>;
  update(data: UpdateUserDTO): Promise<User>;
  delete(id: string, companyId: string): Promise<void>;
}
