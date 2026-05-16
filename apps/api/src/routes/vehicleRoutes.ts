import { Router } from 'express';
import { listVehicles, createVehicle, updateVehicle } from '../controllers/VehicleController';
import { authenticate } from '../middlewares/authMiddleware';

const router = Router();

router.use(authenticate);

router.get('/', (listVehicles as any));
router.post('/', (createVehicle as any));
router.put('/:id', (updateVehicle as any));

export default router;
