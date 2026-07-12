// apps/api/src/modules/companies/index.ts

import { PrismaCompanyRepository } from './repositories/PrismaCompanyRepository';
import { CreateCompanyService } from './services/CreateCompanyService';
import { UpdateCompanyService } from './services/UpdateCompanyService';
import { DeleteCompanyService } from './services/DeleteCompanyService';
import { ListCompanyService } from './services/ListCompanyService';
import { CreateCompanyController } from './controllers/CreateCompanyController';
import { UpdateCompanyController } from './controllers/UpdateCompanyController';
import { DeleteCompanyController } from './controllers/DeleteCompanyController';
import { ListCompanyController } from './controllers/ListCompanyController';

// Repositories
const prismaCompanyRepository = new PrismaCompanyRepository();

// Services
const createCompanyService = new CreateCompanyService(prismaCompanyRepository);
const updateCompanyService = new UpdateCompanyService(prismaCompanyRepository);
const deleteCompanyService = new DeleteCompanyService(prismaCompanyRepository);
const listCompanyService = new ListCompanyService(prismaCompanyRepository);

// Controllers
const createCompanyController = new CreateCompanyController();
const updateCompanyController = new UpdateCompanyController();
const deleteCompanyController = new DeleteCompanyController(deleteCompanyService);
const listCompanyController = new ListCompanyController(listCompanyService);

export {
  createCompanyController,
  updateCompanyController,
  deleteCompanyController,
  listCompanyController,
};
