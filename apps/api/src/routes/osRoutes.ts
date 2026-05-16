import { Router } from 'express';
import { listOS, getOSById, createOS, addItemsToOS, updateOSStatus, getTopServices } from '../controllers/OSController';
import { generateOSPDF } from '../controllers/PDFController';
import { authenticate } from '../middlewares/authMiddleware';

const router = Router();

router.use(authenticate);

router.get('/', (listOS as any));
router.get('/top-services', (getTopServices as any));
router.get('/:id', (getOSById as any));
router.get('/:id/pdf', (generateOSPDF as any));
router.post('/', (createOS as any));
router.post('/:id/items', (addItemsToOS as any));
router.patch('/:id/status', (updateOSStatus as any));

export default router;
