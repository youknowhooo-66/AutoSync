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
  password?: string; // Optional for creation if it's set later or auto-generated
  role: UserRole;
}
