import { Router } from 'express';
import { ServiceOrderController } from '../controllers/ServiceOrderController';
import { ServiceOrderApprovalController } from '../controllers/ServiceOrderApprovalController';
import { ServiceOrderExecutionController } from '../controllers/ServiceOrderExecutionController';
import { ServiceOrderStockConsumptionController } from '../controllers/ServiceOrderStockConsumptionController';
import { ServiceOrderCompletionController } from '../controllers/ServiceOrderCompletionController';
import { ServiceOrderFinanceController } from '../controllers/ServiceOrderFinanceController';
import { rbacMiddleware } from '../../auth/middleware/rbacMiddleware';
import { Permission } from '../../auth/rbac/permissions';

const serviceOrderRouter = Router();
const controller = new ServiceOrderController();
const approvalController = new ServiceOrderApprovalController();
const executionController = new ServiceOrderExecutionController();
const stockConsumptionController = new ServiceOrderStockConsumptionController();
const completionController = new ServiceOrderCompletionController();
const financeController = new ServiceOrderFinanceController();

serviceOrderRouter.get('/', rbacMiddleware(Permission.SERVICE_ORDER_VIEW), controller.index);
serviceOrderRouter.post('/', rbacMiddleware(Permission.SERVICE_ORDER_CREATE), controller.create);
// Static routes must come before /:id to avoid being swallowed by the param
serviceOrderRouter.get('/top-services', rbacMiddleware(Permission.SERVICE_ORDER_VIEW), controller.topServices);
serviceOrderRouter.get('/:id', rbacMiddleware(Permission.SERVICE_ORDER_VIEW), controller.show);
serviceOrderRouter.get('/:id/pdf', rbacMiddleware(Permission.SERVICE_ORDER_VIEW), controller.generatePDF);
serviceOrderRouter.patch('/:id/start', rbacMiddleware(Permission.SERVICE_ORDER_START), controller.start);
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

// Completion Routes (P4.7)
serviceOrderRouter.get('/:serviceOrderId/completion/readiness', rbacMiddleware(Permission.SERVICE_ORDER_VIEW), (req, res) => completionController.readiness(req, res));
serviceOrderRouter.post('/:serviceOrderId/complete', rbacMiddleware(Permission.SERVICE_ORDER_COMPLETE), (req, res) => completionController.complete(req, res));
serviceOrderRouter.patch('/:serviceOrderId/complete', rbacMiddleware(Permission.SERVICE_ORDER_COMPLETE), (req, res) => completionController.complete(req, res)); // Deprecated alias

// Finance Integration Routes (P4.8)
serviceOrderRouter.get('/:serviceOrderId/finance', rbacMiddleware(Permission.SERVICE_ORDER_FINANCE_VIEW), (req, res) => financeController.getState(req, res));
serviceOrderRouter.post('/:serviceOrderId/finance/receivable', rbacMiddleware(Permission.SERVICE_ORDER_FINANCE_GENERATE), (req, res) => financeController.generate(req, res));

// Technical Execution Routes
serviceOrderRouter.get('/:serviceOrderId/execution', rbacMiddleware(Permission.SERVICE_ORDER_EXECUTION_VIEW), executionController.index);
serviceOrderRouter.post('/:serviceOrderId/services/:serviceId/assign', rbacMiddleware(Permission.SERVICE_ORDER_EXECUTION_ASSIGN), executionController.assign);
serviceOrderRouter.post('/:serviceOrderId/services/:serviceId/start', rbacMiddleware(Permission.SERVICE_ORDER_EXECUTION_START), executionController.start);
serviceOrderRouter.post('/:serviceOrderId/services/:serviceId/pause', rbacMiddleware(Permission.SERVICE_ORDER_EXECUTION_PAUSE), executionController.pause);
serviceOrderRouter.post('/:serviceOrderId/services/:serviceId/resume', rbacMiddleware(Permission.SERVICE_ORDER_EXECUTION_RESUME), executionController.resume);
serviceOrderRouter.post('/:serviceOrderId/services/:serviceId/complete', rbacMiddleware(Permission.SERVICE_ORDER_EXECUTION_COMPLETE), executionController.complete);

// Stock Consumption Routes
serviceOrderRouter.get('/:serviceOrderId/parts/consumption', rbacMiddleware(Permission.SERVICE_ORDER_STOCK_VIEW), (req, res) => stockConsumptionController.getPartsConsumption(req, res));
serviceOrderRouter.post('/:serviceOrderId/parts/:partId/consume', rbacMiddleware(Permission.SERVICE_ORDER_STOCK_CONSUME), (req, res) => stockConsumptionController.consume(req, res));

export { serviceOrderRouter };
