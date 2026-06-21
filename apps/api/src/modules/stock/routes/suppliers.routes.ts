import { Router } from 'express';
import { StockController } from '../controllers/StockController';
const suppliersRoutes = Router();
const controller = new StockController();

suppliersRoutes.get('/', controller.listSuppliers);
suppliersRoutes.post('/', controller.createSupplier);
suppliersRoutes.put('/:id', controller.updateSupplier);

export { suppliersRoutes };
