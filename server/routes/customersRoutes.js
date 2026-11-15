import { Router } from 'express';
import { getCustomers, createCustomer, updateCustomer, deleteCustomer } from '../controllers/customersController.js';
import { authenticateMerchant } from '../middleware/auth.js';

const router = Router();

router.use(authenticateMerchant);

router.get('/', getCustomers);
router.post('/', createCustomer);
router.put('/:id', updateCustomer);
router.delete('/:id', deleteCustomer);

export default router;
