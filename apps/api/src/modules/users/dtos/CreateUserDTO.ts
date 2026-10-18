// apps/api/src/modules/users/dtos/CreateUserDTO.ts

import { Role } from '@prisma/client';

export interface CreateUserDTO {
  companyId: string;
  name: string;
  email: string;
  password: string;
  role: Role;
  branchId: string | null;
}
