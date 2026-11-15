import express from 'express';
import { 
  getPurchaseOrders, 
  getPurchaseOrderById, 
  createPurchaseOrder, 
  updatePurchaseOrderStatus 
} from '../controllers/purchaseOrdersController.js';

const router = express.Router();

router.get('/', getPurchaseOrders);
router.post('/', createPurchaseOrder);
router.get('/:id', getPurchaseOrderById);
router.put('/:id/status', updatePurchaseOrderStatus);

export default router;
