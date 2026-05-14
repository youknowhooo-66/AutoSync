// apps/api/src/modules/financial/routes/financial.routes.ts

import { Router } from 'express';
import { createFinancialEntryController, updateFinancialEntryController, deleteFinancialEntryController, listFinancialEntryController } from '../index';

const financialRoutes = Router();

financialRoutes.post('/', (request, response) => {
  return createFinancialEntryController.handle(request, response);
});

financialRoutes.put('/:id', (request, response) => {
  return updateFinancialEntryController.handle(request, response);
});

financialRoutes.delete('/:id', (request, response) => {
  return deleteFinancialEntryController.handle(request, response);
});

financialRoutes.get('/', (request, response) => {
  return listFinancialEntryController.handle(request, response);
});

export { financialRoutes };
