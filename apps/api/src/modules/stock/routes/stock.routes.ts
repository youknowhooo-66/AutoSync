import { Router } from 'express';
import { StockController } from '../controllers/StockController';
import { rbacMiddleware } from '../../auth/middleware/rbacMiddleware';
import { Permission } from '../../auth/rbac/permissions';

const stockRoutes = Router();
const controller = new StockController();

stockRoutes.post('/entry', rbacMiddleware(Permission.STOCK_UPDATE), controller.entry);
stockRoutes.post('/parts', rbacMiddleware(Permission.STOCK_UPDATE), controller.createPart);
stockRoutes.post('/transfer', rbacMiddleware(Permission.STOCK_UPDATE), controller.transfer);
stockRoutes.get('/dashboard', rbacMiddleware(Permission.STOCK_VIEW), controller.dashboard);
stockRoutes.get('/low-stock', rbacMiddleware(Permission.STOCK_VIEW), controller.lowStock);

stockRoutes.get('/parts', rbacMiddleware(Permission.STOCK_VIEW), controller.searchParts);
stockRoutes.get('/top-parts', rbacMiddleware(Permission.STOCK_VIEW), controller.topParts);

// Legacy/Basic routes (if still needed)
stockRoutes.get('/', rbacMiddleware(Permission.STOCK_VIEW), (req, res) => res.json({ message: 'Stock listing' }));

export { stockRoutes };
