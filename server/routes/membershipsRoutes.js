import { Router } from 'express';
import { assignMembership, cancelMembership } from '../controllers/membershipsController.js';
import { authenticateMerchant } from '../middleware/auth.js';

const router = Router();

router.use(authenticateMerchant);

router.post('/assign', assignMembership);
router.patch('/:id/cancel', cancelMembership);

export default router;
