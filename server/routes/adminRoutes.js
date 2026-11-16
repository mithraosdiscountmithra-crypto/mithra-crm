import { Router } from 'express';
import { 
  adminLogin,
  getPlatformOverview, 
  createVendor, 
  toggleVendorStatus, 
  impersonateVendor 
} from '../controllers/adminController.js';
import { authenticateSuperAdmin } from '../middleware/auth.js';

const router = Router();

// 1. Public Super Admin Master Login
router.post('/login', adminLogin);

// 2. Protected Routes (Strictly Super Admin only; vendors are rejected with 403)
router.use(authenticateSuperAdmin);

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
