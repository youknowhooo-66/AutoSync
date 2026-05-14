// apps/api/src/modules/users/dtos/UpdateUserDTO.ts

import { UserRole } from './CreateUserDTO';

export interface UpdateUserDTO {
  id: string;
  companyId: string;
  name?: string;
  email?: string;
  password?: string;
  role?: UserRole;
}
