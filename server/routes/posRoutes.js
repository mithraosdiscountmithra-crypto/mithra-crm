import { Router } from 'express';
import { verifyCustomerByPhone, processRedemption, getRedemptions } from '../controllers/posController.js';
import { authenticateMerchant } from '../middleware/auth.js';

const router = Router();

router.use(authenticateMerchant);

// Fast Cashier verification by phone
router.get('/verify', verifyCustomerByPhone);

// Redemption execution & discount deduction
router.post('/redeem', processRedemption);

// Recent cashier redemptions log
router.get('/redemptions', getRedemptions);

export default router;
