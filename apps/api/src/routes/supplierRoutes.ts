import { Router } from 'express';
import { listSuppliers, createSupplier, updateSupplier, deleteSupplier } from '../controllers/SupplierController';
import { authenticate } from '../middlewares/authMiddleware';

const router = Router();

router.use(authenticate);

router.get('/', (listSuppliers as any));
router.post('/', (createSupplier as any));
router.put('/:id', (updateSupplier as any));
router.delete('/:id', (deleteSupplier as any));

export default router;
