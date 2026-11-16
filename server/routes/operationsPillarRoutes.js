import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { generateAutoPO, getOperationsSummary } from '../controllers/operationsPillarController.js';

const router = Router();
router.use(requireAuth);

router.post('/auto-po', generateAutoPO);
router.get('/summary', getOperationsSummary);

export default router;
