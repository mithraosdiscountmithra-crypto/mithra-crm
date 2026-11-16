import { Router } from 'express';
import { 
  getPlatformOverview, 
  createVendor, 
  toggleVendorStatus, 
  impersonateVendor 
} from '../controllers/adminController.js';
import { authenticateMerchant } from '../middleware/auth.js';

const router = Router();

// Allow authenticated merchants / platform owners to access Super Admin
router.use(authenticateMerchant);

// Get platform overview & all vendors
router.get('/overview', getPlatformOverview);
router.get('/vendors', getPlatformOverview);

// Provision new vendor
router.post('/vendors', createVendor);

// Toggle vendor active / suspended status
router.patch('/vendors/:id/status', toggleVendorStatus);

// Impersonate / switch to vendor account
router.post('/vendors/:id/impersonate', impersonateVendor);

export default router;
