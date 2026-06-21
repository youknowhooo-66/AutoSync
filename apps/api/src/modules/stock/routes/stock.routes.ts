import { Router } from 'express';
import { StockController } from '../controllers/StockController';
const stockRoutes = Router();
const controller = new StockController();

stockRoutes.post('/entry', controller.entry);
stockRoutes.post('/parts', controller.createPart);
stockRoutes.post('/transfer', controller.transfer);
stockRoutes.get('/dashboard', controller.dashboard);
stockRoutes.get('/low-stock', controller.lowStock);

stockRoutes.get('/parts', controller.listParts);
stockRoutes.get('/top-parts', controller.topParts);

// Legacy/Basic routes (if still needed)
stockRoutes.get('/', (req, res) => res.json({ message: 'Stock listing' }));

export { stockRoutes };
