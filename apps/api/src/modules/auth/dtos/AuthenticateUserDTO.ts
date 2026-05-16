// apps/api/src/modules/auth/dtos/AuthenticateUserDTO.ts

export interface AuthenticateUserDTO {
  email: string;
  password?: string;
  companyId?: string;
}
