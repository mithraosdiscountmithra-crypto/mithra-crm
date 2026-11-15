import express from 'express';
import { 
  getSuppliers, 
  getSupplierById, 
  createSupplier, 
  updateSupplier, 
  deleteSupplier,
  getSupplierLedger,
  recordSupplierPayment
} from '../controllers/suppliersController.js';

const router = express.Router();

// Suppliers CRUD
router.get('/', getSuppliers);
router.post('/', createSupplier);
router.get('/:id', getSupplierById);
router.put('/:id', updateSupplier);
router.delete('/:id', deleteSupplier);

// Accounts Payable / Supplier Ledger Statement & Payment
router.get('/:id/ledger', getSupplierLedger);
router.post('/payment', recordSupplierPayment);

export default router;
