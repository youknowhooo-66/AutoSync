// apps/api/src/modules/users/dtos/UpdateUserDTO.ts

import { Role } from '@prisma/client';

/** Only the fields present are written; `undefined` means "leave as is". */
export interface UpdateUserDTO {
  id: string;
  companyId: string;
  name?: string;
  email?: string;
  password?: string;
  role?: Role;
  branchId?: string | null;
  active?: boolean;
}

/** Who is performing the change; drives the role/active rules. */
export interface UserActor {
  id: string;
  role: Role;
}
