import { Router } from 'express';
import { ServiceOrderController } from '../controllers/ServiceOrderController';
import { ServiceOrderApprovalController } from '../controllers/ServiceOrderApprovalController';
import { ServiceOrderExecutionController } from '../controllers/ServiceOrderExecutionController';
import { rbacMiddleware } from '../../auth/middleware/rbacMiddleware';
import { Permission } from '../../auth/rbac/permissions';

const serviceOrderRouter = Router();
const controller = new ServiceOrderController();
const approvalController = new ServiceOrderApprovalController();
const executionController = new ServiceOrderExecutionController();

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
serviceOrderRouter.put('/:id/diagnosis', rbacMiddleware(Permission.SERVICE_ORDER_DIAGNOSE), controller.registerDiagnosis);
serviceOrderRouter.post('/:id/items', rbacMiddleware(Permission.SERVICE_ORDER_ITEM_ADD), controller.addItems);
serviceOrderRouter.delete('/:id/items/:itemId', rbacMiddleware(Permission.SERVICE_ORDER_ITEM_REMOVE), controller.removeItem);

serviceOrderRouter.get('/:id/approval', rbacMiddleware(Permission.SERVICE_ORDER_APPROVAL_VIEW), approvalController.show);
serviceOrderRouter.post('/:id/approval/request', rbacMiddleware(Permission.SERVICE_ORDER_APPROVAL_REQUEST), approvalController.request);
serviceOrderRouter.post('/:id/approval/approve', rbacMiddleware(Permission.SERVICE_ORDER_APPROVAL_APPROVE), approvalController.approve);
serviceOrderRouter.post('/:id/approval/reject', rbacMiddleware(Permission.SERVICE_ORDER_APPROVAL_REJECT), approvalController.reject);
serviceOrderRouter.post('/:id/approval/invalidate', rbacMiddleware(Permission.SERVICE_ORDER_APPROVAL_APPROVE), approvalController.invalidate);

// Technical Execution Routes
serviceOrderRouter.get('/:serviceOrderId/execution', rbacMiddleware(Permission.SERVICE_ORDER_EXECUTION_VIEW), executionController.index);
serviceOrderRouter.post('/:serviceOrderId/services/:serviceId/assign', rbacMiddleware(Permission.SERVICE_ORDER_EXECUTION_ASSIGN), executionController.assign);
serviceOrderRouter.post('/:serviceOrderId/services/:serviceId/start', rbacMiddleware(Permission.SERVICE_ORDER_EXECUTION_START), executionController.start);
serviceOrderRouter.post('/:serviceOrderId/services/:serviceId/pause', rbacMiddleware(Permission.SERVICE_ORDER_EXECUTION_PAUSE), executionController.pause);
serviceOrderRouter.post('/:serviceOrderId/services/:serviceId/resume', rbacMiddleware(Permission.SERVICE_ORDER_EXECUTION_RESUME), executionController.resume);
serviceOrderRouter.post('/:serviceOrderId/services/:serviceId/complete', rbacMiddleware(Permission.SERVICE_ORDER_EXECUTION_COMPLETE), executionController.complete);

export { serviceOrderRouter };
