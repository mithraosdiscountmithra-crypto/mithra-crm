import { Router } from 'express';
import { getDashboardStats } from '../controllers/analyticsController.js';
import { authenticateMerchant } from '../middleware/auth.js';

const router = Router();

router.use(authenticateMerchant);

router.get('/dashboard', getDashboardStats);

export default router;
