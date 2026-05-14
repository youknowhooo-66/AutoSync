import { Router } from 'express';
import { StockController } from '../controllers/StockController';
import { authMiddleware } from '../../../shared/middlewares/authMiddleware';

const stockRoutes = Router();
const controller = new StockController();

stockRoutes.use(authMiddleware);

stockRoutes.post('/entry', controller.entry);
stockRoutes.post('/transfer', controller.transfer);
stockRoutes.get('/dashboard', controller.dashboard);
stockRoutes.get('/low-stock', controller.lowStock);

stockRoutes.get('/parts', controller.listParts);

// Legacy/Basic routes (if still needed)
stockRoutes.get('/', (req, res) => res.json({ message: 'Stock listing' }));

export { stockRoutes };
