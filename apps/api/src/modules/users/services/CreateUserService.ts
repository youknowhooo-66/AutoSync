// apps/api/src/modules/users/services/CreateUserService.ts

import { Role } from '@prisma/client';
import { IUserRepository, User } from '../repositories/IUserRepository';
import { UserActor } from '../dtos';
import { CreateUserInput } from '../validators/createSchema';
import { AppError } from '../../../shared/errors/AppError';
import { assertTenantOwnership } from '../../../shared/tenancy/assertTenantOwnership';
import { hashPassword } from '../../../shared/security/password';

export class CreateUserService {
  constructor(private userRepository: IUserRepository) {}

  async execute(input: CreateUserInput, companyId: string, actor: UserActor): Promise<Omit<User, 'password'>> {
    // Only ADMIN picks a role; anyone else with USER_MANAGE creates the default role.
    if (input.role && input.role !== Role.ATTENDANT && actor.role !== Role.ADMIN) {
      throw new AppError('Apenas administradores podem definir o perfil do usuário.', 403, 'ROLE_CHANGE_FORBIDDEN');
    }

    await assertTenantOwnership('branch', input.branchId, companyId);

    if (await this.userRepository.findByEmail(input.email, companyId)) {
      throw new AppError('User with this email already exists for this company.', 409);
    }

    const user = await this.userRepository.create({
      companyId,
      name: input.name,
      email: input.email,
      password: await hashPassword(input.password),
      role: input.role ?? Role.ATTENDANT,
      branchId: input.branchId ?? null,
    });

    const { password: _password, ...safe } = user;
    return safe;
  }
}
