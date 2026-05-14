import { Router } from 'express';
import { listVehicles, createVehicle, updateVehicle } from '../controllers/VehicleController';
import { authenticate } from '../middlewares/authMiddleware';

const router = Router();

router.use(authenticate);

router.get('/', listVehicles);
router.post('/', createVehicle);
router.put('/:id', updateVehicle);

export default router;
