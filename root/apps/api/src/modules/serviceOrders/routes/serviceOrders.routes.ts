import { Router } from 'express';
import { ServiceOrderController } from '../controllers/ServiceOrderController';
import { authMiddleware } from '../../../shared/middlewares/authMiddleware';

const serviceOrderRouter = Router();
const controller = new ServiceOrderController();

serviceOrderRouter.use(authMiddleware);

serviceOrderRouter.post('/', controller.create);
serviceOrderRouter.patch('/:id/start', controller.start);
serviceOrderRouter.patch('/:id/complete', controller.complete);
serviceOrderRouter.patch('/:id/cancel', controller.cancel);

export { serviceOrderRouter };
