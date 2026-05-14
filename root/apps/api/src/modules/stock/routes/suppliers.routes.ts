import { Router } from 'express';
import { StockController } from '../controllers/StockController';
import { authMiddleware } from '../../../shared/middlewares/authMiddleware';

const suppliersRoutes = Router();
const controller = new StockController();

suppliersRoutes.use(authMiddleware);

suppliersRoutes.get('/', controller.listSuppliers);

export { suppliersRoutes };
