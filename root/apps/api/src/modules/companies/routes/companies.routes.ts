// apps/api/src/modules/companies/routes/companies.routes.ts

import { Router } from 'express';
import { createCompanyController, updateCompanyController, deleteCompanyController, listCompanyController } from '../index';

const companiesRoutes = Router();

companiesRoutes.post('/', (request, response) => {
  return createCompanyController.handle(request, response);
});

companiesRoutes.put('/:id', (request, response) => {
  return updateCompanyController.handle(request, response);
});

companiesRoutes.delete('/:id', (request, response) => {
  return deleteCompanyController.handle(request, response);
});

companiesRoutes.get('/', (request, response) => {
  return listCompanyController.handle(request, response);
});

export { companiesRoutes };
