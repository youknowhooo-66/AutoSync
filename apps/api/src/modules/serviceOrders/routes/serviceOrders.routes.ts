import { Router } from 'express';
import { ServiceOrderController } from '../controllers/ServiceOrderController';
import { rbacMiddleware } from '../../auth/middleware/rbacMiddleware';
import { Permission } from '../../auth/rbac/permissions';

const serviceOrderRouter = Router();
const controller = new ServiceOrderController();

serviceOrderRouter.get('/', rbacMiddleware(Permission.SERVICE_ORDER_VIEW), controller.index);
serviceOrderRouter.post('/', rbacMiddleware(Permission.SERVICE_ORDER_CREATE), controller.create);
// Static routes must come before /:id to avoid being swallowed by the param
serviceOrderRouter.get('/top-services', rbacMiddleware(Permission.SERVICE_ORDER_VIEW), controller.topServices);
serviceOrderRouter.get('/:id', rbacMiddleware(Permission.SERVICE_ORDER_VIEW), controller.show);
serviceOrderRouter.get('/:id/pdf', rbacMiddleware(Permission.SERVICE_ORDER_VIEW), controller.generatePDF);
serviceOrderRouter.patch('/:id/start', rbacMiddleware(Permission.SERVICE_ORDER_START), controller.start);
serviceOrderRouter.patch('/:id/complete', rbacMiddleware(Permission.SERVICE_ORDER_COMPLETE), controller.complete);
serviceOrderRouter.patch('/:id/cancel', rbacMiddleware(Permission.SERVICE_ORDER_CANCEL), controller.cancel);
serviceOrderRouter.patch('/:id/status', rbacMiddleware(Permission.SERVICE_ORDER_CANCEL), controller.updateStatus);
serviceOrderRouter.post('/:id/items', rbacMiddleware(Permission.SERVICE_ORDER_CREATE), controller.addItems);

export { serviceOrderRouter };
