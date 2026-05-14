import { Router } from 'express';
import { listParts, createPart, updatePart, deletePart, updateStock, importParts, getLowStock, getMovements, getTopParts, transferStock } from '../controllers/InventoryController';
import { upload } from '../middlewares/uploadMiddleware';
import { authenticate } from '../middlewares/authMiddleware';

const router = Router();

// All inventory routes require authentication
router.use(authenticate);

router.get('/parts', listParts);
router.get('/low-stock', getLowStock);
router.get('/movements', getMovements);
router.get('/top-parts', getTopParts);
router.post('/parts', createPart);
router.put('/parts/:id', updatePart);
router.delete('/parts/:id', deletePart);
router.post('/stock', updateStock);
router.post('/transfer', transferStock);
router.post('/parts/import', upload.single('file'), importParts);

export default router;
