import { Router } from 'express';
import {
  getUdhaarSummary,
  getCustomerLedger,
  addUdhaarEntry,
  settleUdhaarEntry
} from '../controllers/udhaarController.js';
import { authenticateMerchant } from '../middleware/auth.js';

const router = Router();

// Require merchant authentication
router.use(authenticateMerchant);

router.get('/', getUdhaarSummary);
router.get('/:customerId', getCustomerLedger);
router.post('/', addUdhaarEntry);
router.put('/:id/settle', settleUdhaarEntry);

export default router;
