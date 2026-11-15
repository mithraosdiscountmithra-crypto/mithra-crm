import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';
import apiRoutes from './routes/index.js';
import { errorHandler } from './middleware/errorHandler.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: '*', // Allow all origins for dev / POS client
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// API Routes
app.use('/api', apiRoutes);

// Root route
app.get('/', (req, res) => {
  res.json({
    name: 'Multi-Tenant Merchant Loyalty and Membership SaaS CRM',
    version: '1.0.0',
    documentation: '/api/health',
    endpoints: {
      auth: '/api/auth/register, /api/auth/login, /api/auth/profile',
      plans: '/api/plans',
      customers: '/api/customers',
      memberships: '/api/memberships/assign',
      pos: '/api/pos/verify?phone=..., /api/pos/redeem, /api/pos/redemptions',
      analytics: '/api/analytics/dashboard',
      products: '/api/products, /api/products/low-stock',
      udhaar: '/api/udhaar, /api/udhaar/:customerId',
      expenses: '/api/expenses, /api/expenses/pnl',
      staff: '/api/staff, /api/staff/attendance',
      whatsapp: '/api/whatsapp/campaigns, /api/whatsapp/audience'
    }
  });
});

// Global error handler
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
  console.log(`====================================================`);
  console.log(`🚀 Merchant Loyalty & Membership SaaS Server running`);
  console.log(`📡 URL: http://localhost:${PORT}`);
  console.log(`📊 Mode: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🐘 Database: ${process.env.DATABASE_URL ? 'Neon / PostgreSQL' : 'Embedded Multi-Tenant Store'}`);
  console.log(`====================================================`);
});

export default app;
