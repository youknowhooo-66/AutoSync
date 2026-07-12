// apps/api/src/modules/financial/index.ts

import { PrismaFinancialRepository } from './repositories/PrismaFinancialRepository';
import { CreateFinancialService } from './services/CreateFinancialService';
import { UpdateFinancialService } from './services/UpdateFinancialService';
import { DeleteFinancialService } from './services/DeleteFinancialService';
import { ListFinancialService } from './services/ListFinancialService';
import { CreateFinancialController } from './controllers/CreateFinancialController';
import { UpdateFinancialController } from './controllers/UpdateFinancialController';
import { DeleteFinancialController } from './controllers/DeleteFinancialController';
import { ListFinancialController } from './controllers/ListFinancialController';

// Repositories
const prismaFinancialRepository = new PrismaFinancialRepository();

// Services
const createFinancialService = new CreateFinancialService(prismaFinancialRepository);
const updateFinancialService = new UpdateFinancialService(prismaFinancialRepository);
const deleteFinancialService = new DeleteFinancialService(prismaFinancialRepository);
const listFinancialService = new ListFinancialService(prismaFinancialRepository);

// Controllers
const createFinancialController = new CreateFinancialController();
const updateFinancialController = new UpdateFinancialController();
const deleteFinancialController = new DeleteFinancialController(deleteFinancialService);
const listFinancialController = new ListFinancialController(listFinancialService);

export {
  createFinancialController,
  updateFinancialController,
  deleteFinancialController,
  listFinancialController,
};
