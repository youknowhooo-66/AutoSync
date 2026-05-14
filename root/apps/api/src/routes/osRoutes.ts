import { Router } from 'express';
import { listOS, getOSById, createOS, addItemsToOS, updateOSStatus, getTopServices } from '../controllers/OSController';
import { generateOSPDF } from '../controllers/PDFController';
import { authenticate } from '../middlewares/authMiddleware';

const router = Router();

router.use(authenticate);

router.get('/', listOS);
router.get('/top-services', getTopServices);
router.get('/:id', getOSById);
router.get('/:id/pdf', generateOSPDF);
router.post('/', createOS);
router.post('/:id/items', addItemsToOS);
router.patch('/:id/status', updateOSStatus);

export default router;
