import { Router } from 'express';
import {
  getProducts,
  getLowStockProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct
} from '../controllers/productsController.js';
import { authenticateMerchant } from '../middleware/auth.js';

const router = Router();

// Require tenant authentication for all product endpoints
router.use(authenticateMerchant);

// Low-stock query must be before :id
router.get('/low-stock', getLowStockProducts);

router.get('/', getProducts);
router.post('/', createProduct);
router.get('/:id', getProductById);
router.put('/:id', updateProduct);
router.delete('/:id', deleteProduct);

export default router;
