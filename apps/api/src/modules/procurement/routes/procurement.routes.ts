import { Router } from 'express';
import { rbacMiddleware } from '../../auth/middleware/rbacMiddleware';
import { Permission } from '../../auth/rbac/permissions';
import { ProcurementController } from '../controllers/ProcurementController';

const procurementRouter = Router();
const controller = new ProcurementController();

procurementRouter.post('/part-requests', rbacMiddleware(Permission.PROCUREMENT_REQUEST), (req, res, next) => controller.create(req, res).catch(next));
procurementRouter.get('/part-requests', rbacMiddleware(Permission.PROCUREMENT_READ), (req, res, next) => controller.list(req, res).catch(next));
procurementRouter.get('/part-requests/:id', rbacMiddleware(Permission.PROCUREMENT_READ), (req, res, next) => controller.getById(req, res).catch(next));
procurementRouter.get('/part-requests/:id/code-suggestion', rbacMiddleware(Permission.PROCUREMENT_PURCHASE), (req, res, next) => controller.suggestCode(req, res).catch(next));
procurementRouter.post('/part-requests/:id/start', rbacMiddleware(Permission.PROCUREMENT_START), (req, res, next) => controller.start(req, res).catch(next));
procurementRouter.post('/part-requests/:id/purchase', rbacMiddleware(Permission.PROCUREMENT_PURCHASE), (req, res, next) => controller.purchase(req, res).catch(next));
procurementRouter.post('/part-requests/:id/receive', rbacMiddleware(Permission.PROCUREMENT_RECEIVE), (req, res, next) => controller.receive(req, res).catch(next));
procurementRouter.post('/part-requests/:id/install', rbacMiddleware(Permission.PROCUREMENT_INSTALL), (req, res, next) => controller.install(req, res).catch(next));
procurementRouter.post('/part-requests/:id/cancel', rbacMiddleware(Permission.PROCUREMENT_CANCEL), (req, res, next) => controller.cancel(req, res).catch(next));

export { procurementRouter };
