import { Router } from 'express';
import { listSuppliers, createSupplier, updateSupplier, deleteSupplier } from '../controllers/SupplierController';
import { authenticate } from '../middlewares/authMiddleware';

const router = Router();

router.use(authenticate);

router.get('/', listSuppliers);
router.post('/', createSupplier);
router.put('/:id', updateSupplier);
router.delete('/:id', deleteSupplier);

export default router;
