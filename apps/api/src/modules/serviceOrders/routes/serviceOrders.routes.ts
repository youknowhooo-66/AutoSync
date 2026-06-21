import { Router } from 'express';
import { ServiceOrderController } from '../controllers/ServiceOrderController';
const serviceOrderRouter = Router();
const controller = new ServiceOrderController();

serviceOrderRouter.get('/', controller.index);
serviceOrderRouter.post('/', controller.create);
// Static routes must come before /:id to avoid being swallowed by the param
serviceOrderRouter.get('/top-services', controller.topServices);
serviceOrderRouter.get('/:id', controller.show);
serviceOrderRouter.get('/:id/pdf', controller.generatePDF);
serviceOrderRouter.patch('/:id/start', controller.start);
serviceOrderRouter.patch('/:id/complete', controller.complete);
serviceOrderRouter.patch('/:id/cancel', controller.cancel);
serviceOrderRouter.patch('/:id/status', controller.updateStatus);
serviceOrderRouter.post('/:id/items', controller.addItems);

export { serviceOrderRouter };
