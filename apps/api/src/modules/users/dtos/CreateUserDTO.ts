// apps/api/src/modules/users/dtos/CreateUserDTO.ts

export enum UserRole {
  ADMIN = 'ADMIN',
  USER = 'USER',
  VIEWER = 'VIEWER',
}

export interface CreateUserDTO {
  companyId: string;
  name: string;
  email: string;
  password?: string;
  role: UserRole;
}
