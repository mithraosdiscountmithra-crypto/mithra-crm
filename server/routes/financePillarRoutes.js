import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { getTaxReport } from '../controllers/financePillarController.js';

const router = Router();
router.use(requireAuth);

router.get('/tax-report', getTaxReport);

export default router;
