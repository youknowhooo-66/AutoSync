// apps/api/src/modules/companies/routes/companies.routes.ts

import { Router } from 'express';
import { rbacMiddleware } from '../../auth/middleware/rbacMiddleware';
import { Permission } from '../../auth/rbac/permissions';
import { CurrentCompanyController } from '../controllers/CurrentCompanyController';

const companiesRoutes = Router();
const controller = new CurrentCompanyController();

companiesRoutes.get('/', rbacMiddleware(Permission.COMPANY_SETTINGS), (req, res) => controller.list(req, res));
companiesRoutes.put('/:id', rbacMiddleware(Permission.COMPANY_SETTINGS), (req, res) => controller.update(req, res));

export { companiesRoutes };
