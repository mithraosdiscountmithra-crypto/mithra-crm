import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { getExecutiveOverview } from '../controllers/executiveController.js';

const router = Router();
router.use(requireAuth);

router.get('/overview', getExecutiveOverview);

export default router;
