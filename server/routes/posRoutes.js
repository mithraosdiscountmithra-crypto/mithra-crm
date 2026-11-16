import { Router } from 'express';
import { verifyCustomerByPhone, processRedemption, getRedemptions, quickEnrollVIP } from '../controllers/posController.js';
import { authenticateMerchant } from '../middleware/auth.js';

const router = Router();

router.use(authenticateMerchant);

// Fast Cashier verification by phone
router.get('/verify', verifyCustomerByPhone);

// 1-Click Fast VIP Member Enrollment (Phone + Plan ID)
router.post('/quick-enroll', quickEnrollVIP);

// Redemption execution & discount deduction
router.post('/redeem', processRedemption);

// Recent cashier redemptions log
router.get('/redemptions', getRedemptions);

export default router;
