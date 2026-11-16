import express from 'express';
import {
  getStorefrontProducts,
  checkCustomerMembership,
  placeCustomerOrder,
  getCustomerOrders,
  getMerchantStorefrontOrders,
  updateOrderStatus
} from '../controllers/customerController.js';
import { authenticateMerchant } from '../middleware/auth.js';

const router = express.Router();

// Public Customer Storefront Endpoints
router.get('/products', getStorefrontProducts);
router.get('/membership-check', checkCustomerMembership);
router.post('/orders', placeCustomerOrder);
router.get('/orders', getCustomerOrders);

// Authenticated Merchant Management Endpoints
router.get('/merchant-orders', authenticateMerchant, getMerchantStorefrontOrders);
router.put('/orders/:id/status', authenticateMerchant, updateOrderStatus);

export default router;
