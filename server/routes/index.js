import { Router } from 'express';
import authRoutes from './authRoutes.js';
import plansRoutes from './plansRoutes.js';
import customersRoutes from './customersRoutes.js';
import membershipsRoutes from './membershipsRoutes.js';
import posRoutes from './posRoutes.js';
import analyticsRoutes from './analyticsRoutes.js';
import productsRoutes from './productsRoutes.js';
import udhaarRoutes from './udhaarRoutes.js';
import expensesRoutes from './expensesRoutes.js';
import staffRoutes from './staffRoutes.js';
import whatsappRoutes from './whatsappRoutes.js';
import suppliersRoutes from './suppliersRoutes.js';
import purchaseOrdersRoutes from './purchaseOrdersRoutes.js';
import aiRoutes from './aiRoutes.js';
import voiceRoutes from './voiceRoutes.js';

const router = Router();

router.use('/auth', authRoutes);
router.use('/plans', plansRoutes);
router.use('/customers', customersRoutes);
router.use('/memberships', membershipsRoutes);
router.use('/pos', posRoutes);
router.use('/analytics', analyticsRoutes);
router.use('/products', productsRoutes);
router.use('/udhaar', udhaarRoutes);
router.use('/expenses', expensesRoutes);
router.use('/staff', staffRoutes);
router.use('/whatsapp', whatsappRoutes);
router.use('/suppliers', suppliersRoutes);
router.use('/purchase-orders', purchaseOrdersRoutes);
router.use('/ai', aiRoutes);
router.use('/voice', voiceRoutes);

// Health check endpoint
router.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'Merchant Loyalty & Membership SaaS CRM API',
    timestamp: new Date().toISOString()
  });
});

export default router;
