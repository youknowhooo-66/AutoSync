// apps/api/src/modules/companies/routes/companies.routes.ts

import { Router } from 'express';
import {
  createCompanyController,
  updateCompanyController,
  deleteCompanyController,
  listCompanyController,
} from '../index';

const companiesRoutes = Router();

companiesRoutes.post('/', (req, res) => createCompanyController.handle(req, res));
companiesRoutes.get('/', (req, res) => listCompanyController.handle(req, res));
companiesRoutes.put('/:id', (req, res) => updateCompanyController.handle(req, res));
companiesRoutes.delete('/:id', (req, res) => deleteCompanyController.handle(req, res));

export { companiesRoutes };
