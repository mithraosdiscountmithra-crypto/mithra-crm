import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { getDailySalesAnalytics } from '../controllers/salesPillarController.js';

const router = Router();
router.use(requireAuth);

router.get('/daily-analytics', getDailySalesAnalytics);

export default router;
