// apps/api/src/modules/auth/index.ts

import { PrismaUserRepository } from '../users/repositories/PrismaUserRepository';
import { AuthenticateUserService } from './services/AuthenticateUserService';
import { AuthenticateUserController } from './controllers/AuthenticateUserController';

// Repositories
const prismaUserRepository = new PrismaUserRepository();

// Services
const authenticateUserService = new AuthenticateUserService(prismaUserRepository);

// Controllers
const authenticateUserController = new AuthenticateUserController(authenticateUserService);

export {
  authenticateUserController,
};
