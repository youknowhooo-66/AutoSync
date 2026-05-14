// apps/api/src/modules/financial/index.ts

import { PrismaFinancialEntryRepository } from './repositories/PrismaFinancialEntryRepository';

import { CreateFinancialEntryService } from './services/CreateFinancialEntryService';
import { UpdateFinancialEntryService } from './services/UpdateFinancialEntryService';
import { DeleteFinancialEntryService } from './services/DeleteFinancialEntryService';
import { ListFinancialEntryService } from './services/ListFinancialEntryService';

import { CreateFinancialEntryController } from './controllers/CreateFinancialEntryController';
import { UpdateFinancialEntryController } from './controllers/UpdateFinancialEntryController';
import { DeleteFinancialEntryController } from './controllers/DeleteFinancialEntryController';
import { ListFinancialEntryController } from './controllers/ListFinancialEntryController';

// Repositories
const prismaFinancialEntryRepository = new PrismaFinancialEntryRepository();

// Services
const createFinancialEntryService = new CreateFinancialEntryService(prismaFinancialEntryRepository);
const updateFinancialEntryService = new UpdateFinancialEntryService(prismaFinancialEntryRepository);
const deleteFinancialEntryService = new DeleteFinancialEntryService(prismaFinancialEntryRepository);
const listFinancialEntryService = new ListFinancialEntryService(prismaFinancialEntryRepository);

// Controllers
const createFinancialEntryController = new CreateFinancialEntryController(createFinancialEntryService);
const updateFinancialEntryController = new UpdateFinancialEntryController(updateFinancialEntryService);
const deleteFinancialEntryController = new DeleteFinancialEntryController(deleteFinancialEntryService);
const listFinancialEntryController = new ListFinancialEntryController(listFinancialEntryService);

export {
  createFinancialEntryController,
  updateFinancialEntryController,
  deleteFinancialEntryController,
  listFinancialEntryController,
};
