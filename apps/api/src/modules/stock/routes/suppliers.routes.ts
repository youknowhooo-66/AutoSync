import { Router } from 'express';
import { StockController } from '../controllers/StockController';
import { rbacMiddleware } from '../../auth/middleware/rbacMiddleware';
import { Permission } from '../../auth/rbac/permissions';

const suppliersRoutes = Router();
const controller = new StockController();

suppliersRoutes.get('/', rbacMiddleware(Permission.STOCK_VIEW), controller.listSuppliers);
suppliersRoutes.post('/', rbacMiddleware(Permission.STOCK_UPDATE), controller.createSupplier);
suppliersRoutes.put('/:id', rbacMiddleware(Permission.STOCK_UPDATE), controller.updateSupplier);

export { suppliersRoutes };
