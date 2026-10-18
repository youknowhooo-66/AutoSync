// apps/api/src/modules/users/services/UpdateUserService.ts

import { Role } from '@prisma/client';
import { IUserRepository, User } from '../repositories/IUserRepository';
import { UserActor } from '../dtos';
import { UpdateUserInput } from '../validators/createSchema';
import { AppError } from '../../../shared/errors/AppError';
import { assertTenantOwnership } from '../../../shared/tenancy/assertTenantOwnership';
import { hashPassword } from '../../../shared/security/password';

export class UpdateUserService {
  constructor(private userRepository: IUserRepository) {}

  async execute(id: string, input: UpdateUserInput, companyId: string, actor: UserActor): Promise<Omit<User, 'password'>> {
    const current = await this.userRepository.findById(id, companyId);
    if (!current) {
      throw new AppError('User not found.', 404);
    }

    // The UI resends the current role on every edit, so only an actual change counts.
    const changesRole = input.role !== undefined && input.role !== current.role;
    const changesActive = input.active !== undefined && input.active !== current.active;

    if ((changesRole || changesActive) && actor.id === id) {
      throw new AppError('Você não pode alterar o próprio perfil ou status.', 403, 'SELF_PRIVILEGE_CHANGE');
    }
    if ((changesRole || changesActive) && actor.role !== Role.ADMIN) {
      throw new AppError('Apenas administradores podem alterar perfil ou status.', 403, 'ROLE_CHANGE_FORBIDDEN');
    }
    // A MANAGER must not be able to edit (e.g. reset the password of) an ADMIN.
    if (current.role === Role.ADMIN && actor.role !== Role.ADMIN) {
      throw new AppError('Apenas administradores podem editar administradores.', 403, 'ADMIN_EDIT_FORBIDDEN');
    }

    await assertTenantOwnership('branch', input.branchId, companyId);

    const user = await this.userRepository.update({
      id,
      companyId,
      name: input.name,
      email: input.email,
      password: input.password ? await hashPassword(input.password) : undefined,
      role: input.role,
      branchId: input.branchId,
      active: input.active,
    });

    const { password: _password, ...safe } = user;
    return safe;
  }
}
