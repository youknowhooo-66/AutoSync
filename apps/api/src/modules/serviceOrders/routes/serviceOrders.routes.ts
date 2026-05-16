import { Router } from 'express';
import { ServiceOrderController } from '../controllers/ServiceOrderController';
import { authMiddleware } from '../../../shared/middlewares/authMiddleware';

const serviceOrderRouter = Router();
const controller = new ServiceOrderController();

serviceOrderRouter.use(authMiddleware);

serviceOrderRouter.get('/', controller.index);
serviceOrderRouter.post('/', controller.create);
serviceOrderRouter.patch('/:id/start', controller.start);
serviceOrderRouter.patch('/:id/complete', controller.complete);
serviceOrderRouter.patch('/:id/cancel', controller.cancel);
serviceOrderRouter.get('/top-services', controller.topServices);

export { serviceOrderRouter };
