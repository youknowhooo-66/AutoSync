// apps/api/src/modules/users/index.ts

import { PrismaUserRepository } from './repositories/PrismaUserRepository';

import { CreateUserService } from './services/CreateUserService';
import { UpdateUserService } from './services/UpdateUserService';
import { DeleteUserService } from './services/DeleteUserService';
import { ListUserService } from './services/ListUserService';

import { CreateUserController } from './controllers/CreateUserController';
import { UpdateUserController } from './controllers/UpdateUserController';
import { DeleteUserController } from './controllers/DeleteUserController';
import { ListUserController } from './controllers/ListUserController';

// Repositories
const prismaUserRepository = new PrismaUserRepository();

// Services
const createUserService = new CreateUserService(prismaUserRepository);
const updateUserService = new UpdateUserService(prismaUserRepository);
const deleteUserService = new DeleteUserService(prismaUserRepository);
const listUserService = new ListUserService(prismaUserRepository);

// Controllers
const createUserController = new CreateUserController(createUserService);
const updateUserController = new UpdateUserController(updateUserService);
const deleteUserController = new DeleteUserController(deleteUserService);
const listUserController = new ListUserController(listUserService);

export {
  createUserController,
  updateUserController,
  deleteUserController,
  listUserController,
};
