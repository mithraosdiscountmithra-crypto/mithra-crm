import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import {
  triggerAiSensyCampaign,
  getCoupons,
  createCoupon,
  verifyCoupon,
  deleteCoupon,
  getScheduledGreetings,
  triggerGreeting
} from '../controllers/marketingPillarController.js';

const router = Router();
router.use(requireAuth);

router.post('/aisensy-campaign', triggerAiSensyCampaign);
router.get('/coupons', getCoupons);
router.post('/coupons', createCoupon);
router.post('/coupons/verify', verifyCoupon);
router.delete('/coupons/:id', deleteCoupon);
router.get('/greetings', getScheduledGreetings);
router.post('/greetings/:id/trigger', triggerGreeting);

export default router;
