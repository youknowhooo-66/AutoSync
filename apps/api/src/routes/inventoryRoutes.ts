import { Router } from 'express';
import { listParts, createPart, updatePart, deletePart, updateStock, importParts, getLowStock, getMovements, getTopParts, transferStock } from '../controllers/InventoryController';
import { upload } from '../middlewares/uploadMiddleware';
import { authenticate } from '../middlewares/authMiddleware';

const router = Router();

// All inventory routes require authentication
router.use(authenticate);

router.get('/parts', (listParts as any));
router.get('/low-stock', (getLowStock as any));
router.get('/movements', (getMovements as any));
router.get('/top-parts', (getTopParts as any));
router.post('/parts', (createPart as any));
router.put('/parts/:id', (updatePart as any));
router.delete('/parts/:id', (deletePart as any));
router.post('/stock', (updateStock as any));
router.post('/transfer', (transferStock as any));
router.post('/parts/import', upload.single('file'), (importParts as any));

export default router;
